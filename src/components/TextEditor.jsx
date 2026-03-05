import {
    Box,
    IconButton,
    TextField,
    Tooltip,
    useMediaQuery,
    Popper,
    Autocomplete,
    ListItem,
    ListItemText,
    Paper,
    
} from "@mui/material"

import {
    Send as SendIcon,
    AttachFile as AttachFileIcon,
    Poll as PollIcon,
} from "@mui/icons-material"

import { useState, useEffect, useRef, memo, useCallback, lazy, Suspense, useMemo } from "react";
import { useAuth } from "../providers/AuthProvider";
import MessagePreview from "./MessagePreview";
import FilePreview from "./FilePreview";

import { useChats } from "../providers/ChatsProvider";
import debounce from "lodash.debounce";
import TypingIndicator from "./TypingIndicator";
import PollCreator from "./PollCreator";
import { encryptFileBeforeUpload } from "../crypto/encryptBeforeUpload";
import { useNavigate } from "react-router-dom";
import { enc } from "crypto-js";
import { encryptId } from "../lib/crypto";
import { v4 as uuidv4 } from "uuid";
import { getQueue, saveToQueue } from "../helper/queueHelper";
const EmojiSelector = lazy(() => import('./EmojiSelector'));
const RedditPicker = lazy(() => import('./RedditPicker'));
const VoiceMessage = lazy(() => import('./VoiceMessage'));
// const PollCreator  = lazy(() => import('./PollCreator '));



const styles = {
    container: (isMobile, isChatInfo, isAddParticipant, isAddGroup, isMediaOpen) => ({
        position: "fixed",
        bottom: 0,
        padding: "5px 23px",
        width: isMobile ? "100%" : (isChatInfo || isAddParticipant || isAddGroup || isMediaOpen) ? "56vw" : "78%",
        zIndex: 1000,
        backgroundColor: "white",
    }),
    // ... other styles
};



