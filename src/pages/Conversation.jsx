import {
  Box,
  Typography,
  Button,
  IconButton,
  useMediaQuery,
 
} from "@mui/material";

import {
  ArrowDownward as ArrowDownwardIcon,
} from "@mui/icons-material";

import React, {
  useState,
  useReducer,
  useEffect,
  useLayoutEffect,
  useRef,
  lazy,
  Suspense,
  useMemo,
  useCallback,
} from "react";
import { useUIState } from "../providers/UIStateProvider";
import { useAuth } from "../providers/AuthProvider";
import TextEditor from "../components/TextEditor";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useChats } from "../providers/ChatsProvider";
import Linkify from "react-linkify";
import TimeAgo from "../components/TimeAgo";
import VisibilityMessages from "../components/VisibilityMessages";
import { fetchWithAuth } from "../hooks/fetchWithAuth";
import { handleFileDownload } from "../lib/libSodium";
import { decryptInWorker, encryptInWorker } from "../crypto/cryptoClient";
import {
  formatMessageDate,
  formatTime,
  formatDate,
} from "../utils/messageUtils";
import MessageBubble from "../components/MessageBubble";
import { decryptId, encryptId } from "../lib/crypto";
import { v4 as uuidv4 } from "uuid";
import { encryptFileBeforeUpload } from "../crypto/encryptBeforeUpload";
import ChatHeader from "../components/ChatHeader";
import { debounce } from "lodash";
import { removeFromQueue, saveToQueue } from "../helper/queueHelper";
import MessageSync from "../components/MessageSync";
import { useScrollToMessage } from "../utils/useScrollToMessage";
import { useChatManagement } from "../utils/useChatManagement";
import { useMessageActions } from "../utils/useMessageActions";
import MessageList from "../components/MessageList";
import MentionText from "../components/MentionText";
import PinnedMessage from "../components/PinnedMessage";
import SearchBar from "../components/SearchBar";

const ChatInfo = lazy(() => import("../components/ChatInfo"));

const AddParticipantDrawer = lazy(
  () => import("../components/AddParticipantDrawer"),
);
const AddGroupDrawer = lazy(() => import("../components/AddGroupDrawer"));

const reactionIcons = Object.freeze({
  like: "👍",
  love: "❤️",
  haha: "😂",
  wow: "😮",
  sad: "😢",
  angry: "😡",
});

function isBase64DataUrl(str) {
  return str && typeof str === 'string' && str.startsWith('data:');
}

const CONVERSATION_UI_INITIAL = {
  menuOpen: false,
  isHovering: false,
  isHoveringFile: false,
  isChatInfoOpen: false,
  isSharedFileOpen: false,
  isMediaOpen: false,
  isAddParticipantOpen: false,
  isAddGroupOpen: false,
  searchOpen: false,
  dialogOpen: false,
  leaveDialogOpen: false,
  deleteMessageOpen: false,
  forwardMessageDrawer: false,
  reactionDrawer: false,
  profileDrawerOpen: false,
};
const CONVERSATION_MESSAGE_INITIAL = {
  selectedId: null,
  selected: null,
  edited: null,
  replied: null,
  highlightedId: null,
  targetId: null,
  current: null,
};
const CONVERSATION_HOVER_INITIAL = {
  messageId: null,
  fileId: null,
  anchorElS1: null,
  anchorER: null,
};
const CONVERSATION_SCROLL_INITIAL = {
  isAtBottom: true,
  newMessageReceived: false,
  shouldScrollToBottom: false,
  showScrollDown: false,
};
const CONVERSATION_SEARCH_INITIAL = { term: "", results: [], currentIndex: 0 };
const CONVERSATION_PAGINATION_INITIAL = {
  page: 1,
  hasMore: true,
  loadingMessages: false,
};

const conversationReducer = (state, action) => {
  switch (action.type) {
    case "ui":
      return { ...state, ui: { ...state.ui, ...action.payload } };
    case "message":
      return { ...state, message: { ...state.message, ...action.payload } };
    case "hover":
      return { ...state, hover: { ...state.hover, ...action.payload } };
    case "scroll":
      return { ...state, scroll: { ...state.scroll, ...action.payload } };
    case "search":
      return { ...state, search: { ...state.search, ...action.payload } };
    case "pagination":
      return { ...state, pagination: { ...state.pagination, ...action.payload } };
    default:
      return state;
  }
};

const conversationInitialState = {
  ui: CONVERSATION_UI_INITIAL,
  message: CONVERSATION_MESSAGE_INITIAL,
  hover: CONVERSATION_HOVER_INITIAL,
  scroll: CONVERSATION_SCROLL_INITIAL,
  search: CONVERSATION_SEARCH_INITIAL,
  pagination: CONVERSATION_PAGINATION_INITIAL,
};

export default function Conversation() {
  const { authUser } = useAuth();
  const { type, id } = useParams();

  const decryptedId = decryptId(decodeURIComponent(id));

  // Per-chat text drafts keyed by chat id (shared via UIState)
  const [textContent, setTextContentState] = useState("");
  const isLoadingMoreRef = useRef(false);

  const { activeChatId, setActiveChatId, drafts, setDrafts } = useUIState();
  
  const {
    chat,
    decryptMedia,
    onlineUsers,
    setRecipient,
    socket,
    mutedChat,
    setMutedChat,
    files,
    messages,
    recipient,
    sharedFiles,
    sharedMedias,
    medias,
    containerBoxRef,
    loading: isChatLoading,
    chatError,
    setChatError,
    dispatch,
    chatId,
    setChatId,
    pinnedMessage,
  } = useChats();

  const [convState, dispatchConv] = useReducer(
    conversationReducer,
    conversationInitialState
  );
  const uiState = convState.ui;
  const messageState = convState.message;
  const hoverState = convState.hover;
  const scrollState = convState.scroll;
  const searchState = convState.search;
  const paginationState = convState.pagination;

  const setTextContent = useCallback(
    (value) => {
      setTextContentState(value);
      if (!decryptedId) return;
      setDrafts((prev) => ({
        ...prev,
        [decryptedId]: value,
      }));
    },
    [decryptedId],
  );

  // Keep text drafts per chat so switching chats restores their own text
 

  // When chat changes, load its draft (or empty)
  useEffect(() => {
    if (!decryptedId) return;
    setTextContentState((prev) => {
      const existing = drafts[decryptedId];
      return typeof existing === "string" ? existing : "";
    });
  }, [decryptedId, drafts]);

  const clearCurrentDraft = useCallback(() => {
    if (decryptedId) {
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[decryptedId];
        return next;
      });
    }
    setTextContentState("");
  }, [decryptedId]);

  const updateUIState = useCallback((updates) => {
    dispatchConv({ type: "ui", payload: updates });
  }, []);
  const updateMessageState = useCallback((updates) => {
    dispatchConv({ type: "message", payload: updates });
  }, []);
  const updateHoverState = useCallback((updates) => {
    dispatchConv({ type: "hover", payload: updates });
  }, []);
  const updateScrollState = useCallback((updates) => {
    dispatchConv({ type: "scroll", payload: updates });
  }, []);
  const updateSearchState = useCallback((updates) => {
    dispatchConv({ type: "search", payload: updates });
  }, []);
  const updatePaginationState = useCallback((updates) => {
    dispatchConv({ type: "pagination", payload: updates });
  }, []);

  const [isActive, setIsActive] = useState(false);
  const api = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");
  const readMessages = useRef(new Set());
  const isMobileOrTablet = useMediaQuery("(max-width: 950px)");
  const messageRefs = useRef({});
  const suppressNextScrollRef = useRef(false);
  const savedScrollTop = useRef(0);
  const [selectedParticipantId, setSelectedParticipantId] = useState(null);
  const [downloadedMessages, setDownloadedMessages] = useState(() =>
    JSON.parse(localStorage.getItem("downloadedMessages") || "[]"),
  );
  const location = useLocation();
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [open, setOpen] = useState(false);
  const [pinnedMessageId, setPinnedMessageId] = useState(null);
  const [copiedMessage, setCopiedMessage] = useState(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const isFirstLoadRef = useRef(true);
  const visibleMessages = 7;

  useEffect(() => {
    if (type !== "c") return;
    setActiveChatId(decryptedId);
    setChatId(decryptedId);
    setMessageOverrides({});
    updateScrollState({shouldScrollToBottom: true});
  }, [decryptedId,updateScrollState,type]);

 const { data, isLoading, error, refetch, isFromCache } = MessageSync({ 
    chatId, 
    visibleMessages
  });


useEffect(() => {
  if (!data) return;

  dispatch({ type: "SET_MESSAGES", payload: data.messages });

  if (data.pinnedMessage) {
    dispatch({
      type: "SET_PINNED_MESSAGE",
      payload: data.pinnedMessage,
    });
  } else {
    dispatch({ type: "CLEAR_PINNED_MESSAGE" });
  }

  dispatch({
    type: "SET_MEDIA_DERIVED",
    payload: data.mediaDerived ?? {
      sharedMedias: [],
      medias: [],
      sharedFiles: [],
      files: [],
    },
  });

  if (data.hasMore !== undefined) {
    updatePaginationState({ hasMore: data.hasMore, page: 1 });
  }
}, [data,chatId]);


  const openFullscreen = (url) => {
    if (containerRef.current) {
      savedScrollTop.current = containerRef.current.scrollTop; // save position
    }
    suppressNextScrollRef.current = true;
    setFullscreenImage(url);
  };

  const closeFullscreen = () => {
    setFullscreenImage(null);
    updateScrollState({shouldScrollToBottom: false});

    requestAnimationFrame(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = savedScrollTop.current;
      }
      suppressNextScrollRef.current = false;
    });
  };

  const handleMediaOpen = useCallback(() => {
  updateUIState({ 
    isChatInfoOpen: false,
    isMediaOpen: true,
    isSharedFileOpen: false,
   });
  }, [updateUIState]);

  const textContentRef = useRef();
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingPinnedMessage, setLoadingPinnedMessage] = useState(false); // Track if we're loading messages to find the pinned one
  const [clickedMessages, setClickedMessages] = useState([]);
 
  const [userReaction, setUserReaction] = useState(null);
  const [mediaUrl, setMediaUrl] = useState(null); // URL of the selected media
  const [mediaType, setMediaType] = useState(null); // Type of the media (e.g., 'gif')
  const [mediaGif, setMediaGif] = useState(null); // Type of the media (e.g., 'gif')
  const [fileName, setFileName] = useState(null);
  const containerRef = useRef(null); // Ref for the container
