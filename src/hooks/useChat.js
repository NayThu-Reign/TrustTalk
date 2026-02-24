import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useMessages } from '../contexts/MessagesContext';
import { chatService } from '../services/chatService';

export function useChat(chatId) {
  const { socket, authUser, users } = useAuth();
  const { messages, setMessages, clearMessages } = useMessages();
  const [chat, setChat] = useState(null);
  const [recipient, setRecipient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mutedChat, setMutedChat] = useState(false);
  
  const currentChatRef = useRef(chatId);

  // Fetch chat data
  const fetchChat = useCallback(async () => {
    if (!chatId) {
      setChat(null);
      clearMessages();
      setRecipient(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const chatData = await chatService.fetchChat(chatId);

      // Update participants with user data
      const updatedChat = {
        ...chatData,
        participants: chatData.participants.map((participant) => {
          const foundUser = users.find((u) => u.employeeId == participant.employeeId);
          return {
            ...participant,
            active: foundUser?.active || false,
            logoutTime: foundUser?.logoutTime || null,
            photo: foundUser?.photo || null,
          };
        })
      };

      setChat(updatedChat);
      setMessages(chatData.messages);

      // Set recipient
      const recipient = updatedChat.participants.find(
        participant => participant.employeeId !== authUser.staff_code
      );
      setRecipient(recipient);

      // Check if chat is muted
      const mutedBy = updatedChat.mutedBy || '[]';
      setMutedChat(mutedBy.includes(authUser.staff_code));

      setError(null);
    } catch (err) {
      console.error('Error fetching chat:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [chatId, users, authUser.staff_code, setMessages, clearMessages]);

  // Handle socket events
  useEffect(() => {
    if (!socket || !chatId) return;

    const handleParticipantUpdate = (data) => {
      if (data.chatId !== chatId) return;

      setChat(prevChat => ({
        ...prevChat,
        participants: prevChat.participants.map(participant => {
          if (participant.employeeId === data.participantId) {
            return { ...participant, ...data.updates };
          }
          return participant;
        })
      }));
    };

    const handleChatUpdate = (data) => {
      if (data.chatId !== chatId) return;
      setChat(prevChat => ({ ...prevChat, ...data.updates }));
    };

    socket.emit('joinChat', chatId);
    socket.on('participantUpdated', handleParticipantUpdate);
    socket.on('chatUpdated', handleChatUpdate);

    return () => {
      socket.emit('leaveChat', chatId);
      socket.off('participantUpdated', handleParticipantUpdate);
      socket.off('chatUpdated', handleChatUpdate);
    };
  }, [socket, chatId]);

  // Handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && chatId) {
        socket.emit('joinChat', chatId);
        fetchChat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [chatId, socket, fetchChat]);

  // Initial fetch
  useEffect(() => {
    if (chatId !== currentChatRef.current) {
      currentChatRef.current = chatId;
      fetchChat();
    }
  }, [chatId, fetchChat]);

  // Message handlers
  const sendMessage = useCallback(async (content) => {
    if (!chatId) return;
    try {
      await chatService.sendMessage(chatId, content);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [chatId]);

  const updateMessage = useCallback(async (messageId, updates) => {
    if (!chatId) return;
    try {
      await chatService.updateMessage(chatId, messageId, updates);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [chatId]);

  const deleteMessage = useCallback(async (messageId) => {
    if (!chatId) return;
    try {
      await chatService.deleteMessage(chatId, messageId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [chatId]);

  const toggleMute = useCallback(async () => {
    if (!chatId) return;
    try {
      const updates = { mutedBy: mutedChat ? 
        chat.mutedBy.filter(id => id !== authUser.staff_code) :
        [...(chat.mutedBy || []), authUser.staff_code]
      };
      await chatService.updateChat(chatId, updates);
      setMutedChat(!mutedChat);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [chatId, mutedChat, chat, authUser.staff_code]);

  return {
    chat,
    recipient,
    messages,
    loading,
    error,
    mutedChat,
    sendMessage,
    updateMessage,
    deleteMessage,
    toggleMute,
    refreshChat: fetchChat
  };
}