const TextEditor = memo(({ sendMessage, textContentRef,updateMessageState, setMediaType,decryptedId, requestScrollToBottom, setMediaUrl, mediaType, mediaUrl, closePicker, setSelectedFile, selectedFile,setMediaGif, repliedMessage, updateUIState,onCancelReply, onCancelEdit, editedMessage, copiedToClipboard, setCopiedToClipboard, editMessage, recipient, isChatInfoOpen, isSharedFileOpen, isMediaOpen, isAddParticipantOpen, isAddGroupOpen, chat, type,id,  user, openFullScreen, textContent, setTextContent, dispatch}) => {

    const fileInputRef = useRef(null);
    const api = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('token');
    const { authUser } = useAuth();
    const textMirrorRef = useRef(null);
    const [ isRecording, setIsRecording ] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const navigate = useNavigate();
    const isMobileOrTablet = useMediaQuery("(max-width: 950px)");

    const [mentionAnchor, setMentionAnchor] = useState(null);
const [mentionQuery, setMentionQuery] = useState('');
const [mentionIndex, setMentionIndex] = useState(-1);
const [participants, setParticipants] = useState([]);
const [selectedMentionIndex, setSelectedMentionIndex] = useState(0); // ADD THIS LINE

   const { socket, typingUsers, setTypingUsers,} = useChats();


 
   const typingTimeoutRef = useRef(null);

    // ============================================
    // OPTIMIZATION 2: Memoize styles computation
    // ============================================
    const containerStyle = useMemo(
        () => styles.container(isMobileOrTablet, isChatInfoOpen, isAddGroupOpen, isAddParticipantOpen, isMediaOpen),
        [isMobileOrTablet, isChatInfoOpen, isAddGroupOpen, isAddParticipantOpen, isMediaOpen]
    );

    useEffect(() => {
        const loadParticipants = () => {
            if (!chat?.is_group_chat) {
                setParticipants([]);
                return;
            }

            const safeParticipants = Array.isArray(chat?.participants) 
                ? chat.participants 
                : [];
           
            console.log("safeParticipants", safeParticipants)

            const filtered = safeParticipants
                .filter(p => p?.usercode !== authUser?.user_code)
                .map(p => ({
                    ...p,
                    label: `@${p.username}`,
                    type: 'user'
                }));

            setParticipants(filtered);
        };

        loadParticipants();
    }, [chat, authUser]);

    useEffect(() => {
      if (textContentRef.current) {
        textContentRef.current.focus();
      }
    }, [chat]); 

    // ============================================
    // OPTIMIZATION 3: Memoize event handlers with useCallback
    // ============================================
    const handleGifSelect = useCallback((url, type) => {
        setMediaUrl(url);
        setMediaGif(url);
        setMediaType(type);
    }, [setMediaUrl, setMediaGif, setMediaType]);
    
    const handleFileChange = useCallback((e) => {
        if (!e.target.files) return;

        const file = e.target.files[0];

        const maxSize = 200 * 1024 * 1024;
        if (file.size > maxSize) {
            alert("File too large (max 200MB)");
            return;
        }

        setSelectedFile(file);

        const type = file.type.startsWith("image/")
            ? "image"
            : file.type.startsWith("video/")
            ? "video"
            : "file";

        setMediaType(type);

        requestAnimationFrame(() => {
            textContentRef.current?.focus();
        });
    }, [setSelectedFile, setMediaType, textContentRef]);

   
    const triggerFileInput = useCallback(() => {
        fileInputRef.current.click();
    }, []);

   const handleMentionSelect = useCallback((username) => {
    if (!textContentRef.current) return;

    const currentValue = textContentRef.current.value;
    const mentionText = `@${username}, `; // 👈 comma added

    const newValue =
        currentValue.slice(0, mentionIndex) +
        mentionText +
        currentValue.slice(textContentRef.current.selectionStart);

    setTextContent(newValue);

    setMentionAnchor(null);
    setMentionQuery('');
    setSelectedMentionIndex(0);

    requestAnimationFrame(() => {
        if (textContentRef.current) {
            const newPosition = mentionIndex + mentionText.length;
            textContentRef.current.setSelectionRange(newPosition, newPosition);
            textContentRef.current.focus();
        }
    });
}, [mentionIndex, setTextContent]);


    const handleMentionTrigger = useCallback(() => {
        if (!textContentRef.current) return;
        if (!chat?.is_group_chat) {
            setMentionAnchor(null);
            setMentionQuery('');
            setSelectedMentionIndex(0);
            return;
        }

        const value = textContentRef.current.value;
        const caretPos = textContentRef.current.selectionStart;
        const lastAt = value.lastIndexOf('@', caretPos - 1);

        if (
            lastAt > -1 &&
            (caretPos === lastAt + 1 || /^[^\s]*$/.test(value.slice(lastAt + 1, caretPos)))
        ) {
            const query = value.slice(lastAt + 1, caretPos);
            const queryChanged = query !== mentionQuery;
            
            setMentionQuery(query);
            setMentionIndex(lastAt);
            
            // Only reset selection if query actually changed (user typed a letter)
            if (queryChanged) {
                setSelectedMentionIndex(0);
            }

            // Mirror text until caret
            const beforeCaret = value.substring(0, caretPos);
            const afterCaret = value.substring(caretPos) || ".";
            const mirrorHTML =
                beforeCaret.replace(/\n/g, '<br/>') +
                '<span id="caret-marker">|</span>' +
                afterCaret.replace(/\n/g, '<br/>');

            textMirrorRef.current.innerHTML = mirrorHTML;

            const caretElement = textMirrorRef.current.querySelector('#caret-marker');
            const caretRect = caretElement.getBoundingClientRect();
            const inputRect = textContentRef.current.getBoundingClientRect();

            setMentionAnchor({
                top: caretRect.top - inputRect.top + textContentRef.current.scrollTop + 20,
                left: caretRect.left - inputRect.left,
            });
        } else {
            setMentionAnchor(null);
            setMentionQuery('');
            setSelectedMentionIndex(0);
        }
    }, [chat?.is_group_chat, textContentRef, mentionQuery]);

    // ============================================
    // OPTIMIZATION 2: Memoize filtered participants
    // ============================================
    const filteredParticipants = useMemo(() => [
        { username: "all", label: "all" },
        ...participants.filter(p => 
            p.username.toLowerCase().includes(mentionQuery.toLowerCase())
        )
    ], [participants, mentionQuery]);

    const handleMentionKeyDown = useCallback((e) => {
        // Only handle keys when mention popup is open
        if (!mentionAnchor) return;

        const maxIndex = filteredParticipants.length - 1;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedMentionIndex(prev => 
                prev < maxIndex ? prev + 1 : 0
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedMentionIndex(prev => 
                prev > 0 ? prev - 1 : maxIndex
            );
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const selectedUser = filteredParticipants[selectedMentionIndex];
            if (selectedUser) {
                handleMentionSelect(selectedUser.username);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setMentionAnchor(null);
            setMentionQuery('');
            setSelectedMentionIndex(0);
        }
    }, [mentionAnchor, filteredParticipants, selectedMentionIndex, handleMentionSelect]);

    // ============================================
    // OPTIMIZATION 4: Properly memoize debounced function
    // ============================================
    const sendTypingEvent = useMemo(
        () => debounce(() => {
            console.log("HelloTyping");
            socket.emit("typing", {
                chatId: chat?.id || null,
                userId: authUser.user_code,
                username: authUser.username,
            });
        }, 500),
        [socket, chat?.id, authUser.user_code, authUser.username]
    );

    // Clean up debounced function on unmount
    useEffect(() => {
        return () => {
            sendTypingEvent.cancel();
        };
    }, [sendTypingEvent]);

    useEffect(() => {
        if ((repliedMessage || editedMessage) && textContentRef.current) {
            textContentRef.current.focus();

            const len = textContentRef.current.value.length;
            textContentRef.current.setSelectionRange(len, len);
        }
    }, [repliedMessage, editedMessage]);

    const handlePaste = useCallback((e) => {
        if (e.clipboardData) {
            const items = e.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf("image") !== -1 || items[i].kind === "file") {
                    const file = items[i].getAsFile();
                    if (file) {
                        const maxSize = 200 * 1024 * 1024;
                        if (file.size > maxSize) {
                            alert("File is too large! Maximum allowed size is 200 MB.");
                            return;
                        }

                        setSelectedFile(file);
                        setMediaType(
                            file.type.startsWith("image/")
                                ? "image"
                                : file.type.startsWith("video/")
                                ? "video"
                                : "file"
                        );
                        requestScrollToBottom?.();
                    }
                }
            }
        }
    }, [setSelectedFile, setMediaType, requestScrollToBottom]);

    const handleTyping = useCallback(() => {
        sendTypingEvent();

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Start a new timeout
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("stopTyping", {
                chatId: chat?.id || null,
                userId: authUser.user_code,
            });
        }, 2000); // 2 seconds of inactivity
    }, [sendTypingEvent, socket, chat?.id, authUser.user_code]);

    // ============================================
    // OPTIMIZATION 6: Memoize MentionSuggestions component
    // ============================================
    const MentionSuggestions = useMemo(() => {
        if (!chat?.is_group_chat || !mentionAnchor) return null;

        return (
            <Popper
                open
                placement="top-start"
                anchorEl={{
                    getBoundingClientRect: () => {
                        const textRect = textContentRef.current.getBoundingClientRect();
                        return {
                            top: textRect.top + mentionAnchor.top - 30,
                            left: textRect.left + mentionAnchor.left,
                            right: 0,
                            bottom: 0,
                            width: 0,
                            height: 0,
                        };
                    },
                }}
                modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]}
                sx={{ zIndex: 9999 }}
            >
                <Paper sx={{ width: 250, maxHeight: 200, overflowY: 'auto' }}>
                    {filteredParticipants.map((user, index) => (
                        <ListItem
                            component="div"
                            key={user.username}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleMentionSelect(user.username);
                            }}
                            onMouseEnter={() => setSelectedMentionIndex(index)}
                            sx={{ 
                                cursor: 'pointer',
                                padding: '8px 16px',
                                backgroundColor: selectedMentionIndex === index 
                                    ? 'rgba(0, 0, 0, 0.08)' 
                                    : 'transparent',
                                '&:hover': {
                                    backgroundColor: 'rgba(0, 0, 0, 0.08)'
                                }
                            }}
                        >
                            <ListItemText primary={user.username} />
                        </ListItem>
                    ))}
                </Paper>
            </Popper>
        );
    }, [chat?.is_group_chat, mentionAnchor, filteredParticipants, selectedMentionIndex, handleMentionSelect, textContentRef]);

    useEffect(() => {
        // Only call sendMessage if both mediaUrl and mediaType are set (indicating a GIF has been selected)
        if ((!editedMessage || !selectedFile ) && ( textContentRef.current.value || (mediaUrl && (mediaType === "gif" || mediaType === "sticker")) ) ) {
            sendMessage();
            closePicker();
        }
    }, [mediaUrl, mediaType]); // Trigger on mediaUrl or mediaType change

    useEffect(() => {
        let timer;
        if (copiedToClipboard) {
            timer = setTimeout(() => {
                setCopiedToClipboard(false);
                
            }, 5000); 
        }
        return () => clearTimeout(timer);
    }, [copiedToClipboard, setCopiedToClipboard])

    useEffect(() => {
        if (editedMessage) {
            console.log("EditedMessage", editedMessage);
            textContentRef.current.value = editedMessage.textContent;
            setTextContent(editedMessage.textContent || "");
        }
    }, [editedMessage, setTextContent]);
    

    const addEmoji = useCallback((emoji) => {
        if (!textContentRef.current) return;
        
        const input = textContentRef.current;
        
        // Get current cursor position
        const start = input.selectionStart ?? textContent.length;
        const end = input.selectionEnd ?? textContent.length;
        
        // Insert emoji at cursor
        const newValue = textContent.slice(0, start) + emoji + textContent.slice(end);
        
        // Update state
        setTextContent(newValue);
        
        // Restore cursor after render
        requestAnimationFrame(() => {
            input.focus();
            input.setSelectionRange(start + emoji.length, start + emoji.length);
        });
    }, [textContent, setTextContent]);

    const sendSelectedFile = useCallback(async () => {
        if (!selectedFile) return;

        const file = selectedFile;

        const fileType =
            file.type.startsWith("image/")
                ? "image"
                : file.type.startsWith("video/")
                ? "video"
                : "file";

        const tempId = `temp-${uuidv4()}`;

        try {
            const formData = new FormData();

            if(chat) {
                const { ciphertext, nonce } = await encryptFileBeforeUpload(file, chat.id);

                const encryptedBlob = new Blob([ciphertext]);
                formData.append("file", encryptedBlob, `${file.name}.enc`);
                formData.append("nonce", nonce);
                formData.append("chat_id", chat.id);
                formData.append(
                    "key_version",
                    localStorage.getItem(`chatkey_${chat.id}_latestVersion`) || 1
                );
                if (!chat.is_group_chat) {
                    formData.append("recipient_id", recipient.user_code);
                }
            } else {
                formData.append("file", file);
            }

            formData.append("file_name", file.name);
            formData.append("media_type", fileType);
            if (type === "u") {
                formData.append("recipient_id", decryptedId);
            }

            if (repliedMessage) {
                formData.append("reply_to", repliedMessage.id);
            }

            const chatId = decryptedId;
            const recipientId = type === "u" ? decryptedId : recipient.user_code;

            if(type === "c") {
                formData.append("client_temp_id", tempId);

                // 🔹 1. CREATE OPTIMISTIC MESSAGE (UI ONLY)
                const optimisticMessage = {
                    id: tempId,
                    client_temp_id: tempId,
                    createdAt: new Date().toISOString(), 
                    chat_id: chatId,
                    media_url: file,
                    file_name: file.name,
                    text_content: null,
                    decryptedUrl: URL.createObjectURL(file),
                    media_type: fileType,
                    recipient_id: recipientId || null,
                    sender_id: authUser.user_code,
                    is_deleted_for_everyone: false,
                    isOptimistic: true,
                };

                // 🔹 2. SHOW MESSAGE IMMEDIATELY
                dispatch({
                    type: "PRE_MESSAGE",
                    payload: optimisticMessage,
                });

                setSelectedFile(null);
                setMediaType(null);

                // 🔹 Clear input immediately (Messenger behavior)
                if (repliedMessage) updateMessageState({replied: null});
            }

            const res = await fetch(`${api}/api/uploadFileMessage`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            const data = await res.json();
            if (data.status !== 1) {
                console.log("Upload failed:", data);
            }

            console.log("data after upload", data);

            // cleanup
            setSelectedFile(null);
            setMediaType(null);
            if (repliedMessage) updateMessageState({replied: null});

            if(type === "u") {
                navigate(`/conversation/c/${encodeURIComponent(encryptId(data?.newMessage?.chat_id))}`);
            }

        } catch (err) {
            dispatch({
                type: "MARK_OPTIMISTIC_FAILED",
                payload: { tempId },
            });

            saveToQueue({
                id: tempId,
                failed: true,
            });
            console.error(err);
            console.log("Failed to upload file:", err);
        }
    }, [selectedFile, chat, recipient, repliedMessage, type, decryptedId, authUser.user_code, dispatch, setSelectedFile, setMediaType, updateMessageState, api, token, navigate]);

    const sendMessageOne = useCallback(async () => {
        if (selectedFile) {
            await sendSelectedFile();
        } else {
            sendMessage();
        }
    }, [selectedFile, sendSelectedFile, sendMessage]);

    // ============================================
    // OPTIMIZATION 6: Extract TextField handlers to useCallback
    // ============================================
    const handleTextChange = useCallback((e) => {
        setTextContent(e.target.value);
    }, [setTextContent]);

    const handleKeyUp = useCallback((e) => {
        // Don't retrigger mention popup when navigating with arrow keys
        if (mentionAnchor && ['ArrowDown', 'ArrowUp'].includes(e.key)) {
            return;
        }
        handleMentionTrigger();
        handleTyping();
    }, [mentionAnchor, handleMentionTrigger, handleTyping]);

    const handleKeyDown = useCallback((e) => {
        if (e.nativeEvent.isComposing) return;
        
        // Handle mention navigation first
        if (mentionAnchor && ['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(e.key)) {
            handleMentionKeyDown(e);
            return; // Don't process other key handlers
        }
        
        // Original Enter key handler for sending messages
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            socket.emit("stopTyping", {
                chatId: chat?.id || null,
                userId: authUser.user_code,
            });

            if (editedMessage) {
                editMessage();
            } else {
                sendMessageOne();
            }
        }
    }, [mentionAnchor, handleMentionKeyDown, socket, chat?.id, authUser.user_code, editedMessage, editMessage, sendMessageOne]);

    // ============================================
    // OPTIMIZATION 2: Memoize text mirror style
    // ============================================
    const textMirrorStyle = useMemo(() => ({
        position: 'absolute',
        visibility: 'hidden',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        fontSize: '16px',
        fontFamily: 'inherit',
        padding: '8.5px 14px',
        width: textContentRef.current
            ? `${textContentRef.current.offsetWidth}px`
            : '100%',
    }), [textContentRef.current?.offsetWidth]);

    // Get current chat ID for typing indicator
    const currentChatId = chat?.id || decryptedId;

    return (
        <Box
            sx={containerStyle}
        >
            {(
  (repliedMessage && repliedMessage.chat_id == chat.id) ||
  (editedMessage && editedMessage.chat_id == chat.id)
) && (
  <MessagePreview
    message={repliedMessage || editedMessage}
    onCancel={repliedMessage ? onCancelReply : onCancelEdit}
    type={repliedMessage ? "reply" : "edit"}
    api={api}
  />
)}

            {selectedFile && (
                <FilePreview
                    file={selectedFile}
                    mediaType={mediaType}
                    onCancel={() => {
                        setSelectedFile(null);
                        setMediaType(null);
                    }}
                />
            )}

            {typingUsers.size > 0 && (
                <TypingIndicator typingUsers={typingUsers.get(currentChatId) || new Map()} />
            )}
            
            {copiedToClipboard && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: '-30px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        padding: '5px',
                        backgroundColor: '#808080',
                        color: '#fff',
                        borderRadius: '4px',
                        fontSize: '14px',
                        textAlign: 'center',
                    }}
                >
                    Copied to clipboard
                </Box>
            )}
               
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >   
                    <Tooltip title="Attach File">
                        <IconButton
                            aria-label="attach file"
                            onClick={triggerFileInput}
                            sx={{
                                "&:hover": {
                                    background: "transparent",
                                }
                            }}
                        >
                            <AttachFileIcon />
                        </IconButton>
                    </Tooltip>
                    <input 
                        ref={fileInputRef}
                        type="file" 
                        style={{ display: 'none'}}
                        onChange={handleFileChange}
                    />
                     
                    <Suspense fallback={<div>loading...</div>}>
                        <RedditPicker onSelectGif={handleGifSelect} closePicker={closePicker}/>
                    </Suspense>
                
                    <Suspense fallback={<div>Loading Emoji Selector...</div>}>
                        <EmojiSelector onSelect={addEmoji} />
                    </Suspense>
                </Box>

                {chat?.is_group_chat && (
                    <PollCreator chat={chat} recipient={recipient}/>
                )}

                <Box
                    sx={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        borderRadius: "8px",
                        px: 1,
                        py: 0.5,
                    }}
                >
                    <TextField
                        fullWidth
                        multiline
                        minRows={1}
                        maxRows={5}
                        value={textContent}
                        onChange={handleTextChange}
                        type="text"
                        placeholder={chat?.is_group_chat ? `Type @ to mention someone` : `Type a message`}
                        inputRef={textContentRef}
                        onKeyUp={handleKeyUp}
                        onClick={handleMentionTrigger} 
                        onPaste={handlePaste} 
                        onKeyDown={handleKeyDown}
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                borderRadius: "8px",
                                fontSize: "15px",
                                "& fieldset": {
                                    borderColor: "#C6C6C8",
                                },
                                "&.Mui-focused fieldset": {
                                    border: "1px solid #121660",
                                },
                            },
                        }}
                    />

                    <div
                        ref={textMirrorRef}
                        style={textMirrorStyle}
                    />
                </Box>

                <Suspense fallback={<div>loading...</div>}>
                    <VoiceMessage 
                        chat={chat}
                        recipient={recipient}
                        type={type}
                        id={id}
                        mediaType={mediaType}
                        mediaUrl={mediaUrl}
                        setMediaType={setMediaType}
                        setMediaUrl={setMediaUrl}
                        setMediaGif={setMediaGif}
                        repliedMessage={repliedMessage}
                        updateMessageState={updateMessageState}
                        user={user}
                        isRecording={isRecording}
                        setIsRecording={setIsRecording}
                        audioBlob={audioBlob}
                        setAudioBlob={setAudioBlob}
                    />
                </Suspense>

                {!audioBlob && (
                    <Tooltip title="Send">
                        <IconButton
                            aria-label="Send"
                            onClick={editedMessage ? editMessage : sendMessageOne}
                            sx={{
                                "&:hover": {
                                    background: "transparent",
                                }
                            }}
                        >
                            <SendIcon 
                                sx={{ 
                                    fontSize: "23px", 
                                    color: "#121660",
                                    transform: 'rotate(-20deg)'
                                }}
                            />
                        </IconButton>
                    </Tooltip>
                )}
                {MentionSuggestions}
            </Box>
        </Box>
    )
});

export default TextEditor;