const showScrollDownRef = useRef(false);

  const prevScrollHeight = useRef(0); // Ref to store previous scroll height
  
  const bottomRef = useRef(null);

  const userId = location.state?.userId || null;

  // const currentChatIdRef = useRef(currentChatId);

  
  const [leftParticipants, setLeftParticipants] = useState(null);
  const [newParticipants, setNewParticipants] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

   // Track the current message for reactions
  const handleOpenReactionDrawer = useCallback(() => {
    updateUIState({
      reactionDrawer: true,
    })
  }, [updateUIState]);

  const handleSearchOpen = useCallback(() => {
    updateUIState({searchOpen: true,});
  },[updateUIState]);

  const handleSearchClose = useCallback(() => {
  
    updateUIState({searchOpen: false});
    updateSearchState({
      term: "",
      results: [],
      currentIndex: 0,
    });
  },[updateUIState, updateSearchState]);

  useEffect(() => {
  
    updateUIState({
      searchOpen: false,
    })
    updateSearchState({
      term: "",
      results: [],
      currentIndex: 0,
    })
    if (type === "u") {
      setRecipient(null);
    }
  }, [type, id,updateUIState, updateSearchState]);

  const fetchUser = async (id) => {
    if (type !== "u" && !id) return null;

    const api = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem("token");

    const response = await fetchWithAuth(`${api}/api/users/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    console.log("getData", data);

    if (data.status === 0) {
      throw new Error("Failed to fetch user data");
    }

    if (data.status === 98) {
      const encryptedId = encodeURIComponent(encryptId(data.chat_id));
      navigate(`/conversation/c/${encryptedId}`);
    }

    return data.user;
  };

  const {
    data: user,
    isLoading: isUserLoading,
    isError: isUserError,
  } = useQuery({
    queryKey: ["user", decryptedId],
    queryFn: () => fetchUser(decryptedId),
    enabled: type === "u" && !!decryptedId,
    staleTime: 1000 * 60 * 10,
    onSettled: () => setLoading(false),
  });

  useEffect(() => {
    let hideTimeout;
    if (!uiState.isHovering && !uiState.menuOpen) {
      // Keep IconButton if menu is open
      hideTimeout = setTimeout(() => updateHoverState({messageId: null}), 3000);
    } else {
      clearTimeout(hideTimeout); // Clear timeout if re-hovering or menu is open
    }

    return () => clearTimeout(hideTimeout); // Cleanup on component unmount
  }, [uiState.isHovering, uiState.menuOpen]);

  useEffect(() => {
    let hideTimeout;
    if (!uiState.isHoveringFile) {
      // Keep IconButton if menu is open
      hideTimeout = setTimeout(() => updateHoverState({filedId: null}), 1000);
    } else {
      clearTimeout(hideTimeout); // Clear timeout if re-hovering or menu is open
    }

    return () => clearTimeout(hideTimeout); // Cleanup on component unmount
  }, [uiState.isHoveringFile, uiState.menuOpen]);

  // Event handlers for hover
  const handleMouseEnter = useCallback((e) => {
    const messageId = e.currentTarget.dataset.messageId;
    updateUIState({ isHovering: true });
    updateHoverState({messageId: messageId});
  }, [updateUIState,updateHoverState]);

  const handleMouseLeave = useCallback(() => {
    updateUIState({ isHovering: false });
  }, [updateUIState]);

  const handleMouseFileEnter = useCallback((fileId) => {
    updateUIState({ isHovering: true });
    updateHoverState({fileId: fileId});
  },[updateUIState,updateHoverState]);

  const handleMouseFileLeave = useCallback(() => {
    
    updateUIState({ isHovering: false});

  },[updateUIState]);

  // Close the dialog
  const handleDialogClose = useCallback(() => {
    setOpen(false);
    setPinnedMessageId(null); // Reset the selected department ID
  },[]);

  const handleDeleteMessageOpen = useCallback((id) => {
    updateMessageState({
      selectedId: id,
    })
    updateUIState({
      deleteMessageOpen: true,
    })
   
  },[updateMessageState,updateUIState]);

  // Close the dialog
  const handleDeleteMessageClose = useCallback(() => {
    updateUIState({
      deleteMessageOpen: false,
    })
    updateMessageState({
      selectedId: null,
    })
  },[updateUIState,updateMessageState]);

  const handleOpenProfileDrawer = useCallback(() => {
    updateUIState({
      profileDrawerOpen: true,
    })
  },[updateUIState]);

  const handleCloseProfileDrawer = useCallback(() => {
    updateUIState({
      profileDrawerOpen: false,
    })
  },[updateUIState]);
  const handleCloseReactionDrawer = useCallback(() => {
    updateUIState({
      reactionDrawer: false,
    })
  }, [updateUIState]);

  const handleOpenForwardMessageDrawer = useCallback(() => {
    updateUIState({
      forwardMessageDrawer: true,
    })
  }, [updateUIState]);

  const handleCloseForwardMessageDrawer = useCallback(() => {
    updateUIState({
      forwardMessageDrawer: false,
    })
  },[updateUIState]);

  const handleOpenAddParticipantDrawer = useCallback(() => {
   
    updateUIState({
      isAddParticipantOpen: true, 
      isChatInfoOpen: false,
      isMediaOpen: false,
      isSharedFileOpen: false,
     });   
  }, [updateUIState]);

  const handleCloseAddParticipantDrawer = useCallback(() => {
    updateUIState({ 
      isChatInfoOpen: true,
      isAddParticipantOpen: false,
    });
  },[updateUIState]);

  const handleOpenAddGroupDrawer = useCallback(() => {
    updateUIState({ 
      isAddGroupOpen: true,
      isChatInfoOpen: false,
      isAddParticipantOpen: false,
      isMediaOpen: false,
      isSharedFileOpen: false
     });

  },[updateUIState]);

  const handleCloseAddGroupDrawer = useCallback(() => {
     updateUIState({ 
      isAddGroupOpen: false,
     });
  },[updateUIState]);

  const handleRightClick = useCallback((event, participantId) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? { mouseX: event.clientX, mouseY: event.clientY }
        : null,
    );
    setSelectedParticipantId(participantId);
  },[]);

  const isParticipant = chat?.participants?.some(
    (a) => a.user_code === authUser.user_code,
  );

  async function decryptMessage(msg, chatId) {
  const result = { ...msg };

  // 🔐 TEXT
  try {
    if (!result.text_content && result.ciphertext && result.nonce) {
      result.text_content = await decryptInWorker({
        chatId,
        ciphertext: result.ciphertext,
        nonce: result.nonce,
        version: result.key_version,
      });
    }
  } catch {}

  // 🖼️ MEDIA
  try {
    if (!result.text_content && result.media_type) {
      if (
        result.media_type === "gif" ||
        result.media_type === "sticker" ||
        !result.nonce
      ) {
        result.decryptedUrl = result.media_url;
      } else if (result.media_type !== "poll") {
        result.decryptedUrl = await decryptMedia(result, chatId);
      }
    }
  } catch {}

  return result;
}


  // Local overrides for messages that were re-fetched via retry
  const [messageOverrides, setMessageOverrides] = useState({});

  // 🔄 Retry loading a failed/broken media message by re-fetching from the API,
  // re-decrypting, updating the local override map, and refreshing the SQLite cache.
  const handleRetryLoadMessage = useCallback(async (messageId) => {
    try {
      const res = await fetchWithAuth(`${api}/api/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const freshMsg = data.message ?? data; // adapt to API envelope shape

      // Decrypt the freshly-fetched message
      const decrypted = await decryptMessage(freshMsg, chatId);

      // 1️⃣ Replace in local override map so the list re-renders immediately
      setMessageOverrides((prev) => ({ ...prev, [decrypted.id]: decrypted }));

      // 2️⃣ Persist into SQLite cache (INSERT OR REPLACE)
      if (window.messageDb) {
        await window.messageDb.insertMessage(decrypted);
      }

      return decrypted;
    } catch (err) {
      console.error("❌ handleRetryLoadMessage failed:", err);
      throw err;
    }
  }, [api, token, chatId, decryptMessage]);

  const loadMoreMessages = useCallback(async () => {
  if (!paginationState.hasMore || paginationState.loadingMessages) return;

  updatePaginationState({loadingMessages: true});

  updateScrollState({shouldScrollToBottom: false});
  

  const container = containerRef.current;
  if (!container) return;

  // 📌 Save scroll position
  const scrollHeightBefore = container.scrollHeight;
  const scrollTopBefore = container.scrollTop;

  const nextPage = paginationState.page + 1;
  const offset = paginationState.page * visibleMessages; // Calculate offset for SQLite

  try {
    // 🌐 Try API first
    const res = await fetchWithAuth(
      `${api}/api/chats/${chatId}/messages?page=${nextPage}&limit=${visibleMessages}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await res.json();

    if (data.status !== 1) {
      throw new Error("Failed to load more messages");
    }

    if (!data.messages?.length) {
      updatePaginationState({
        hasMore: false,
        loadingMessages: false,
      });
     
      return;
    }

    // 🔓 Decrypt older messages
    const decryptedOlderMessages = [];

    for (const msg of data.messages) {
      decryptedOlderMessages.push(await decryptMessage(msg, chatId, decryptMedia));
    }

    // 💾 Save to SQLite cache
    

    // ⬆️ PREPEND (older messages go on top)
    dispatch({
      type: "PREPEND_MESSAGES",
      payload: decryptedOlderMessages,
    });


    
      updatePaginationState({
        page: nextPage,
        hasMore: data.hasMore
      })
    


    

    // 🧭 Restore scroll position
    requestAnimationFrame(() => {
      const newScrollHeight = container.scrollHeight;
      container.scrollTop =
        newScrollHeight - scrollHeightBefore + scrollTopBefore;
    });

  } catch (apiError) {
    console.error("API Error loading more messages:", apiError);

    // 📦 Fallback to SQLite cache
    if (window.messageDb) {
      try {
        console.log("🔄 Falling back to SQLite cache...");

        const cachedMessages = await window.messageDb.getMessages(
          chatId,
          visibleMessages,
          offset
        );

        if (cachedMessages && cachedMessages.length > 0) {
          console.log(`📦 Loaded ${cachedMessages.length} messages from cache`, cachedMessages);

          // ⬆️ PREPEND cached messages
          dispatch({
            type: "PREPEND_MESSAGES",
            payload: cachedMessages,
          });

          updatePaginationState({page: nextPage})
          // Check if there might be more cached messages
          if (cachedMessages.length < visibleMessages) {
            updatePaginationState({hasMore: false});
          }

          // 🧭 Restore scroll position
          requestAnimationFrame(() => {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop =
              newScrollHeight - scrollHeightBefore + scrollTopBefore;
          });

          // Optional: Show a toast/banner that cached data is being shown
          console.log("⚠️ Showing cached messages (offline mode)");
          
        } else {
          console.log("❌ No cached messages available");
          updatePaginationState({hasMore: false});
        }
      } catch (cacheError) {
        console.error("Cache fallback also failed:", cacheError);
        updatePaginationState({hasMore: false});
      }
    } else {
      console.error("❌ No cache available and API failed");
      updatePaginationState({hasMore: false});
    }
  } finally {
    updatePaginationState({loadingMessages: false});
   
  }
}, [chatId, paginationState, visibleMessages, decryptMedia, dispatch, updatePaginationState, updateScrollState]);

const scrollToMessage = (messageId) => {
    const messageElement = messageRefs.current[messageId]?.current;
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

const visibleMessageList = useMemo(() => {
  const base = messages ?? [];
  if (!Object.keys(messageOverrides).length) return base;
  return base.map((m) => messageOverrides[m.id] ?? m);
}, [messages, messageOverrides]);

  const editMessage = useCallback(async (event) => {
    if (event) event.preventDefault(); // Prevent default if called with an event
    const editedText = textContent;

    if (!editedText) return;

    let text_content;
    let cipher_text;
    let nonce_message;

    if (chat) {
      const participants = chat.participants || [];

      // 🔐 Encrypt text with correct key+version
      const { ciphertext, nonce } = await encryptInWorker({
        chatId: chat.id,
        plaintext: editedText,
        participants,
      });
      //  const { ciphertext, nonce } = await encryptInWorker(chat.id, text_content);
      // const { ciphertext, nonce } = await encryptMessage(chat.id, text_content);
      const currentChatKeyVersion = chat
        ? sessionStorage.getItem(`chatkey_${chat.id}_latestVersion`)
        : 1;

      cipher_text = ciphertext;
      nonce_message = nonce;
    } else {
      text_content = editedText;
    }

    try {
      // const token = localStorage.getItem(`token`);
      const api = import.meta.env.VITE_API_URL;
      const response = await fetchWithAuth(
        `${api}/api/messages/${messageState.edited.id}/edit`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ciphertext: cipher_text,
            nonce: nonce_message,
          }),
        },
      );

      

      if (response) {
        console.log("Emitting editedMessage event with:", response);

        textContentRef.current.value = "";
        clearCurrentDraft();

        if (messageState.edited) {
          updateMessageState({
            edited: null,
          })
         
        }
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      console.error(error);
      // Handle error appropriately
    }
  }, [textContent, chat, messageState.edited, token, updateMessageState, clearCurrentDraft]);

  const closePicker = () => {
    setMediaUrl(null);
    setMediaType(null);
  };

  async function copyImageToClipboard(imageUrl) {
    try {
      setCopiedToClipboard(true);
      const response = await fetch(imageUrl, { mode: "cors" });
      const blob = await response.blob();

      // Create image element
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = URL.createObjectURL(blob);

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Draw to canvas
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      // Convert to PNG blob
      const pngBlob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );

      // Copy as image/png
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": pngBlob,
        }),
      ]);

      console.log("✅ Image copied as PNG!");
    } catch (error) {
      console.error("❌ Failed to copy image:", error);
    }
  }

  const handleMenuClose = useCallback(() => {
    updateMessageState({
      selectedId: null,
    })
    updateHoverState({
      anchorElS1: null,
      messageId: null,
    })
    updateUIState({ menuOpen: false });

  }, [updateUIState,updateHoverState,updateMessageState]);

  const handleToggleSendText = useCallback((messageId) => {
    setClickedMessages((prev) =>
      prev.includes(messageId)
        ? prev.filter((id) => id !== messageId)
        : [...prev, messageId],
    );
  },[]);

  const groupedFiles = useMemo(() => {
    return files.reduce((acc, file) => {
      const created = file.createdAt || file.created_at;
      const formattedDate = formatMessageDate(created);
      if (!acc[formattedDate]) {
        acc[formattedDate] = [];
      }
      acc[formattedDate].push(file);
      return acc;
    }, {});
  }, [files]);

  const groupedMedias = useMemo(() => {
    return medias.reduce((acc, media) => {
      const created = media.createdAt || media.created_at;
      const formattedDate = formatMessageDate(created);
      if (!acc[formattedDate]) {
        acc[formattedDate] = [];
      }
      acc[formattedDate].push(media);
      return acc;
    }, {});
  }, [medias]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (suppressNextScrollRef.current || fullscreenImage) return;

    // ✅ Do NOT auto-scroll when loading older messages
    if (!scrollState.shouldScrollToBottom) return;

    requestAnimationFrame(() => {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: isFirstLoadRef.current ? "auto" : "smooth",
      });
      isFirstLoadRef.current = false;
    });
  }, [messages.length,scrollState.shouldScrollToBottom]);

  const { handleScrollToMessage } = useScrollToMessage({
    messages,
    searchState,
    scrollToMessage,
    updateMessageState,
    dispatch,
    chatId,
    decryptMedia,
    setLoadingPinnedMessage,
  });

  // Refs for handleSearch so debounced function can stay stable and read current values
  const messagesRef = useRef(messages);
  const chatIdRef = useRef(chatId);
  const handleScrollToMessageRef = useRef(handleScrollToMessage);
  const updateSearchStateRef = useRef(updateSearchState);
  messagesRef.current = messages;
  chatIdRef.current = chatId;
  handleScrollToMessageRef.current = handleScrollToMessage;
  updateSearchStateRef.current = updateSearchState;

  // Refs for handleVisibleMessages so callback stays stable (VisibilityMessages won't re-run effects)
  const apiRef = useRef(api);
  const tokenRef = useRef(token);
  const authUserRef = useRef(authUser);
  apiRef.current = api;
  tokenRef.current = token;
  authUserRef.current = authUser;

  const downloadKey = `downloadedMessages-${authUser.user_code}`;

  useEffect(() => {
    // Check if we should scroll to the last clicked message
    if (clickedMessages.length > 0) {
      const lastClickedMessageId = clickedMessages[clickedMessages.length - 1];
      const isMessageVisible = visibleMessageList.some(
        (message) => message.id === lastClickedMessageId,
      );

      if (!isMessageVisible && loadingPinnedMessage) {
        loadMoreMessages();
      } else if (isMessageVisible) {
        scrollToMessage(lastClickedMessageId);
        setLoadingPinnedMessage(false);
      }
    }
  }, [clickedMessages, loadingPinnedMessage, visibleMessages]);

  useEffect(() => {
    const storedMessages = JSON.parse(localStorage.getItem(downloadKey)) || [];
    setDownloadedMessages(storedMessages);
  }, [authUser.user_code]);

  useLayoutEffect(() => {
    const list = messages ?? [];
    const ids = new Set(list.map((m) => String(m.id)));
    list.forEach((message) => {
      const key = String(message.id);
      if (!messageRefs.current[key]) {
        messageRefs.current[key] = React.createRef();
      }
    });
    Object.keys(messageRefs.current).forEach((id) => {
      if (!ids.has(id)) {
        delete messageRefs.current[id];
      }
    });
  }, [messages]);

  useEffect(() => {
    updateUIState({ 
      isChatInfoOpen: false,
      isSharedFileOpen: false,
     });
  }, [type, id]);

  const handleVisibleMessages = useCallback(async (visibleMessageIds) => {
    const messages = messagesRef.current;
    const api = apiRef.current;
    const token = tokenRef.current;
    const authUser = authUserRef.current;

    if (!messages || !messages.length) {
      console.warn("Messages not loaded yet.");
      return;
    }

    const unreadVisibleMessageIds = visibleMessageIds.filter((id) => {
      const message = messages.find(
        (msg) => msg.id.toString() === id.toString(),
      );
      return (
        message &&
        !message.read &&
        message.sender_id !== authUser.user_code &&
        !readMessages.current.has(id) // Avoid duplicate API calls
      );
    });

    if (unreadVisibleMessageIds.length) {
      console.log("Marking as read:", unreadVisibleMessageIds);

      unreadVisibleMessageIds.forEach((id) => readMessages.current.add(id));

      const unread = unreadVisibleMessageIds.map(Number);

      console.log("Unread messages to mark as read:", unread);

      const res = await fetchWithAuth(`${api}/api/messages/markRead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messageIds: unread }),
      });

      const data = await res.json();
      console.log("Mark as read response:", data);
    }
  }, []);

   const handleClose = useCallback(() => {
    setContextMenu(null); // Close the context menu
    setSelectedParticipantId(null);
  },[]);

  // VisibilityMessages(messageRefs, handleVisibleMessages);

  const handleFileDownloadWrapper = useCallback(async (item, chatId) => {
    await handleFileDownload(item, chatId);

    // mark as downloaded
    setDownloadedMessages((prev) => {
      const updated = [...prev, item.id];
      localStorage.setItem("downloadedMessages", JSON.stringify(updated));
      return updated;
    });
  },[handleFileDownload]);

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleClickOpen = useCallback((id) => {
    updateUIState({
      dialogOpen: true,
    })
    setSelectedParticipantId(id);
  },[updateUIState]);

  const handleClickLeaveOpen = useCallback((id) => {
    updateUIState({
      leaveDialogOpen: true,
    })
    setSelectedParticipantId(id);
  },[updateUIState]);

  // Close the dialog
  const handleDialogClearClose = useCallback(() => {
    updateUIState({
      dialogOpen: false,
    });
    setSelectedParticipantId(null);
  },[updateUIState]);

  const handleLeaveDialogClearClose = useCallback(() => {
    updateUIState({
      leaveDialogOpen: false,
    })
    setSelectedParticipantId(null);
  },[updateUIState]);

  
  useEffect(() => {
    if (!chat) return;

    const markRead = async () => {
      await handleMarkRead(chat.id);
    };

    markRead();
  }, [chat]);

 


