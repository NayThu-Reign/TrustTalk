import { useEffect } from 'react';
import { io } from 'socket.io-client';

export const useChatsSocket = ({ authUser, currentChatId, dispatch }) => {
  useEffect(() => {
    if (!authUser?.user_code) return;

    const socket = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
      query: {
        user: JSON.stringify({ staff_code: authUser.user_code }),
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    if (currentChatId) {
      socket.emit('joinChat', currentChatId);
    }

    socket.emit('getOnlineUsers');

    const listeners = {
      newMessage: (msg) => dispatch({ type: 'ADD_MESSAGE', payload: msg }),
      setMessages: (messages) => dispatch({ type: 'SET_MESSAGES', payload: messages }),
      userTyping: ({ userId, username }) => dispatch({ type: 'UPDATE_TYPING_USER', payload: { userId, username } }),
      userStoppedTyping: ({ userId }) => dispatch({ type: 'REMOVE_TYPING_USER', payload: { userId } }),
      onlineUsersList: (users) => dispatch({ type: 'SET_ONLINE_USERS', payload: users }),
      pinnedMessages: (pinned) => dispatch({ type: 'SET_PINNED_MESSAGES', payload: pinned }),
      loading: (status) => dispatch({ type: 'SET_LOADING', payload: status }),
      mutedChat: (muted) => dispatch({ type: 'SET_MUTED_CHAT', payload: muted }),
    };

    Object.entries(listeners).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      Object.entries(listeners).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
      socket.disconnect();
    };
  }, [authUser?.user_code, currentChatId, dispatch]);
};