import {
    Box,
    IconButton,
    Typography,
    TextField,
    Avatar,
    Tooltip,
    Button,
    Menu,
    MenuItem,
    ListItemIcon,
    Switch,
    CircularProgress
} from "@mui/material"

import {
    DoneAll as DoneAllIcon,
    Check as CheckIcon,
    Logout as LogoutIcon,
    Groups as GroupsIcon,
    Settings as SettingsIcon,
    Notifications as NotificationsIcon,
    ArrowBackIos as ArrowBackIosIcon, 
    ArrowForwardIos as ArrowForwardIosIcon,
} from "@mui/icons-material";

import CompanyLogo from "../assets/splash_logo_tl2.png";
import SplashImage from "../assets/splash.webp";
import React, { useCallback, useState, useMemo, useRef, Suspense, lazy, useEffect } from "react";
import { useAuth } from "../providers/AuthProvider";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useUIState } from "../providers/UIStateProvider";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import Cookies from "js-cookie";
const GroupChatDrawer = lazy(() => import("./GroupChatDrawer"));
const ProfileDrawer = lazy(() => import("./ProfileDrawer"));
import { useQuery } from '@tanstack/react-query';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import UserList from "./UserList";
import { useChats } from "../providers/ChatsProvider";
import Slider from "react-slick";
import { decryptMessageWithChatKey } from "../lib/libSodium";
import { decryptInWorker } from "../crypto/cryptoClient";
import { decryptId, encryptId } from "../lib/crypto";

// ==================== Constants & Styles ====================
const activeBadgeStyle = { 
    position: "absolute", 
    bottom: "28px", 
    right: "-2px", 
    width: "14px", 
    height: "14px", 
    backgroundColor: "#34C759", 
    borderRadius: "50%", 
    border: "1px solid #fff" 
};

const getAvatarPositionStyle = (index, total) => ({
    position: "absolute",
    width: total === 1 ? "100%" : "50%",
    height: total === 1 ? "100%" : "50%",
    objectFit: "cover",
    borderRadius: "50%",
    top: total === 1 ? "0%" : index < 2 ? "0%" : "50%",
    left: total === 1 ? "0%" : index % 2 === 0 ? "0%" : "50%",
    border: "1px solid #fff",
});

const getInitialAvatarStyle = (index, total) => ({
    position: "absolute",
    width: total === 1 ? "100%" : "50%",
    height: total === 1 ? "100%" : "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#BDBDBD",
    textAlign: "center",
    paddingTop: "5px",
    color: "#fff",
    fontSize: total === 1 ? "14px" : "10px",
    fontWeight: "bold",
    borderRadius: "50%",
    top: total === 1 ? "0%" : index < 2 ? "0%" : "50%",
    left: total === 1 ? "0%" : index % 2 === 0 ? "0%" : "50%",
    border: "1px solid #fff",
});

// ==================== Slider Arrow Components ====================
const NextArrow = ({ onClick }) => (
    <IconButton
        onClick={onClick}
        sx={{
            backgroundColor: "#fff",
            boxShadow: 1,
            "&:hover": { backgroundColor: "#f0f0f0" },
            position: "absolute",
            top: "40%",
            transform: "translateY(-50%)",
            right: -18,
            zIndex: 2,
            width: 25,
            height: 25,
        }}
    >
        <ArrowForwardIosIcon sx={{ fontSize: "12px" }} />
    </IconButton>
);

const PrevArrow = ({ onClick }) => (
    <IconButton
        onClick={onClick}
        sx={{
            backgroundColor: "#fff",
            boxShadow: 1,
            "&:hover": { backgroundColor: "#f0f0f0" },
            position: "absolute",
            top: "40%",
            transform: "translateY(-50%)",
            left: -18,
            zIndex: 2,
            width: 25,
            height: 25,
        }}
    >
        <ArrowBackIosIcon sx={{ fontSize: "12px" }} />
    </IconButton>
);

const sliderSettings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    arrows: true,
    swipeToSlide: true,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
};