const handleScroll = useCallback(() => {
  const container = containerRef.current;
  if (!container) return;

  const scrollTop = container.scrollTop;
  const scrollHeight = container.scrollHeight;
  const clientHeight = container.clientHeight;
  
  // Calculate distance from bottom
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
  
  // Check if user is at bottom
  const isUserAtBottom = distanceFromBottom < 5; // Small threshold for precision
  
  // Determine if we should show scroll down button (100px from bottom)
  const shouldShowScrollDown = distanceFromBottom > 100;

  // Only update state if the scroll down button visibility actually changed
  if (shouldShowScrollDown !== showScrollDownRef.current) {
    showScrollDownRef.current = shouldShowScrollDown;
    updateScrollState({
      showScrollDown: shouldShowScrollDown,
      isAtBottom: isUserAtBottom,
    });
  } else if (scrollState.isAtBottom !== isUserAtBottom) {
    // Update isAtBottom separately if needed (for other functionality)
    updateScrollState({ isAtBottom: isUserAtBottom });
  }

  // Handle new message notification
  if (isUserAtBottom && scrollState.newMessageReceived) {
    updateScrollState({ newMessageReceived: false });
  }
}, [updateScrollState, scrollState.isAtBottom, scrollState.newMessageReceived]);


const throttledHandleScroll = useMemo(
  () => debounce(handleScroll, 150), // 150ms delay - adjust as needed
  [handleScroll]
);

