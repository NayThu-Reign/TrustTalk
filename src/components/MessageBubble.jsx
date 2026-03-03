import {
    Avatar,
    Box,
    Typography,
    Button,
    IconButton,
    Menu,
    MenuItem,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Tooltip,
    useMediaQuery,
    Popover,
    TextField,

} from "@mui/material"

import {
    InsertDriveFile as InsertDriveFileIcon,
    Edit as EditIcon,
    PushPin as PushPinIcon,
    Delete as DeleteIcon,
    DeleteOutline as DeleteOutlineIcon,
    Reply as ReplyIcon,
    ContentCopy as ContentCopyIcon,
    MoreHoriz as MoreHorizIcon,
    FileDownload as FileDownloadIcon,
    EmojiEmotionsOutlined as EmojiEmotionsOutlinedIcon,
    Visibility as VisibilityIcon,
    Error as ErrorIcon,
    Replay as ReplayIcon,
    DoneAll as DoneAllIcon,
    Check as CheckIcon,

} from "@mui/icons-material"
import { keyframes } from "@mui/system";



import React, { useState, useEffect, useRef, lazy, Suspense, } from "react";
import PollDemo from "./PollDemo";
import { useAuth } from "../providers/AuthProvider";
import { removeFromQueue, saveToQueue } from "../helper/queueHelper";
import { ChatAudio, ChatImage, ChatVideo } from "./ChatMediaComponents";
import MessageSync from "./MessageSync";

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;



const ForwardMessageDrawer = lazy(() => import("../components/ForwardMessageDrawer"));
const ReactionsDrawer = lazy(() => import("../components/ReactionsDrawer"));