// ==================== Debounce Utility ====================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ==================== Memoized Chat Item Component ====================
const MemoizedChatItem = React.memo(({ index, style, data }) => {
    const chat = data.chats[index];
    const {
        authUser,
        handleChatClick,
        handleRightClick,
        selectedChatId,
        contextMenu,
        handleClose,
        handleDeleteChat,
        handleMarkRead,
        handleMarkUnRead,
        onlineUsers,
        decryptedId,
        api,
        drafts,
    } = data;

    const touchTimeoutRef = useRef(null);

    // Long press for mobile
    const handleTouchStart = useCallback((e) => {
        touchTimeoutRef.current = setTimeout(() => {
            handleRightClick(e, chat.id);
        }, 600);
    }, [handleRightClick, chat.id]);

    const handleTouchEnd = useCallback(() => {
        if (touchTimeoutRef.current) {
            clearTimeout(touchTimeoutRef.current);
        }
    }, []);

    const lastMessage = chat?.lastDecryptedMessage;
    const draftText = drafts?.[chat.id];
    const hasDraft = typeof draftText === "string" && draftText.trim() !== "";

    // Memoize participant and seen status calculation
    const { participant, isSeen } = useMemo(() => {
        let participant = null;
        let isSeen = false;

        if (!chat.is_group_chat) {
            const allParticipants = chat.participants || chat.chatParticipants || [];
            participant = allParticipants.find(
                (p) => (p?.user_code || p?.user?.user_code) !== authUser?.user_code
            );
            if (lastMessage) {
                isSeen = lastMessage.sender_id === authUser?.user_code
                    ? lastMessage.viewed_by?.includes(participant?.user_code)
                    : lastMessage.viewed_by?.includes(authUser?.user_code);
            }
        } else {
            const others = chat?.participants?.filter(p => p?.user_code !== authUser?.user_code);
            participant = others;
            if (lastMessage) {
                const viewedByArray = Array.isArray(lastMessage.viewed_by)
                    ? lastMessage.viewed_by
                    : [];
                isSeen = lastMessage.sender_id === authUser?.user_code
                    ? others.every(p => viewedByArray.includes(p?.user_code))
                    : viewedByArray.includes(authUser?.user_code);
            }
        }

        return { participant, isSeen };
    }, [chat, lastMessage, authUser]);

    // Memoize unseen count calculation
    const unseenCount = useMemo(() => {
        return (chat.messages || []).reduce((count, message) => {
            let viewedByArray = [];
            if (Array.isArray(message.viewed_by)) {
                viewedByArray = message.viewed_by;
            } else if (typeof message.viewed_by === 'string') {
                try {
                    viewedByArray = JSON.parse(message.viewed_by);
                } catch {}
            }
            const isUnseen =
                message.sender_id !== authUser?.user_code &&
                !viewedByArray.includes(authUser?.user_code);
            return isUnseen ? count + 1 : count;
        }, 0);
    }, [chat.messages, authUser]);

    const isOnline = useMemo(() => 
        onlineUsers?.some(u => u.user_code === participant?.user_code),
        [onlineUsers, participant]
    );

    const lastMessageTime = useMemo(() => {
        if (!lastMessage) return '';
        return new Date(lastMessage.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23'
        });
    }, [lastMessage]);

    const handleClick = useCallback(() => {
        handleChatClick(chat.id, chat.is_group_chat);
    }, [handleChatClick, chat.id, chat.is_group_chat]);

    const handleContextMenu = useCallback((e) => {
        handleRightClick(e, chat.id);
    }, [handleRightClick, chat.id]);

    return (
        <Box
            style={style}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            sx={{
                paddingTop: "10px",
                width: "100%",
                minHeight: "60px",
                display: "flex",
                marginBottom: "8px",
                cursor: "pointer",
                backgroundColor: chat.id == decryptedId ? "#f0f0f0" : "none",
                "&:hover": { background: "#E5E5EA" }
            }}
        >
            {/* Avatar */}
            {chat.is_group_chat ? (
                chat.photo ? (
                    <Avatar 
                        src={chat.photo.startsWith('data:') ? chat.photo : `${api}/${chat.photo}`} 
                        alt={chat.name} 
                        sx={{ width: 32, height: 32 }} 
                    />
                ) : (
                    <Avatar sx={{ width: 32, height: 32, position: "relative" }}>
                        <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
                            {chat?.participants?.slice(0, 4).map((participant, index, array) =>
                                participant.user_photo ? (
                                    <Box
                                        key={index}
                                        component="img"
                                        src={participant.user_photo.startsWith('data:') ? participant.user_photo : `${api}/${participant.user_photo}`}
                                        alt={participant.username}
                                        sx={getAvatarPositionStyle(index, array.length)}
                                    />
                                ) : (
                                    <Box key={index} sx={getInitialAvatarStyle(index, array.length)}>
                                        {participant.username?.charAt(0).toUpperCase()}
                                    </Box>
                                )
                            )}
                        </Box>
                    </Avatar>
                )
            ) : (
                <Box sx={{ position: "relative" }}>
                    {participant?.user_photo ? (
                        <Avatar 
                            src={
                                participant.user_photo.startsWith('data:') 
                                    ? participant.user_photo 
                                    : `${api}/${participant.user_photo || participant.user?.user_photo}`
                            } 
                            alt={participant.username} 
                            sx={{ width: 32, height: 32 }} 
                        />
                    ) : (
                        <Avatar sx={{ width: 32, height: 32, textAlign: "center", justifyContent: "center", alignItems: "center", fontSize: "14px", paddingTop: "5px" }}>
                            {participant?.username?.charAt(0).toUpperCase() || participant?.user?.username?.charAt(0).toUpperCase() || "?"}
                        </Avatar>
                    )}
                    {isOnline && <Box sx={{ ...activeBadgeStyle }} />}
                </Box>
            )}

            <Box sx={{ ml: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", width: 200 }}>
                    <Typography
                        sx={{
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            width: "110px",
                        }}
                    >
                        {chat.name}
                    </Typography>
                    <Typography>{lastMessageTime}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography
                        sx={{
                            width: 160,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            fontWeight: (lastMessage?.sender_id !== authUser?.user_code &&
                                !lastMessage?.viewed_by?.includes(authUser?.user_code)) ? 600 : 400,
                            color: (lastMessage?.sender_id !== authUser?.user_code &&
                                !lastMessage?.viewed_by?.includes(authUser?.user_code)) ? "#000" : hasDraft && chat.id != decryptedId ? "red" : "#3C3C4399"
                        }}
                    >
                        {hasDraft && chat.id != decryptedId
    ? `Draft: ${draftText}`
    : lastMessage && (lastMessage?.sender_id === authUser?.user_code
        ? `You: ${lastMessage?.text_content || lastMessage?.media_type || "deleted message"}`
        : lastMessage?.text_content || lastMessage?.media_type || `${lastMessage?.sender?.userfullname || lastMessage?.sender?.username} deleted a message`)}
                    </Typography>

                    {lastMessage?.sender_id === authUser?.user_code && (
                        isSeen ? <DoneAllIcon sx={{ fontSize: 18, color: "#14AE5C" }} /> : <CheckIcon sx={{ fontSize: 18 }} />
                    )}

                    {unseenCount > 0 && (
                        <Box
                            sx={{
                                backgroundColor: "#5b5bfdff",
                                color: "#fff",
                                borderRadius: "50%",
                                width: 20,
                                height: 20,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "12px",
                            }}
                        >
                            {unseenCount}
                        </Box>
                    )}
                </Box>
            </Box>

            {contextMenu !== null && chat.id === selectedChatId && (
                <Menu
                    open={true}
                    onClose={handleClose}
                    anchorReference="anchorPosition"
                    anchorPosition={{ top: contextMenu.mouseY, left: contextMenu.mouseX }}
                >
                    <MenuItem onClick={(e) => {
                        e.stopPropagation();
                        const encryptedId = encodeURIComponent(encryptId(chat.id));
                        const url = `/conversation/c/${encryptedId}`;
                        window.open(url, "_blank", "noopener,noreferrer");
                        handleClose();
                    }}>
                        Open Chat
                    </MenuItem>
                    <MenuItem onClick={(e) => { e.stopPropagation(); handleDeleteChat(); handleClose(); }}>
                        Delete Chat
                    </MenuItem>
                    <MenuItem onClick={(e) => { e.stopPropagation(); handleMarkRead(chat.id); handleClose(); }}>
                        Mark as read
                    </MenuItem>
                    {(lastMessage?.sender_id !== authUser?.user_code) && (
                        <MenuItem onClick={(e) => { e.stopPropagation(); handleMarkUnRead(chat.id); handleClose(); }}>
                            Mark as unread
                        </MenuItem>
                    )}
                </Menu>
            )}
        </Box>
    );
}, (prevProps, nextProps) => {
    // Custom comparison for better performance
    const prevChat = prevProps.data.chats[prevProps.index];
    const nextChat = nextProps.data.chats[nextProps.index];
    
    return (
        prevChat?.id === nextChat?.id &&
        prevChat?.lastDecryptedMessage?.id === nextChat?.lastDecryptedMessage?.id &&
        prevChat?.lastDecryptedMessage?.viewed_by?.length === nextChat?.lastDecryptedMessage?.viewed_by?.length &&
        +   prevChat?.lastDecryptedMessage?.text_content === nextChat?.lastDecryptedMessage?.text_content &&
+   prevChat?.lastDecryptedMessage?.media_url === nextChat?.lastDecryptedMessage?.media_url &&
        prevProps.data.decryptedId === nextProps.data.decryptedId &&
        prevProps.data.onlineUsers?.length === nextProps.data.onlineUsers?.length &&
        prevProps.data.drafts?.[prevChat.id] === nextProps.data.drafts?.[nextChat.id]
    );
});

MemoizedChatItem.displayName = 'MemoizedChatItem';

// ==================== Main SideBar Component ====================
export default function SideBar() {
    const rightClickRef = useRef(false);
    const { authUser, logout, updateAuthenticatedUser } = useAuth();
    const { 
        socket, 
        chats, 
        dispatch, 
        onlineUsers, 
        mutedChat, 
        setMutedChat, 
        isLoading, 
        isError, 
        fetchChats,
        
    } = useChats();
    const { drafts } = useUIState();
    
    const { type, id } = useParams();
    const decryptedId = id ? decryptId(decodeURIComponent(id)) : null;

    // ==================== Consolidated State ====================
    const [drawerState, setDrawerState] = useState({
        groupChat: false,
        profile: false,
    });

    const [menuState, setMenuState] = useState({
        context: null,
        anchorEl: null,
        selectedChatId: null,
    });

    const [searchState, setSearchState] = useState({
        term: '',
        filteredUsers: [],
    });

    const [selectedFilter, setSelectedFilter] = useState('all');
    
    const api = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('token');
    const navigate = useNavigate();

    // ==================== Drawer Handlers ====================
    const handleOpenGroupChatDrawer = useCallback(() => {
        setDrawerState(prev => ({ ...prev, groupChat: true }));
    }, []);

    const handleCloseGroupChatDrawer = useCallback(() => {
        setDrawerState(prev => ({ ...prev, groupChat: false }));
    }, []);

    const handleOpenProfileDrawer = useCallback(() => {
        setDrawerState(prev => ({ ...prev, profile: true }));
    }, []);

    const handleCloseProfileDrawer = useCallback(() => {
        setDrawerState(prev => ({ ...prev, profile: false }));
    }, []);

    // ==================== Navigation Handlers ====================
    const handleChatClick = useCallback((chatId, isGroupChat) => {

        if (rightClickRef.current) {
            rightClickRef.current = false;
            return;
        }
            // dispatch({ type: "RESET_MESSAGES" });

        const encryptedId = encodeURIComponent(encryptId(chatId));
        navigate(`/conversation/c/${encryptedId}`);
    }, [navigate]);

    const handleRightClick = useCallback((event, chatId) => {
        event.preventDefault();
        event.stopPropagation();
        rightClickRef.current = true;
        setMenuState({
            context: { mouseX: event.clientX, mouseY: event.clientY },
            anchorEl: null,
            selectedChatId: chatId,
        });
    }, []);

    const handleClose = useCallback(() => {
        setMenuState({
            context: null,
            anchorEl: null,
            selectedChatId: null,
        });

    }, []);

    // ==================== Filtered Chats (Memoized) ====================
    const filteredChats = useMemo(() => {
        if (!chats) return [];
        
        switch (selectedFilter) {
            case 'personalized':
                return chats.filter(chat => chat.is_group_chat === false);
            case 'groups':
                return chats.filter(chat => chat.is_group_chat === true);
            case 'onlineUsers':
                return onlineUsers;
            default:
                return chats;
        }
    }, [chats, selectedFilter, onlineUsers]);

    // ==================== Settings Menu Handlers ====================
    const handleNotiClick = useCallback((event) => {
        setMenuState(prev => ({ ...prev, anchorEl: event.currentTarget }));
    }, []);

    const handleNotiClose = useCallback(() => {
        setMenuState(prev => ({ ...prev, anchorEl: null }));
    }, []);

    const handleActiveStatusToggle = useCallback(async () => {
        const newStatus = !authUser.hide_active_status;
        updateAuthenticatedUser({ hide_active_status: newStatus });

        socket.emit("updateActiveStatus", { hideActiveStatus: newStatus }, (ack) => {
            if (!ack?.ok) {
                updateAuthenticatedUser({ hide_active_status: !newStatus });
            }
        });
    }, [authUser, socket, updateAuthenticatedUser]);

    const handleNotificationToggle = useCallback(async () => {
        try {
            const endpoint = mutedChat === false ? 'mute' : 'unmute';
            const response = await fetch(`${api}/api/allChats/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.status === 1) {
                setMutedChat(!mutedChat);
            }

            if (response.status === 201) {
                fetchChats();
            }
        } catch (error) {
            console.error('Error during notification toggle:', error);
        }
    }, [mutedChat, api, token, setMutedChat, fetchChats]);

    const handleLogout = useCallback(() => {
        logout();
        if (socket?.connected) {
            socket.disconnect();
        }
        navigate(("/login"))
        // const redirectUri = encodeURIComponent(window.location.href);
        // window.location.href = `https://sso.trustlinkmm.com/loginForm?redirect_uri=${redirectUri}`;
    }, [logout, socket]);

    // ==================== Chat Actions ====================
    const handleDeleteChat = useCallback(async () => {
        try {
            const response = await fetch(`${api}/api/chats/delete/${menuState.selectedChatId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const result = await response.json();
            if (result.status === 1) {
                dispatch({
                    type: "SELF_DELETE_CHAT",
                    payload: menuState.selectedChatId,
                });
                navigate("/");
            }
        } catch (error) {
            console.error('Error deleting chat:', error);
        }
    }, [api, token, menuState.selectedChatId, dispatch, navigate]);

    const handleMarkRead = useCallback(async (selectedChatId) => {
        try {
            await fetch(`${api}/api/messages/markReadAllMessages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ chatId: selectedChatId })
            });
        } catch (error) {
            console.error('Error marking chat as read:', error);
        }
    }, [api, token]);

    const handleMarkUnRead = useCallback(async (selectedChatId) => {
        try {
            await fetch(`${api}/api/messages/markUnReadLatestMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ chatId: selectedChatId })
            });
        } catch (error) {
            console.error('Error marking chat as unread:', error);
        }
    }, [api, token]);

    // ==================== User Click Handler ====================
    const handleUserClick = useCallback(async (user, text = "normal", newtab = false) => {
        const existingChat = chats?.find(chat =>
            chat.is_group_chat === false &&
            chat.participants?.length === 2 &&
            chat.participants?.some(p => p.user_code === user.user_code) &&
            chat.participants?.some(p => p.user_code === authUser.user_code)
        );

        const existingGroupChat = chats?.find(chat => chat.id === user.id);

        setSearchState(prev => ({ ...prev, filteredUsers: [] }));

        if (existingChat) {
            dispatch({ type: "RESET_CHAT" });
            
            const encryptedId = encodeURIComponent(encryptId(existingChat.id));
            if (newtab) {
                window.open(`/conversation/c/${encryptedId}`, "_blank", "noopener,noreferrer");
            } else {
                navigate(`/conversation/c/${encryptedId}`);
            }
        } else if (existingGroupChat) {
    dispatch({ type: "RESET_CHAT" });

            const encryptedId = encodeURIComponent(encryptId(existingGroupChat.id));
            if (newtab) {
                window.open(`/conversation/c/${encryptedId}`, "_blank", "noopener,noreferrer");
            } else {
                navigate(`/conversation/c/${encryptedId}`);
            }
        } else {
            dispatch({ type: "RESET_CHAT" });
            const encryptedId = encodeURIComponent(encryptId(user.user_code));
            if (newtab) {
                window.open(`/conversation/u/${encryptedId}`, "_blank", "noopener,noreferrer");
            } else {
                navigate(`/conversation/u/${encryptedId}`);
            }
        }

        setSearchState(prev => ({ ...prev, term: '' }));
    }, [chats, authUser, dispatch, navigate]);

    // ==================== Debounced Search ====================
    const debouncedSearch = useMemo(
        () => debounce((value, users, chats, authUser) => {
            if (value) {
                const lowercasedValue = value.toLowerCase();

                const matchedUsers = users?.filter(user =>
                    user.user_code !== authUser.user_code &&
                    (
                        user.username?.toLowerCase().includes(lowercasedValue) ||
                        user.department_name?.toLowerCase().includes(lowercasedValue)
                    )
                ).map(user => ({ ...user, type: "user" })) || [];

                const matchedChats = chats?.map(chat => {
                    const chatNameMatch = chat.is_group_chat &&
                        chat.name?.toLowerCase().includes(lowercasedValue);

                    const matchingMessages = chat?.messages?.filter(msg =>
                        msg.text_content?.toLowerCase().includes(lowercasedValue)
                    ) || [];

                    const latestMatchingMessage = matchingMessages.length > 0
                        ? matchingMessages[matchingMessages.length - 1].text_content
                        : null;

                    if (chatNameMatch || latestMatchingMessage) {
                        return {
                            ...chat,
                            type: "chat",
                            highlight: chatNameMatch ? "name" : "message",
                            matchedMessage: latestMatchingMessage
                        };
                    }
                    return null;
                }).filter(Boolean) || [];

                setSearchState(prev => ({ 
                    ...prev, 
                    filteredUsers: [...matchedUsers, ...matchedChats] 
                }));
            } else {
                setSearchState(prev => ({ ...prev, filteredUsers: [] }));
            }
        }, 300),
        []
    );

    const { data: users } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await fetch(`${api}/api/users`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch users');
            return response.json();
        },
        enabled: !!authUser,
        staleTime: 1000 * 60 * 5,
    });

    const handleUserSearch = useCallback((event) => {
        const { value } = event.target;
        setSearchState(prev => ({ ...prev, term: value }));
        debouncedSearch(value, users, chats, authUser);
    }, [debouncedSearch, users, chats, authUser]);

    // ==================== Memoized Item Data ====================
    const virtualizedItemData = useMemo(() => ({
        chats: filteredChats,
        authUser,
        handleChatClick,
        handleRightClick,
        selectedChatId: menuState.selectedChatId,
        contextMenu: menuState.context,
        handleClose,
        handleDeleteChat,
        handleMarkRead,
        handleMarkUnRead,
        onlineUsers,
        decryptedId,
        api,
        drafts,
    }), [
        filteredChats,
        authUser,
        handleChatClick,
        handleRightClick,
        menuState.selectedChatId,
        menuState.context,
        handleClose,
        handleDeleteChat,
        handleMarkRead,
        handleMarkUnRead,
        onlineUsers,
        decryptedId,
        api,
        drafts,
    ]);

    // ==================== Loading/Error States ====================
    if (!chats) {
        return <Box>Loading...</Box>;
    }

    if (isError) {
        return <Box>Error loading chats</Box>;
    }

    // ==================== Main Render ====================
    return (
        <Box
            sx={{
                width: "300px",
                height: "100vh",
                background: "#F6FBFD",
                borderRight: "1px solid #E5E5EA",
                paddingBottom: "80px",
                paddingLeft: "20px",
                paddingRight: "20px",
            }}
        >
            {/* Header */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
                <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
                    <img
                        src={CompanyLogo}
                        alt="TrustLink"
                        decoding="async"
                        style={{ marginTop: "25px", mixBlendMode: "multiply" }}
                    />
                </Box>
                <IconButton
                    aria-label="Setting"
                    onClick={handleNotiClick}
                    sx={{
                        marginTop: "25px",
                        "&:hover": { background: "transparent" },
                    }}
                >
                    <SettingsIcon />
                </IconButton>
                <Menu
                    anchorEl={menuState.anchorEl}
                    open={Boolean(menuState.anchorEl)}
                    onClose={handleNotiClose}
                    PaperProps={{ style: { minWidth: '250px' } }}
                >
                    <MenuItem>
                        <ListItemIcon>
                            <NotificationsIcon fontSize="small" />
                        </ListItemIcon>
                        <Typography variant="inherit" sx={{ flexGrow: 1 }}>
                            Notification Permission
                        </Typography>
                        <Switch
                            checked={mutedChat === false}
                            onChange={handleNotificationToggle}
                            color="primary"
                        />
                    </MenuItem>
                    <MenuItem>
                        <ListItemIcon>
                            <NotificationsIcon fontSize="small" />
                        </ListItemIcon>
                        <Typography variant="inherit" sx={{ flexGrow: 1 }}>
                            Show Active Status
                        </Typography>
                        <Switch
                            checked={!authUser.hide_active_status}
                            onChange={handleActiveStatusToggle}
                            color="primary"
                        />
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>
                        <ListItemIcon>
                            <LogoutIcon fontSize="small" />
                        </ListItemIcon>
                        <Typography variant="inherit">Logout</Typography>
                    </MenuItem>
                </Menu>
            </Box>

            {/* Search and Group Chat */}
            <Box sx={{ marginTop: "20px" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Box sx={{ width: "244px" }}>
                        <TextField
                            fullWidth
                            type="text"
                            placeholder="Search by username or department"
                            value={searchState.term}
                            onChange={handleUserSearch}
                            sx={{
                                display: "flex",
                                '& .MuiOutlinedInput-root': {
                                    '&.Mui-focused fieldset': {
                                        border: "0.5px solid #C6C6C8",
                                    },
                                    borderRadius: "10px",
                                    height: "40px",
                                },
                            }}
                        />
                    </Box>
                    <Tooltip title="Create Group Chat">
                        <IconButton
                            aria-label="group chat"
                            onClick={handleOpenGroupChatDrawer}
                            sx={{ "&:hover": { background: "transparent" } }}
                        >
                            <GroupsIcon sx={{ fontSize: "30px" }} />
                        </IconButton>
                    </Tooltip>
                    {drawerState.groupChat && (
                        <Suspense fallback={<div>loading...</div>}>
                            <GroupChatDrawer
                                openGroupChatDrawer={drawerState.groupChat}
                                closeGroupChatDrawer={handleCloseGroupChatDrawer}
                            />
                        </Suspense>
                    )}
                </Box>

                {searchState.filteredUsers?.length > 0 && (
                    <Box>
                        <UserList
                            filteredUsers={searchState.filteredUsers}
                            handleUserClick={handleUserClick}
                            api={api}
                            searchTerm={searchState.term}
                        />
                    </Box>
                )}

                {/* Active Users Slider */}
                <Box>
                    <Slider {...sliderSettings}>
                        {onlineUsers?.map((user) => (
                            <Box
                                key={user.user_code}
                                sx={{
                                    textAlign: "center",
                                    padding: 1,
                                    width: "100%",
                                    cursor: "pointer",
                                }}
                                onClick={() => handleUserClick(user, "online")}
                            >
                                <Box
                                    sx={{
                                        position: "relative",
                                        display: "inline-block",
                                        width: 34,
                                        height: 34,
                                    }}
                                >
                                    <Avatar
                                        src={
                                            user?.user_photo
                                                ? (user.user_photo.startsWith('data:') ? user.user_photo : `${api}/${user.user_photo}`)
                                                : SplashImage
                                        }
                                        alt={user?.username || "Username"}
                                        sx={{
                                            width: 34,
                                            height: 34,
                                            background: "#D9D9D9",
                                            fontSize: "16px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            textTransform: "uppercase",
                                            "& img": {
                                                objectFit: "cover",
                                                width: "100%",
                                                height: "100%",
                                                padding: "2px",
                                                borderRadius: "50%",
                                                backgroundColor: "#fff",
                                            }
                                        }}
                                    >
                                        {!user?.user_photo &&
                                            user?.username
                                                ?.split(" ")
                                                .map((n) => n[0])
                                                .join("")
                                                .slice(0, 2)}
                                    </Avatar>
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            bottom: -1,
                                            right: -4,
                                            width: 12,
                                            height: 12,
                                            backgroundColor: "#34C759",
                                            borderRadius: "50%",
                                            border: "1px solid #fff",
                                        }}
                                    />
                                </Box>
                                <Typography
                                    variant="caption"
                                    title={user.username}
                                    sx={{
                                        fontSize: "12px",
                                        color: "#000",
                                        overflow: "hidden",
                                        whiteSpace: "nowrap",
                                        textOverflow: "ellipsis",
                                        maxWidth: "100%",
                                        minHeight: "16px",
                                        marginTop: "4px",
                                        mx: "auto",
                                        display: "block",
                                    }}
                                >
                                    {user.username}
                                </Typography>
                            </Box>
                        ))}
                    </Slider>
                </Box>

                {/* Filter Buttons */}
                <Box
                    sx={{
                        marginTop: "15px",
                        borderRadius: "15px",
                        background: "#f5f5f5",
                        display: "flex",
                        justifyContent: "space-around",
                        alignItems: "center",
                        padding: "8px",
                        gap: "4px",
                    }}
                >
                    <Button
                        onClick={() => setSelectedFilter('all')}
                        sx={{
                            borderRadius: "50px",
                            background: selectedFilter === 'all' ? "#fff" : "none",
                            color: selectedFilter === 'all' ? "#28A745" : "#808080",
                            padding: "8px 16px",
                            fontSize: "12px",
                            fontWeight: "500",
                            transition: "all 0.2s ease",
                            "&:hover": {
                                background: selectedFilter === 'all' ? "#218838" : "#e8f5e9",
                                transform: "translateY(-1px)",
                            }
                        }}
                    >
                        All
                    </Button>
                    <Button
                        onClick={() => setSelectedFilter('personalized')}
                        sx={{
                            borderRadius: "50px",
                            background: selectedFilter === 'personalized' ? "#fff" : "none",
                            color: selectedFilter === 'personalized' ? "#28A745" : "#808080",
                            padding: "8px 16px",
                            fontSize: "12px",
                            fontWeight: "500",
                            transition: "all 0.2s ease",
                            "&:hover": {
                                background: selectedFilter === 'personalized' ? "#218838" : "#e8f5e9",
                                transform: "translateY(-1px)",
                            }
                        }}
                    >
                        Personalized
                    </Button>
                    <Button
                        onClick={() => setSelectedFilter('groups')}
                        sx={{
                            borderRadius: "50px",
                            background: selectedFilter === 'groups' ? "#fff" : "none",
                            color: selectedFilter === 'groups' ? "#28A745" : "#808080",
                            padding: "8px 16px",
                            fontSize: "12px",
                            fontWeight: "500",
                            transition: "all 0.2s ease",
                            "&:hover": {
                                background: selectedFilter === 'groups' ? "#218838" : "#e8f5e9",
                                transform: "translateY(-1px)",
                            }
                        }}
                    >
                        Groups
                    </Button>
                </Box>

                {/* Chat List */}
                <Box sx={{ height: "calc(100vh - 280px)", marginTop: "20px", position: "relative" }}>
                    <Typography
                        sx={{
                            fontSize: "16px",
                            fontWeight: "400",
                            color: "#3C3C4399",
                            marginBottom: "12px",
                        }}
                    >
                        Recent Conversations
                    </Typography>

                    {isLoading ? (
                        <Box
                            sx={{
                                height: "350px",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <CircularProgress sx={{ color: "#28A745" }} />
                        </Box>
                    ) : (
                        <Box sx={{ height: "350px", overflowY: "auto" }}>
                            {filteredChats.length > 0 ? (
                                <AutoSizer>
                                    {({ height, width }) => (
                                        <FixedSizeList
                                            height={height}
                                            width={width}
                                            itemCount={filteredChats.length}
                                            itemSize={72}
                                            overscanCount={5}
                                            itemData={virtualizedItemData}
                                        >
                                            {MemoizedChatItem}
                                        </FixedSizeList>
                                    )}
                                </AutoSizer>
                            ) : (
                                <Typography>No chats available</Typography>
                            )}
                        </Box>
                    )}
                </Box>
            </Box>

            {/* User Profile Footer */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    position: "fixed",
                    bottom: "0",
                    zIndex: 1000,
                    width: "300px",
                    paddingBottom: "8px",
                    background: "#F6FBFD",
                }}
            >
                {!authUser.hide_active_status ? (
                    <Box sx={{ position: "relative", display: "inline-block" }}>
                        <Avatar
                            src={
                                authUser?.user_photo
                                    ? (authUser.user_photo.startsWith('data:') ? authUser.user_photo : `${api}/${authUser.user_photo}`)
                                    : SplashImage
                            }
                            alt={authUser?.username || "username"}
                            sx={{ width: "44px", height: "44px", background: "#D9D9D9" }}
                        />
                        <Box
                            sx={{
                                position: "absolute",
                                bottom: "2px",
                                right: "-4px",
                                width: "14px",
                                height: "14px",
                                backgroundColor: "#34C759",
                                borderRadius: "50%",
                                border: "1px solid #fff",
                            }}
                        />
                    </Box>
                ) : (
                    <Avatar
                        src={authUser?.user_photo ? `${api}/${authUser.user_photo}` : SplashImage}
                        alt={authUser?.username || "username"}
                        sx={{ width: "44px", height: "44px", background: "#D9D9D9" }}
                    />
                )}

                <Box>
                    <Typography sx={{ fontSize: "16px", fontWeight: "400", color: "#000000" }}>
                        {authUser.username}
                    </Typography>
                    <Button
                        onClick={handleOpenProfileDrawer}
                        sx={{
                            fontSize: "14px",
                            fontWeight: "400",
                            color: "#A8A8A8",
                            textTransform: "none",
                            maxHeight: "16px",
                            "&:hover": {
                                background: "none",
                                transform: "none",
                            },
                        }}
                    >
                        View profile
                    </Button>

                    {drawerState.profile && (
                        <Suspense fallback={<div>Loading ...</div>}>
                            <ProfileDrawer
                                openProfileDrawer={drawerState.profile}
                                closeProfileDrawer={handleCloseProfileDrawer}
                                userId={authUser.user_code}
                                recipient={authUser}
                            />
                        </Suspense>
                    )}
                </Box>
            </Box>
        </Box>
    );
}