useEffect(() => {
  const container = containerRef.current;
  if (container) {
    container.addEventListener("scroll", throttledHandleScroll);
  }

  return () => {
    if (container) {
      container.removeEventListener("scroll", throttledHandleScroll);
      throttledHandleScroll.cancel(); // Important: cancel pending debounced calls
    }
  };
}, [throttledHandleScroll]);

// useEffect(() => {
//   const container = containerRef.current;
//   if (container) {
//     container.addEventListener("scroll", handleScroll);
//   }

//   return () => {
//     if (container) {
//       container.removeEventListener("scroll", handleScroll);
//     }
//   };
// }, [handleScroll]);

  const latestMessage = visibleMessageList[visibleMessageList.length - 1];

  useEffect(() => {
    if (!latestMessage) return;

    const isFromOtherUser = latestMessage.sender_id !== authUser.user_code;
    const hasNotSeen = !latestMessage.viewed_by?.includes(authUser.user_code);

    if (!scrollState.isAtBottom && isFromOtherUser && hasNotSeen) {
      updateScrollState({newMessageReceived: true});
     
    } else {
      updateScrollState({newMessageReceived: false});
      
    }
  }, [visibleMessageList, scrollState.isAtBottom, authUser.user_code,updateScrollState]);

  const isAuthUserInChat = useMemo(() => 
    chat?.participants?.some(p => p.user_code === authUser.user_code),
    [chat?.participants, authUser.user_code]
  );

  const ownerAdminIds = useMemo(() => 
    new Set(chat?.ownerAdmins?.map(admin => admin.user_code)),
    [chat?.ownerAdmins]
  );
 

  const handleOpenReactionPicker = useCallback((event, item) => {
    updateHoverState({anchorER: event.currentTarget});
    updateMessageState({ current: item});
    const userReaction = item.reactions?.find(
      (reaction) => reaction.user_id === authUser.user_code,
    );
    setUserReaction(userReaction?.reaction_type || null); // Set the reaction type for the current user
  },[updateHoverState,updateMessageState]);

  // Handle closing the reaction picker (popover)
  const handleCloseReactionPicker = useCallback(() => {
    updateHoverState({anchorER: null});
    updateMessageState({current: null});
   
  },[updateHoverState,updateMessageState]);

  const debouncedSearchRef = useRef(null);
  useEffect(() => {
    debouncedSearchRef.current = debounce(async (value) => {
      const updateSearchState = updateSearchStateRef.current;
      const messages = messagesRef.current;
      const chatId = chatIdRef.current;
      const handleScrollToMessage = handleScrollToMessageRef.current;

      updateSearchState({ term: value });

      if (!value.trim()) {
        updateSearchState({
          results: [],
          currentIndex: 0,
        });
        return;
      }

      if (window.messageDb) {
        try {
          const allMessages = await window.messageDb.getMessages(chatId, 100, 0);
          console.log("Total messages in SQLite for this chat:", allMessages.length);
          console.log("Sample messages:", allMessages.slice(0, 3));
        } catch (error) {
          console.error("Failed to get messages from SQLite:", error);
        }
      }

      const filteredMessages = messages.filter(
        (msg) => msg.media_type === null || msg.media_type === "text",
      );

      const inMemoryResults = filteredMessages.filter((msg) =>
        msg.text_content?.toLowerCase().includes(value.toLowerCase()),
      );

      console.log("In-memory search results:", inMemoryResults);

      let sqliteResults = [];
      if (inMemoryResults.length === 0 && window.messageDb) {
        try {
          console.log("No results in memory, searching SQLite...");
          sqliteResults = await window.messageDb.searchMessages(
            value,
            chatId,
            50
          );
          console.log("SQLite search results:", sqliteResults);
        } catch (error) {
          console.error("SQLite search failed:", error);
        }
      }

      const allResults =
        inMemoryResults.length > 0 ? inMemoryResults : sqliteResults;
      const lastIndex = allResults.length - 1;

      updateSearchState({
        results: allResults,
        currentIndex: lastIndex,
      });

      if (allResults.length > 0 && handleScrollToMessage) {
        handleScrollToMessage(allResults[lastIndex].id);
      }

      if (sqliteResults.length > 0 && inMemoryResults.length === 0) {
        console.log("📦 Showing results from cached messages");
      }
    }, 300);
    return () => {
      debouncedSearchRef.current?.cancel?.();
    };
  }, []);

  const handleSearch = useCallback((value) => {
    debouncedSearchRef.current?.(value);
  }, []);