function MessageBubble({
    item,
    index,
    clickedMessages,
    messageRefs,
    handleMouseEnter,
    handleMouseLeave,
    visibleMessageList,
    hoveredMessageId,
    handleMenuClick,
    chat,
    handleToggleSendText,
    isMobileOrTablet,
    highlightedMessageId,
    MentionText,
    handleDeleteMessageOpen,
    handleDeleteMessageClose,
    handleReply,
    handleMenuClose,
    formatTime,
    searchTerm,
    handleDeleteMessage,
    reactionIcons,
    fullscreenImage,
    closeFullscreen,
    openFullscreen,
    handleOpenReactionDrawer,
    handleCopyText,
    recipient,
    updateMessageState,
    downloadedMessages,
    handleFileDownloadWrapper,
    anchorER,
    handleCloseForwardMessageDrawer,
    handleCloseReactionDrawer,
    handleCloseReactionPicker,
    userReaction,
    handleRemoveReaction,
    handleReactionSelect,
    anchorElS1,
    selectedMessage,
    setSelectedMessage,
    forwardMessageDrawer,
    selectedMessageId,
    reactionDrawer,
    deleteMessageOpen,
    isParticipant,
    handleOpenReactionPicker,
    handleEdit,
    handleOpenForwardMessageDrawer,
    handlePinMessage,
    handleUnPinMessage,
    handleDeleteMessageForSelf,
    sendEncryptedMessage,
    sendEncryptedFileMessage,
    handleRetryFileMessage,

}) {
    const { authUser } = useAuth();
    const isMessage = item.type === "message";
    const isLeft = item.type === "left";
    const isJoin = item.type === "join";
    const [openViewedBy, setOpenViewedBy] = useState(false);
   
    const chatId = chat?.id || null;
    const { fetchMessage } = MessageSync({chatId});
    


    const api = import.meta.env.VITE_API_URL;
    const isLatestMessage = index === visibleMessageList.length - 1;
    const isSendTextVisible = clickedMessages.includes(item.id) || item.failed;

    messageRefs.current[item.id] = messageRefs.current[item.id] || React.createRef();
    const userHasReacted = item.reactions?.some(
        (reaction) => reaction.user_id === authUser.user_code
    );

    const userHasNotReacted = item.reactions?.some(
        (reaction) => reaction.user_id !== authUser.user_code
    );


    const reactionType = userHasReacted
        ? item.reactions?.find((reaction) => reaction.user_id === authUser.user_code)?.reaction_type
        : null;

    const otherReaction = (userHasNotReacted && chat?.is_group_chat === false)
        ? item.reactions?.find((reaction) => reaction.user_id !== authUser.user_code)?.reaction_type
        : null;

        
        const reactionCounts =
        item?.reactions?.reduce((acc, r) => {
          acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1;
          return acc;
        }, {}) || {};
      

        const sortedReactions = Object.entries(reactionCounts)
        .sort((a, b) => b[1] - a[1]);
      
      const topTwo = sortedReactions.slice(0, 2);
      const others = sortedReactions.slice(2);
      
      const othersCount = others.reduce(
        (sum, [, count]) => sum + count,
        0
      );
      


    const viewedByCount = Array.isArray(item?.viewed_by)
  ? item.viewed_by.length
  : typeof item?.viewed_by === "string"
    ? JSON.parse(item.viewed_by).length
    : 0;

    const handleRetryMessage = async (message) => {
        const tempId = message.client_temp_id || message.id;

        try {
            const response = await sendEncryptedMessage({
            text_content: message.text_content,
            mediaUrl: message.media_url,
            mediaType: message.media_type,
            mediaGif: message.media_gif,
            repliedMessage: message.reply_to,
            fileName: message.file_name,
            recipientId: message.recipient_id,
            chat,
            tempId,
            });

            if (response.status === 201) {
            dispatch({
                type: "REMOVE_OPTIMISTIC_MESSAGE",
                payload: { tempId },
            });

            removeFromQueue(tempId);
            }
        } catch {
            saveToQueue(message);
        }
    };

    console.log("iitem", item);
    



    return (


        <Box>
            {(isMessage && !JSON.parse(item.deleted_by || "[]").includes(authUser.user_code)) && (
                <Box
    key={item.id || `message-${index}`}
    ref={messageRefs.current[item.id]}
    data-id={item.id}
    className="message-item"
    sx={{
        display: "flex",
        alignItems: "center",
        justifyContent:
            ["leave", "join", "Pinned", "UnPinned"].includes(item.media_type)
                ? "center"
                : item.sender_id === authUser.user_code
                    ? "flex-end"
                    : "flex-start",
        marginTop: "40px",
        marginRight: item.sender_id === authUser.user_code ? "15px" : "10px",
        paddingLeft: item.media_type === "leave" ? "5px" : "24px",
        paddingRight: item.media_type === "leave" ? "5px" : "24px",
        marginBottom: "20px",
        overflow: 'visible',
        animation: `${fadeInUp} 0.3s ease-out`,
    }}
>
    <Box>
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
            }}
        >
            <Box
                sx={{
                    marginLeft: item.sender_id === authUser.user_code ? "auto" : "10px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: item.sender_id === authUser.user_code ? "center" : "flex-start",
                }}
            >
                {/* Reply Preview */}
                {item.originalMessage && (
                    <Box
                        sx={{
                            padding: "6px 12px",
                            backgroundColor: "#90caf9",
                            borderRadius: "8px 8px 0 0",
                            borderLeft: "4px solid #0288d1",
                            width: "fit-content",
                            maxWidth: "300px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            fontSize: "14px",
                            color: "#424242",
                            marginBottom: "2px",
                        }}
                        onClick={() => handleScrollToMessage(item.originalMessage.id)}
                    >
                        {item.originalMessage?.media_type === "image" ? (
                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: "bold", color: "#0288d1" }}>
                                    {item.originalMessage.sender?.username || 'Unknown'}
                                </Typography>
                                <ChatImage item={item.originalMessage} openFullscreen={openFullscreen} type="reply" />
                            </Box>
                        ) : (item.originalMessage?.media_type === "gif" || item.originalMessage?.media_type === "sticker") ? (
                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: "bold", color: "#0288d1" }}>
                                    {item.originalMessage.sender?.username || 'Unknown'}
                                </Typography>
                                <Box>
                                    <img
                                        src={item.originalMessage?.decryptedUrl || item.originalMessage?.media_url}
                                        alt="Gif"
                                        width={20}
                                        height={20}
                                    />
                                </Box>
                            </Box>
                        ) : item.originalMessage?.media_type === "file" ? (
                            <Box>
                                <Typography>File Attachment</Typography>
                            </Box>
                        ) : item.originalMessage?.media_type === "poll" ? (
                            <Box>
                                <Typography>Poll Message</Typography>
                            </Box>
                        ) : item.originalMessage?.media_type === "audio" ? (
                            <Box>
                                <Typography>Audio</Typography>
                            </Box>
                        ) : item.originalMessage?.media_type === "video" ? (
                            <Box>
                                <Typography>Video</Typography>
                            </Box>
                        ) : (
                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: "bold", color: "#0288d1" }}>
                                    {item.originalMessage.sender?.username || 'Unknown'}
                                </Typography>
                                <Typography variant="body2">
                                    {item.originalMessage?.text_content ?? ''}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}

                {/* Forwarded Label */}
               

                {/* Message Actions Row */}
                <Box sx={{ display: "flex", alignItems: "center", flexDirection: item.sender_id === authUser.user_code ? "row" : "row-reverse" }}>
                    {/* Action buttons - positioned based on sender */}
                    {(item.is_deleted_for_everyone === false) && 
                    (item.media_type !== "leave" && item.media_type !== "join" && item.media_type !== "Pinned" && item.media_type !== "UnPinned") && (
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            <IconButton
                                onClick={() => {
                                    handleReply(item);
                                    handleMenuClose();

                                }}
                                sx={{
                                    height: "100%",
                                    "&:hover": {
                                        background: "transparent"
                                    }
                                }}
                            >
                                <ReplyIcon />
                            </IconButton>
                            <IconButton
                                onClick={(event) => handleMenuClick(event, item.id, item)}
                                sx={{
                                    height: "100%",
                                    "&:hover": {
                                        background: "transparent"
                                    }
                                }}
                            >
                                <MoreHorizIcon />
                            </IconButton>

                            {item.media_type !== "poll" && (
                                <Box>
                                    <IconButton
                                        aria-label="open reaction"
                                        sx={{
                                            "&:hover": {
                                                background: "transparent",
                                            }
                                        }}
                                        onClick={(event) => handleOpenReactionPicker(event, item)}
                                    >
                                        {reactionType ? (
                                            <Typography
                                                sx={{
                                                    fontSize: "16px",
                                                    filter: "saturate(1.5) contrast(1.2)",
                                                    lineHeight: 1,
                                                }}
                                            >
                                                {reactionIcons[reactionType]}
                                            </Typography>
                                        ) : (
                                            <EmojiEmotionsOutlinedIcon />
                                        )}
                                    </IconButton>

                                    <Popover
                                        open={Boolean(anchorER)}
                                        anchorEl={anchorER}
                                        onClose={handleCloseReactionPicker}
                                        anchorOrigin={{
                                            vertical: 'bottom',
                                            horizontal: 'center',
                                        }}
                                        transformOrigin={{
                                            vertical: 'top',
                                            horizontal: 'center',
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'row',
                                                gap: 1,
                                                padding: 1,
                                            }}
                                        >
                                            {['like', 'love', 'haha', 'wow', 'sad', 'angry'].map((reaction) => (
                                                <IconButton
                                                    key={reaction}
                                                    sx={{
                                                        borderRadius: '50%',
                                                        background: userReaction === reaction ? '#0288d1' : 'transparent',
                                                        "&:hover": {
                                                            background: "#f0f0f0",
                                                        },
                                                    }}
                                                    onClick={() =>
                                                        userReaction === reaction
                                                            ? handleRemoveReaction()
                                                            : handleReactionSelect(reaction)
                                                    }
                                                >
                                                    {reactionIcons[reaction]}
                                                </IconButton>
                                            ))}
                                        </Box>
                                    </Popover>
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* Message Content Container */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: chat?.is_group_chat && item.sender_id !== authUser.user_code && !["leave", "join"].includes(item.media_type) 
                                ? "flex-start" 
                                : "center",
                            gap: "8px",
                            marginY: 1,
                        }}
                    >
                        {/* Avatar (only for group chat, non-self messages) */}
                        {chat?.is_group_chat && item.sender_id !== authUser.user_code && !["leave", "join"].includes(item.media_type) && (
                            <Avatar
                                src={item.sender?.user_photo ? `${api}/${item.sender.user_photo}` : undefined}
                                alt={item.sender?.username || "username"}
                                sx={{ width: 25, height: 25 }}
                            >
                                {!item.sender?.user_photo && item.sender?.username[0]?.toUpperCase()}
                            </Avatar>
                        )}

                        {/* Message Bubble Wrapper */}
                        <Box>
                            {/* Sender name (only for group chat, non-self messages) */}
                            {chat?.is_group_chat && item.sender_id !== authUser.user_code && !["leave", "join"].includes(item.media_type) && (
                                <Typography
                                    sx={{ fontSize: "12px", color: "#808080", fontWeight: 500 }}
                                >
                                    {item.sender?.username}
                                </Typography>
                            )}

                            {/* Message Bubble */}
                            <Box
                                onClick={() => handleToggleSendText(item.id)}
                                sx={{
                                    position: "relative",
                                    paddingLeft: isMobileOrTablet ? "10px" : (item.media_type === "leave" || item.media_type === "join" || item.media_type === "Pinned" || item.media_type === "UnPinned") ? "10px" : "15px",
                                    paddingRight: isMobileOrTablet ? "10px" : (item.media_type === "leave" || item.media_type === "join" || item.media_type === "Pinned" || item.media_type === "UnPinned") ? "10px" : "15px",
                                    paddingTop: "5px",
                                    paddingBottom: "5px",
                                    background:
                                        ["leave", "join", "Pinned", "UnPinned"].includes(item.media_type)
                                            ? "#a6a6a6"
                                            : item.sender_id === authUser.user_code
                                                ? "#c2e6fc"
                                                : "#78788014",
                                    color: (item.media_type === "leave" || item.media_type === "join" || item.media_type === "Pinned" || item.media_type === "UnPinned") ? "#fff" : "#000",
                                    borderRadius: (item.media_type === "leave" || item.media_type === "join" || item.media_type === "Pinned" || item.media_type === "UnPinned") ? "15px" : "8px",
                                    border: highlightedMessageId === item.id ? "2px solid #000" : "none",
                                    overflow: "visible",
                                    ...(item.media_type === "poll" && {
                                        width: "100%",
                                        maxWidth: 500,
                                        flexGrow: 1,
                                    }),
                                }}
                            >

                                {item.forwarded_from && (
                                        <Typography
                                            variant="caption"
                                            sx={{
                                            
                                                fontSize: "12px",
                                                fontWeight: "400",
                                                color: "#8E8E93",
                                            }}
                                        >
                                            Forwarded
                                        </Typography>
                                )}
                                {/* Message Content */}
                                {(item.media_url && (item.media_type === 'gif' || item.media_type === 'sticker')) ? (
                                    <img
                                        src={item.media_url}
                                        alt={item.media_type === 'gif' ? 'GIF' : 'Sticker'}
                                        style={{
                                            width: '300px',
                                            height: '300px',
                                            borderRadius: '8px'
                                        }}
                                    />
                                ) : item.media_type === 'image' ? (
                                    <Box>
                                        <ChatImage item={item} openFullscreen={openFullscreen} fetchMessage={fetchMessage}/>
                                    </Box>
                                ) : item.media_type === 'file' ? (
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            backgroundColor: '#f0f0f0',
                                            borderRadius: '8px',
                                            padding: '8px',
                                            width: isMobileOrTablet ? '210px' : "100%",
                                            maxWidth: '100%',
                                        }}
                                    >
                                        <InsertDriveFileIcon sx={{ fontSize: '30px', color: '#3f51b5' }} />
                                        <Box>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    width: isMobileOrTablet ? "80px" : "100%",
                                                    overflow: isMobileOrTablet && "hidden",
                                                    whiteSpace: isMobileOrTablet && "nowrap",
                                                    textOverflow: isMobileOrTablet && "ellipsis",
                                                }}
                                            >
                                                {item.isOptimistic ? item.file_name : item.media_url.split('/').pop().replace('.enc', '')}
                                            </Typography>
                                        </Box>
                                        {!downloadedMessages.includes(item.id) && (
                                            <a
                                                style={{ marginLeft: 'auto', textDecoration: 'none' }}
                                                aria-label={`Download ${item.isOptimistic ? item.file_name : item.media_url.split('/').pop().split('_').slice(1).join('_')}`}
                                            >
                                                <IconButton
                                                    aria-label="download file"
                                                    onClick={() => handleFileDownloadWrapper(item, item.chat_id)}
                                                >
                                                    <FileDownloadIcon />
                                                </IconButton>
                                            </a>
                                        )}
                                    </Box>
                                ) : item.text_content !== null ? (
                                    <MentionText text={item.text_content} searchTerm={searchTerm} />
                                ) : item.media_type === 'video' ? (
                                    <ChatVideo item={item} />
                                ) : item.media_type === 'audio' ? (
                                    <Box sx={{ widht: "400px" }}>
                                        <ChatAudio item={item} />
                                    </Box>
                                ) : item.media_type === "poll" ? (
                                    <PollDemo pollData={item.Poll} chatId={chat?.id} isParticipant={isParticipant} />
                                ) : (
                                    <Typography variant="body1" sx={{ color: "#8E8E93" }}>
                                        {item.deleted_by_user_id === authUser.user_code ? 'You deleted a message' : `${item.deletedByUser?.username} deleted a message`}
                                    </Typography>
                                )}

                                {/* Message Metadata (reactions, views, timestamp) */}
                                {(item.media_type !== "leave" && item.media_type !== "join" && item.media_type !== "Pinned" && item.media_type !== "UnPinned" && item.is_deleted_for_everyone === false) && (
                                    <Box
                                        sx={{ 
                                            display: "flex", 
                                            alignItems: "center", 
                                            justifyContent: "space-between", 
                                            marginTop: "5px", 
                                            gap: "18px"
                                        }}
                                    >
                                        {/* Reactions Summary */}
                                        {chat?.is_group_chat && item?.reactions?.length > 0 && (
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                    background: "#f1f1f1",
                                                    borderRadius: "12px",
                                                    fontSize: "12px"
                                                }}
                                            >
                                                {topTwo?.map(([type, count]) => (
                                                    <Box key={type} sx={{ display: "flex", alignItems: "center", gap: "2px" }}>
                                                        <span>{reactionIcons[type]}</span>
                                                        <span>{count}</span>
                                                    </Box>
                                                ))}
                                                {othersCount > 0 && (
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: "2px" }}>
                                                        <span>➕</span>
                                                        <span>{othersCount}</span>
                                                    </Box>
                                                )}
                                            </Box>
                                        )}

                                        {/* Right side metadata */}
                                        <Box sx={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end", marginLeft: "auto" }}>
                                            {/* Viewed by (group chat only) */}
                                            {chat?.is_group_chat && (
                                                <IconButton
                                                    size="small"
                                                    sx={{ padding: 0, fontSize: "12px" }}
                                                    onClick={() => {
                                                        updateMessageState({selected: item});
                                                        
                                                        setOpenViewedBy(true);
                                                    }}
                                                >
                                                    <VisibilityIcon sx={{ fontSize: 16, marginRight: "3px" }} />
                                                    {viewedByCount}
                                                </IconButton>
                                            )}

                                            {/* Timestamp and read status */}
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: item.sender_id === authUser.user_code ? "#000000" : "#8E8E93",
                                                    fontSize: "11px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "4px",
                                                }}
                                            >
                                                {item.edited === true && (
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            fontSize: "12px",
                                                            fontWeight: "400",
                                                            color: "#000000",
                                                        }}
                                                    >
                                                        Edited
                                                    </Typography>
                                                )}
                                                {formatTime(item.createdAt || item.created_at)}
                                                {item.sender_id === authUser.user_code && (
                                                    <>
                                                        {!item.viewed_by?.includes(recipient?.user_code) && (
                                                            <span style={{ fontSize: "16px", color: "#000000" }}>
                                                                <CheckIcon fontSize="20px" />
                                                            </span>
                                                        )}
                                                        {item.viewed_by?.includes(recipient?.user_code) && (
                                                            <span style={{ fontSize: "16px", color: "#34C759" }}>
                                                                <DoneAllIcon fontSize="20px" />
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}

                                {/* Reaction Badge Overlay */}
                                {otherReaction && (
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            bottom: "-10px",
                                            right: "5px",
                                            backgroundColor: "#fff",
                                            borderRadius: "50%",
                                            padding: "4px",
                                            boxShadow: "0px 0px 5px rgba(0,0,0,0.2)",
                                            zIndex: 100,
                                        }}
                                    >
                                        {reactionIcons[otherReaction]}
                                    </Box>
                                )}

                                {/* Fullscreen Image Viewer */}
                                {fullscreenImage && (
                                    <div
                                        onClick={closeFullscreen}
                                        style={{
                                            position: 'fixed',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            zIndex: 1500,
                                            cursor: 'zoom-out',
                                        }}
                                    >
                                        <img
                                            src={fullscreenImage}
                                            alt="Full-size"
                                            style={{
                                                maxWidth: '90%',
                                                maxHeight: '90%',
                                                borderRadius: '8px',
                                            }}
                                        />
                                    </div>
                                )}
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    </Box>

    {/* Viewed By Dialog */}
    <Dialog
        open={openViewedBy}
        onClose={() => setOpenViewedBy(false)}
        maxWidth="xs"
        fullWidth
    >
        <DialogTitle>Seen by</DialogTitle>
        <DialogContent sx={{ paddingTop: 1 }}>
            {(() => {
                if (!selectedMessage) return null;
                
                // Handle both array and string formats
                const viewedBy = Array.isArray(selectedMessage.viewed_by)
                    ? selectedMessage.viewed_by
                    : (() => {
                        try {
                            return JSON.parse(selectedMessage.viewed_by);
                        } catch {
                            return [];
                        }
                    })();

                return viewedBy.length > 0 ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {chat.participants
                            .filter(
                                participant =>
                                    viewedBy.includes(participant.user_code) &&
                                    participant.user_code !== selectedMessage.sender_id
                            )
                            .map(viewer => (
                                <Box
                                    key={viewer.user_code}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        padding: "8px 10px",
                                        borderRadius: "10px",
                                        transition: "0.2s",
                                        "&:hover": {
                                            backgroundColor: "#f5f5f5",
                                        },
                                    }}
                                >
                                    <Avatar
                                        src={viewer.user_photo ? `${api}/${viewer.user_photo}` : ""}
                                        alt={viewer.username[0]}
                                        sx={{ width: 40, height: 40 }}
                                    />
                                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                                        <Typography sx={{ fontSize: "14px", fontWeight: 500 }}>
                                            {viewer.username}
                                        </Typography>
                                        <Typography sx={{ fontSize: "12px", color: "text.secondary" }}>
                                            Seen
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                    </Box>
                ) : (
                    <Typography variant="body2">No viewers yet</Typography>
                );
            })()}
        </DialogContent>
    <DialogActions>
        <Button onClick={() => setOpenViewedBy(false)}>Close</Button>
    </DialogActions>
</Dialog>

    {/* Context Menu */}
    {item.is_deleted_for_everyone == false && (
        <Menu
            anchorEl={anchorElS1}
            open={Boolean(anchorElS1)}
            onClose={handleMenuClose}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
            }}
            slotProps={{
                paper: {
                    sx: {
                        width: '173px',
                        padding: "8px",
                        borderRadius: '8px',
                        backgroundColor: "#ffffff",
                        color: "#000000",
                        boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)"
                    },
                },
            }}
        >
            <Box sx={{ width: "100%", borderBottom: "1px solid #E5E5EA" }}>
                {selectedMessage?.media_type !== "poll" && (
                    <MenuItem
                        onClick={() => handleOpenForwardMessageDrawer()}
                        sx={{
                            padding: "0",
                            height: "21px",
                            marginBottom: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <Typography sx={{ fontSize: "14px", fontWeight: "400", color: "#121660" }}>
                            Forward
                        </Typography>
                        <IconButton>
                            <ReplyIcon sx={{ fontSize: "20px" }} />
                        </IconButton>
                    </MenuItem>
                )}

                {(selectedMessage?.text_content !== null && selectedMessage?.sender_id === authUser.user_code && selectedMessage?.media_type !== "poll") && (
                    <MenuItem
                        sx={{
                            padding: "0",
                            height: "21px",
                            marginBottom: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                        onClick={() => {
                            handleEdit(selectedMessage)
                            handleMenuClose()
                        }}
                    >
                        <Typography sx={{ fontSize: "14px", fontWeight: "400", color: "#121660" }}>
                            Edit text
                        </Typography>
                        <IconButton>
                            <EditIcon sx={{ fontSize: "20px" }} />
                        </IconButton>
                    </MenuItem>
                )}

                <MenuItem
                    onClick={() => {
                        handleReply(selectedMessage)
                        handleMenuClose();
                    }}
                    sx={{
                        padding: "0",
                        height: "21px",
                        marginBottom: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <Typography sx={{ fontSize: "14px", fontWeight: "400", color: "#121660" }}>
                        Reply
                    </Typography>
                    <IconButton>
                        <ReplyIcon sx={{ fontSize: "20px" }} />
                    </IconButton>
                </MenuItem>

                {selectedMessage?.media_type !== "poll" && (
                    <MenuItem
                        onClick={() => handleOpenReactionDrawer()}
                        sx={{
                            padding: "0",
                            height: "21px",
                            marginBottom: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <Typography sx={{ fontSize: "14px", fontWeight: "400", color: "#121660" }}>
                            Reacts
                        </Typography>
                        <IconButton>
                            <EmojiEmotionsOutlinedIcon sx={{ fontSize: "20px" }} />
                        </IconButton>
                    </MenuItem>
                )}

                {(selectedMessage?.media_type !== "poll" && selectedMessage?.media_type !== "gif" && selectedMessage?.media_type !== "sticker" && selectedMessage?.media_type !== "file") && (
                    <MenuItem
                        sx={{
                            padding: "0",
                            height: "21px",
                            marginBottom: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                        onClick={() => {
                            selectedMessage?.text_content 
                                ? handleCopyText(selectedMessage.text_content) 
                                : (selectedMessage?.media_type === "gif" || selectedMessage?.media_type === "sticker") 
                                    ? copyImageToClipboard(selectedMessage.media_url) 
                                    : copyImageToClipboard(selectedMessage.decryptedUrl);
                            handleMenuClose()
                        }}
                    >
                        <Typography sx={{ fontSize: "14px", fontWeight: "400", color: "#121660" }}>
                            Copy
                        </Typography>
                        <IconButton>
                            <ContentCopyIcon sx={{ fontSize: "20px" }} />
                        </IconButton>
                    </MenuItem>
                )}

                {selectedMessage?.media_type !== "poll" && (
                    <MenuItem
                        sx={{
                            height: "21px",
                            marginBottom: "12px",
                            padding: "0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                        onClick={() => {
                            handlePinMessage(selectedMessageId)
                            handleMenuClose()
                        }}
                    >
                        <Typography sx={{ fontSize: "14px", fontWeight: "400", color: "#121660" }}>
                            Pin
                        </Typography>
                        <IconButton>
                            <PushPinIcon sx={{ fontSize: "20px" }} />
                        </IconButton>
                    </MenuItem>
                )}
            </Box>

            <Box sx={{ width: "100%" }}>
                <MenuItem
                    sx={{
                        padding: "0",
                        height: "21px",
                        marginBottom: "12px",
                        marginTop: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                    onClick={() => {
                        handleDeleteMessageForSelf(selectedMessageId)
                        handleMenuClose()
                    }}
                >
                    <Typography sx={{ fontSize: "14px", fontWeight: "400", color: "#FF3B30" }}>
                        Delete for myself
                    </Typography>
                    <IconButton>
                        <DeleteOutlineIcon sx={{ color: "#FF3B30", fontSize: "20px" }} />
                    </IconButton>
                </MenuItem>

                {selectedMessage?.sender_id === authUser.user_code && (
                    <MenuItem
                        sx={{
                            padding: "0",
                            height: "21px",
                            marginBottom: "12px",
                            marginTop: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                        onClick={() => handleDeleteMessageOpen(selectedMessageId)}
                    >
                        <Typography sx={{ fontSize: "14px", fontWeight: "400", color: "#FF3B30" }}>
                            Delete for all
                        </Typography>
                        <IconButton>
                            <DeleteIcon sx={{ color: "#FF3B30", fontSize: "20px" }} />
                        </IconButton>
                    </MenuItem>
                )}

                {forwardMessageDrawer && (
                    <Suspense fallback={<div>Loading ...</div>}>
                        <ForwardMessageDrawer 
                            openForwardMessageDrawer={forwardMessageDrawer} 
                            closeForwardMessageDrawer={handleCloseForwardMessageDrawer} 
                            selectedMessageId={selectedMessageId} 
                            handleMenuClose={handleMenuClose} 
                            forwardedMessage={selectedMessage} 
                        />
                    </Suspense>
                )}
                {reactionDrawer && (
                    <Suspense fallback={<div>Loading ...</div>}>
                        <ReactionsDrawer 
                            openReactionDrawer={reactionDrawer} 
                            closeReactionDrawer={handleCloseReactionDrawer} 
                            selectedMessageId={selectedMessageId} 
                            handleMenuClose={handleMenuClose} 
                        />
                    </Suspense>
                )}

                {deleteMessageOpen && (
                    <Dialog open={deleteMessageOpen} onClose={handleDeleteMessageClose}>
                        <DialogTitle>{"Are you sure you want to delete this message?"}</DialogTitle>
                        <DialogActions>
                            <Button onClick={handleDeleteMessageClose} color="primary">
                                Cancel
                            </Button>
                            <Button onClick={handleDeleteMessage} color="secondary" autoFocus>
                                Yes
                            </Button>
                        </DialogActions>
                    </Dialog>
                )}
            </Box>
        </Menu>
    )}
                </Box>
            )}



            {isLeft && (
                <Box
                    key={index}
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        paddingTop: "10px",
                    }}

                >

                </Box>
            )}
            {isJoin && (
                <Box
                    key={index}
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        paddingTop: "10px",
                    }}

                >

                </Box>
            )}

        </Box>

    );
}

export default React.memo(MessageBubble);