const {
    handleDeleteMessage,
    handlePinMessage,
    handleUnPinMessage,
    handleMuteChat,
    handleUnMuteChat,
    handleGiveAdmin,
    handleConfirmRemove,
    handleMarkRead,
    handleLeaveChat,
    sendEncryptedFileMessage,
  } = useChatManagement({
    messageState,
    api,
    decryptedId,
    token,
    socket,
    id,
    handleMenuClose,
    handleDeleteMessageClose,
    pinnedMessageId,
    handleDialogClose,
    chat,
    setMutedChat,
    selectedParticipantId,
    handleDialogClearClose,
    handleClose,
    navigate,
    handleLeaveDialogClearClose,
  });

   const {
    handleMenuClick,
    handleReply,
    handleCancelReply,
    handleEdit,
    handleCancelEdit,
    handleCopyText,
    handleDeleteMessageForSelf,
    handleFileChange,
  } = useMessageActions({
    updateUIState,
    updateHoverState,
    updateMessageState,
    dispatch,
    handleMenuClose,
    chat,
    api,
    token,
    setCopiedToClipboard,
    setCopiedMessage,
  });

  const handleRetryFileMessage = useCallback(async (message) => {
    const tempId = message.client_temp_id || message.id;

    dispatch({
      type: "RETRY_OPTIMISTIC_MESSAGE",
      payload: { tempId },
    });

    try {
      const response = await sendEncryptedFileMessage({
        file: message.media_url, // original File object
        fileName: message.file_name,
        fileType: message.media_type,
        repliedMessage: message.reply_to,
        recipientId: message.recipient_id,
        chat,
        tempId,
      });

      const data = await response.json();

      if (data.status === 1) {
        dispatch({
          type: "REMOVE_OPTIMISTIC_MESSAGE",
          payload: { tempId },
        });

        removeFromQueue(tempId);
      } else {
        throw new Error("Retry upload failed");
      }
    } catch (err) {
      console.error("Retry file failed:", err);

      dispatch({
        type: "MARK_OPTIMISTIC_FAILED",
        payload: { tempId },
      });

      saveToQueue({ ...message, failed: true });
    }
  },[dispatch,sendEncryptedFileMessage,removeFromQueue,saveToQueue]);


  // Handle selecting a reaction
  const handleReactionSelect = useCallback(async (reactionType) => {
    setUserReaction(reactionType);
    handleCloseReactionPicker(); // Close the picker after selection

    // Make the API request to add or update the reaction
    try {
      const response = await fetchWithAuth(`${api}/api/reactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messageId: messageState.current.id, // Assuming item.id is the message ID
          reactionType, // Selected reaction type
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log("Reaction added/updated:", responseData);
        // Optionally, you can update the state with the updated reactions
      } else {
        console.error("Failed to add/update reaction:", response.statusText);
      }
    } catch (error) {
      console.error("Error making API request:", error);
    }
  },[handleCloseReactionPicker,messageState]);

  const handleRemoveReaction = useCallback(async () => {
    handleCloseReactionPicker(); // Close the picker

    try {
      const response = await fetchWithAuth(`${api}/api/reactions`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messageId: messageState.current.id, // Message being reacted to
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log("Reaction removed:", responseData);
        // Update the message reactions in the UI (pseudo code, adjust as needed)
        messageState.current.reactions = responseData.reactions; // Remove the user's reaction
      } else {
        console.error("Failed to remove reaction:", response.statusText);
      }
    } catch (error) {
      console.error("Error making API request:", error);
    }
  },[handleCloseReactionPicker,messageState]);

  useEffect(() => {
    if (chat && !chat.is_group_chat && recipient) {
      const isOnline = onlineUsers.some(
        (u) => u.user_code === recipient.user_code,
      );
      setIsActive(isOnline);
    }
  }, [chat, recipient, onlineUsers]);

  const navigateResult = (action) => {
    if (searchState.results.length === 0) return;

    let newIndex = searchState.currentIndex;
    if (action === "next") newIndex = (searchState.currentIndex + 1) % searchState.results.length;
    if (action === "prev")
      newIndex =
        (searchState.currentIndex - 1 + searchState.results.length) % searchState.results.length;
    if (action === "first") newIndex = 0;
    if (action === "last") newIndex = searchState.results.length - 1;

    updateSearchState({
      currentIndex: newIndex,
    })

   
    handleScrollToMessage(searchState.results[newIndex].id);
  };

  const sendEncryptedMessage = useCallback(async ({
    text_content,
    mediaUrl,
    mediaType,
    mediaGif,
    repliedMessage,
    fileName,
    recipientId,
    chat,
    tempId,
  }) => {
    const formData = new FormData();
    const token = localStorage.getItem("token");
    const api = import.meta.env.VITE_API_URL;

    const mentions = [];
    if (text_content) {
      const mentionRegex = /@([\w\s]+)/g;
      let match;
      while ((match = mentionRegex.exec(text_content)) !== null) {
        mentions.push(match[1].trim());
      }
    }

    if (chat) {
      const participants = chat.participants || [];

      const { ciphertext, nonce } = await encryptInWorker({
        chatId: chat.id,
        plaintext: text_content,
        participants,
      });

      const currentChatKeyVersion =
        sessionStorage.getItem(`chatkey_${chat.id}_latestVersion`) || 1;

      formData.append("ciphertext", ciphertext);
      formData.append("nonce", nonce);
      formData.append("key_version", currentChatKeyVersion);
    } else {
      formData.append("text_content", text_content);
    }

    if (mentions.length > 0) {
      formData.append("mentions", JSON.stringify(mentions));
    }

    if (recipientId) formData.append("recipient_id", recipientId);
    if (mediaType) formData.append("media_type", mediaType);
    if (mediaGif) formData.append("media_gif", mediaGif);
    if (messageState.replied) formData.append("reply_to", messageState.replied.id);
    if (fileName) formData.append("file_name", fileName);
    if (type === "c" && id) formData.append("chat_id", decryptedId);

    formData.append("client_temp_id", tempId);

    const response = await fetchWithAuth(`${api}/api/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    return response;
  }, [messageState.replied, type, id, decryptedId]);

  const handleRetryMessage = async (message) => {
    const tempId = message.client_temp_id || message.id;

    dispatch({
      type: "RETRY_OPTIMISTIC_MESSAGE",
      payload: { tempId },
    });

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
      } else {
        throw new Error("Retry failed");
      }
    } catch (error) {
      dispatch({
        type: "MARK_OPTIMISTIC_FAILED",
        payload: { tempId },
      });
    }
  };

  const sendMessage = useCallback(async (event) => {
    if (event) event.preventDefault();

    const text_content = textContent;
    console.log("text_content", textContent);
    updateScrollState({shouldScrollToBottom: true});
    scrollToMessage();

    if (!text_content && !mediaUrl) return;

    const mentions = [];
    const formData = new FormData();

    if (text_content) {
      const mentionRegex = /@([\w\s]+)/g;
      let match;
      while ((match = mentionRegex.exec(text_content)) !== null) {
        mentions.push(match[1].trim());
      }
    }

    const recipientId = recipient
      ? recipient.user_code
      : type === "u" && id
        ? decryptedId
        : null;

    //   console.log("recipientId", recipientId);

    const token = localStorage.getItem("token");
    const api = import.meta.env.VITE_API_URL;

    // Fetch recipient's public key
    // const res = await fetch(`${api}/api/keys/get/${recipientId}`, {
    //   headers: { Authorization: `Bearer ${token}` },
    // });
    // const { publicKeyBase64 } = await res.json();

    // console.log("PublicKeyBase64", publicKeyBase64);

    // Encrypt the message

    if (chat) {
      const participants = chat.participants || [];

      // 🔐 Encrypt text with correct key+version
      const { ciphertext, nonce } = await encryptInWorker({
        chatId: chat.id,
        plaintext: text_content,
        participants,
      });
      //  const { ciphertext, nonce } = await encryptInWorker(chat.id, text_content);
      // const { ciphertext, nonce } = await encryptMessage(chat.id, text_content);
      const currentChatKeyVersion = chat
        ? sessionStorage.getItem(`chatkey_${chat.id}_latestVersion`)
        : 1;

      formData.append("ciphertext", ciphertext);
      formData.append("nonce", nonce);
      formData.append("key_version", currentChatKeyVersion);
    } else {
      formData.append("text_content", text_content);
    }

    console.log("mention", JSON.stringify(mentions));
    // --- BUILD FORM DATA ---

    if (mentions.length > 0) {
      formData.append("mentions", JSON.stringify(mentions));
    }

    if (recipientId) {
      formData.append("recipient_id", recipientId);
    }

    if (mediaType) {
      formData.append("media_type", mediaType);
    }

    if (mediaGif) {
      formData.append("media_gif", mediaGif);
    }

    if (messageState.replied) {
      formData.append("reply_to", messageState.replied.id);
    }

    if (fileName) {
      formData.append("file_name", fileName);
    }

    if (type === "c" && id) {
      formData.append("chat_id", decryptedId);
    }

    // Debug log
    for (let [key, value] of formData.entries()) {
      console.log(`yo ${key}: ${value}`);
    }

    const tempId = `temp-${uuidv4()}`;
    const chatId = decryptedId;
    if (type === "c") {
      formData.append("client_temp_id", tempId);

      //     const formatDateTime = (date = new Date()) => {
      //   const pad = n => String(n).padStart(2, "0");

      //   return (
      //     `${date.getFullYear()}-` +
      //     `${pad(date.getMonth() + 1)}-` +
      //     `${pad(date.getDate())} ` +
      //     `${pad(date.getHours())}:` +
      //     `${pad(date.getMinutes())}:` +
      //     `${pad(date.getSeconds())}`
      //   );
      // };

      // 🔹 1. CREATE OPTIMISTIC MESSAGE (UI ONLY)
      const optimisticMessage = {
        id: tempId,
        client_temp_id: tempId,
        createdAt: new Date().toISOString(),
        chat_id: chatId,
        text_content,

        media_url: mediaUrl || null,
        media_type: null,
        recipient_id: recipientId || null,
        sender_id: authUser.user_code,
        is_deleted_for_everyone: false,

        isOptimistic: true,
      };

      console.log("createdAtChat", optimisticMessage);

      // 🔹 2. SHOW MESSAGE IMMEDIATELY
      dispatch({
        type: "PRE_MESSAGE",
        payload: optimisticMessage,
      });

      // 🔹 Clear input immediately (Messenger behavior)
      clearCurrentDraft();
      setMediaType(null);
      setMediaUrl(null);
      setMediaGif(null);
      if (messageState.replied) {
        updateMessageState({
          replied: null,
        })
      };
    }

    try {
      const api = import.meta.env.VITE_API_URL;
      const response = await fetchWithAuth(`${api}/api/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      console.log("success", data);
      if (response.status === 201) {
        console.log("✅ Message sent successfully", data);
        //   textContentRef.current.value = "";
        clearCurrentDraft();
        setMediaType(null);
        setMediaUrl(null);
        setMediaGif(null);
        if (messageState.replied) updateMessageState({replied: null});

        {type === "c"} {
          dispatch({
            type: "REMOVE_OPTIMISTIC_MESSAGE",
            payload: { tempId },
          });
        }
        if (type === "u") {
          const encryptedId = encodeURIComponent(
            encryptId(data?.newMessage?.chat_id),
          );
          navigate(`/conversation/c/${encryptedId}`);
        }
      updateScrollState({shouldScrollToBottom: false});

      } else {
      updateScrollState({shouldScrollToBottom: false});

        throw new Error("Failed to send message");
      }
    } catch (error) {
      updateScrollState({shouldScrollToBottom: false});

      console.error("❌ Send message failed:", error);
      dispatch({
        type: "MARK_OPTIMISTIC_FAILED",
        payload: { tempId },
      });

      saveToQueue({
        ...optimisticMessage,
        failed: true,
      });
    }
  }, [
    textContent,
    mediaUrl,
    mediaType,
    mediaGif,
    fileName,
    recipient,
    type,
    id,
    decryptedId,
    chat,
    messageState.replied,
    authUser.user_code,
    dispatch,
    updateScrollState,
    updateMessageState,
    navigate,
  ]);

  
  if (isChatLoading) {
    return <Box>Loading...</Box>;
  }

  if (chatError) {
    navigate("/");
    setChatError(false);
  }

  if (isUserLoading) {
    return <Box>Loading...</Box>;
  }

  if (!isUserLoading && !user && type === "u") {
    navigate("/");
  }

 
  return (
    <Box ref={containerBoxRef}>
      <Helmet>
        <link rel="icon" type="image/png" href="/splash_logo_tl 2.png" />
        <title>Conversation - TrustTalk</title>
      </Helmet>
      <Box>
        <Box sx={{ position: "sticky"}}>
          <ChatHeader
            chat={chat}
            isActive={isActive}
            recipient={recipient}
            handleOpenProfileDrawer={handleOpenProfileDrawer}
            profileDrawerOpen={uiState.profileDrawerOpen}
            isChatInfoOpen={uiState.isChatInfoOpen}
            handleCloseProfileDrawer={handleCloseProfileDrawer}
            fullscreenImage={fullscreenImage}
            closeFullscreen={closeFullscreen}
            openFullscreen={openFullscreen}
            updateUIState={updateUIState}
            isMobileOrTablet={isMobileOrTablet}
            type={type}
            id={id}
            user={user}
            searchOpen={uiState.searchOpen}
            handleSearchOpen={handleSearchOpen}
            api={api}
            TimeAgo={TimeAgo}
          />
        </Box>


        <Box
          sx={{
            display: uiState.isChatInfoOpen
              ? "flex"
              : uiState.isSharedFileOpen
                ? "flex"
                : uiState.isMediaOpen
                  ? "flex"
                  : uiState.isAddParticipantOpen
                    ? "flex"
                    : uiState.isAddGroupOpen
                      ? "flex"
                      : "block",
          }}
        >

           <Box
          sx={{
            width: "100%",
            flexGrow: 1,
            display:
              isMobileOrTablet &&
              (uiState.isChatInfoOpen ||
                uiState.isSharedFileOpen ||
                uiState.isMediaOpen ||
                uiState.isAddParticipantOpen ||
                uiState.isAddGroupOpen) &&
              "none",
          }}
        >

            <SearchBar
              isOpen={uiState.searchOpen}
              searchTerm={searchState.term}
              currentIndex={searchState.currentIndex}
              totalResults={searchState.results.length}
              onSearchChange={handleSearch}
              onNavigate={navigateResult}
              onClose={handleSearchClose}
            />

            {type !== "u" && (
              <PinnedMessage
                pinnedMessage={pinnedMessage}
                chat={chat}
                recipient={recipient}
                api={api}
                searchOpen={uiState.searchOpen}
                onScrollToMessage={handleScrollToMessage}
                onUnpin={handleUnPinMessage}
              />
            )}
          <Box
            ref={containerRef}
            sx={{
              // width: isChatInfoOpen ? "815px" : "100%",
              width: "100%",
              flexGrow: 1,
              overflowY: "auto",
              height: "80vh",
              display:
                isMobileOrTablet &&
                (uiState.isChatInfoOpen ||
                  uiState.isSharedFileOpen ||
                  uiState.isMediaOpen ||
                  uiState.isAddParticipantOpen ||
                  uiState.isAddGroupOpen) &&
                "none",
            }}
          >
            

            <MessageList
              // Data
              messages={messages}
              leftParticipants={leftParticipants}
              newParticipants={newParticipants}
              handleVisibleMessages={handleVisibleMessages}

              // Pagination
              paginationState={paginationState}
              loadMoreMessages={loadMoreMessages}
              // State
              clickedMessages={clickedMessages}
              messageRefs={messageRefs}
              hoverState={hoverState}
              messageState={messageState}
              uiState={uiState}
              searchState={searchState}
              // Chat data
              chat={chat}
              recipient={recipient}
              // Media
              downloadedMessages={downloadedMessages}
              fullscreenImage={fullscreenImage}
              reactionIcons={reactionIcons}
              // Handlers - Menu & Interaction
              handleMenuClick={handleMenuClick}
              handleMouseEnter={handleMouseEnter}
              handleMouseLeave={handleMouseLeave}
              handleToggleSendText={handleToggleSendText}
              handleMenuClose={handleMenuClose}
              // Handlers - Message Actions
              handleReply={handleReply}
              handleEdit={handleEdit}
              handleCopyText={handleCopyText}
              handleOpenForwardMessageDrawer={handleOpenForwardMessageDrawer}
              handleCloseForwardMessageDrawer={handleCloseForwardMessageDrawer}
              // Handlers - Reactions
              handleOpenReactionPicker={handleOpenReactionPicker}
              handleOpenReactionDrawer={handleOpenReactionDrawer}
              handleCloseReactionDrawer={handleCloseReactionDrawer}
              handleCloseReactionPicker={handleCloseReactionPicker}
              handleReactionSelect={handleReactionSelect}
              handleRemoveReaction={handleRemoveReaction}
              userReaction={userReaction}
              // Handlers - Message Management
              handlePinMessage={handlePinMessage}
              handleUnPinMessage={handleUnPinMessage}
              handleDeleteMessageForSelf={handleDeleteMessageForSelf}
              handleDeleteMessageOpen={handleDeleteMessageOpen}
              handleDeleteMessageClose={handleDeleteMessageClose}
              handleDeleteMessage={handleDeleteMessage}
              // Handlers - File & Media
              handleFileDownloadWrapper={handleFileDownloadWrapper}
              openFullscreen={openFullscreen}
              closeFullscreen={closeFullscreen}
              // Handlers - Send & Retry
              sendEncryptedMessage={sendEncryptedMessage}
              sendEncryptedFileMessage={sendEncryptedFileMessage}
              handleRetryFileMessage={handleRetryFileMessage}
              handleRetryLoadMessage={handleRetryLoadMessage}
              // Utilities
              formatTime={formatTime}
              MentionText={MentionText}
              isMobileOrTablet={isMobileOrTablet}
              isParticipant={isParticipant}
              // State updaters
              updateMessageState={updateMessageState}
              visibleMessageList={visibleMessageList}
              // Refs
              bottomRef={bottomRef}
            />

            {scrollState.newMessageReceived && (
              <Box
                onClick={() => {
                  updateScrollState({shouldScrollToBottom: true});
                  
                }}
                style={{
                  position: "absolute",
                  bottom: "100px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "#5b5bfdff",
                  color: "#fff",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  cursor: "pointer",
                  zIndex: 1000,
                }}
              >
                New message ↓
              </Box>
            )}

            {scrollState.showScrollDown && !scrollState.newMessageReceived && (
              <IconButton
                onClick={() => {
                  containerRef.current.scrollTo({
                    top: containerRef.current.scrollHeight,
                    behavior: "smooth",
                  });
                }}
                sx={{
                  position: "absolute",
                  bottom: "120px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "white",
                  boxShadow: 3,
                  "&:hover": { backgroundColor: "#f0f0f0" },
                }}
              >
                <ArrowDownwardIcon />
              </IconButton>
            )}

            {(isAuthUserInChat ||
              chat?.ownerAdmins?.includes(authUser.user_code) ||
              (type === "u" && id) ||
              chat?.participants?.includes(authUser.user_code)) && (
              <TextEditor
                repliedMessage={messageState.replied}
                onCancelReply={handleCancelReply}
                textContentRef={textContentRef}
                sendMessage={sendMessage}
                setMediaType={setMediaType}
                shouldScrollToBottom={scrollState.shouldScrollToBottom}
                updateScrollState={updateScrollState}
                setMediaUrl={setMediaUrl}
                mediaType={mediaType}
                mediaUrl={mediaUrl}
                closePicker={closePicker}
                textContent={textContent}
                setTextContent={setTextContent}
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
                setMediaGif={setMediaGif}
                setFileName={setFileName}
                copiedToClipboard={copiedToClipboard}
                setCopiedToClipboard={setCopiedToClipboard}
                editedMessage={messageState.edited}
                onCancelEdit={handleCancelEdit}
                editMessage={editMessage}
                isChatInfoOpen={uiState.isChatInfoOpen}
                isSharedFileOpen={uiState.isSharedFileOpen}
                isMediaOpen={uiState.isMediaOpen}
                isAddParticipantOpen={uiState.isAddParticipantOpen}
                isAddGroupOpen={uiState.isAddGroupOpen}
                updateUIState={updateUIState}
                chat={chat}
                recipient={recipient}
                decryptedId={decryptedId}
                type={type}
                id={id}
                dispatch={dispatch}
                user={user}
                openFullscreen={openFullscreen}
              />
            )}
          </Box>
        </Box>

          

          
        {uiState.isChatInfoOpen && (
            <Box
                sx={{
                    width: isMobileOrTablet ? "100%" : "40%",
                    overflowY: "auto",
                    height: "80vh",
                    borderLeft: "1px solid #E5E5EA",
                }}
            >
                <Suspense fallback={<div>loading...</div>}>
                    <ChatInfo
                        chat={chat}
                        recipient={recipient}
                        api={api}
                        isMobileOrTablet={isMobileOrTablet}
                        triggerFileInput={triggerFileInput}
                        handleMuteChat={handleMuteChat}
                        handleUnMuteChat={handleUnMuteChat}
                        handleOpenAddParticipantDrawer={handleOpenAddParticipantDrawer}
                        handleOpenAddGroupDrawer={handleOpenAddGroupDrawer}
                        handleRightClick={handleRightClick}
                        dialogOpen={uiState.dialogOpen}
                        handleDialogClearClose={handleDialogClearClose}
                        handleConfirmRemove={handleConfirmRemove}
                        handleClose={handleClose}
                        handleClickLeaveOpen={handleClickLeaveOpen}
                        handleClickOpen={handleClickOpen}
                        handleGiveAdmin={handleGiveAdmin}
                        leaveDialogOpen={uiState.leaveDialogOpen}
                        handleLeaveDialogClearClose={handleLeaveDialogClearClose}
                        handleLeaveChat={handleLeaveChat}
                        fullscreenImage={fullscreenImage}
                        openFullscreen={openFullscreen}
                        closeFullscreen={closeFullscreen}
                        formatDate={formatDate}
                        sharedMedias={sharedMedias}
                        sharedFiles={sharedFiles}
                        handleOpenProfileDrawer={handleOpenProfileDrawer}
                        handleCloseProfileDrawer={handleCloseProfileDrawer}
                        profileDrawerOpen={uiState.profileDrawerOpen}
                        handleFileDownload={handleFileDownloadWrapper}
                        groupedMedias={groupedMedias}
                        groupedFiles={groupedFiles}
                        fileInputRef={fileInputRef}
                        handleFileChange={handleFileChange}
                        ownerAdminIds={ownerAdminIds}
                        contextMenu={contextMenu}
                        selectedParticipantId={selectedParticipantId}
                        userId={userId}
                        isActive={isActive}
                        downloadedMessages={downloadedMessages}
                        setDownloadedMessages={setDownloadedMessages}
                        handleMouseFileLeave={handleMouseFileLeave}
                        handleMouseFileEnter={handleMouseFileEnter}
                        hoveredFileId={hoverState.fileId}
                        updateHoverState={updateHoverState}
                        medias={medias}
                        files={files}
                    />
                </Suspense>
            </Box>
        )}

          {uiState.isAddParticipantOpen && (
            <Suspense fallback={<div>loading...</div>}>
              <AddParticipantDrawer
                closeAddParticipantDrawer={handleCloseAddParticipantDrawer}
                chat={chat}
                newParticipants={newParticipants}
                setNewParticipants={setNewParticipants}
              />
            </Suspense>
          )}

          {uiState.isAddGroupOpen && (
            <Suspense fallback={<div>loading...</div>}>
              <AddGroupDrawer
                closeAddGroupDrawer={handleCloseAddGroupDrawer}
                user={recipient}
              />
            </Suspense>
          )}
        </Box>
      </Box>
    </Box>
  );
}
