import { useState, useCallback } from 'react';
import { fetchWithAuth } from './fetchWithAuth';

/**
 * Custom hook for managing message operations (delete, pin, edit, reply, copy)
 */
export const useMessageManagement = (currentChatId, socket, fetchChat) => {
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [editedMessage, setEditedMessage] = useState(null);
  const [repliedMessage, setRepliedMessage] = useState(null);
  const [copiedMessage, setCopiedMessage] = useState(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [deleteMessageOpen, setDeleteMessageOpen] = useState(false);
  const [pinnedMessageId, setPinnedMessageId] = useState(null);

  const api = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('token');

  const handleDeleteMessage = useCallback(async (messageId) => {
    if (!messageId) return;

    try {
      const response = await fetchWithAuth(`${api}/api/messages/${currentChatId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ messageId })
      });

      if (response) {
        socket.emit('deleteMessage', { chatId: currentChatId, messageId });
        setDeleteMessageOpen(false);
        setSelectedMessageId(null);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }, [currentChatId, socket, api, token]);

  const handleDeleteMessageForSelf = useCallback(async (messageId) => {
    try {
      await fetchWithAuth(`${api}/api/messages/${messageId}/deleteForSelf`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error deleting message for self:', error);
    }
  }, [api, token]);

  const handlePinMessage = useCallback(async (messageId) => {
    try {
      const response = await fetchWithAuth(`${api}/api/messages/pin/${messageId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.status === 1) {
        // Message pinned successfully
      }
    } catch (error) {
      console.error('Error pinning message:', error);
    }
  }, [api, token]);

  const handleUnPinMessage = useCallback(async (messageId) => {
    console.log("unpinnn", messageId);
    if (!messageId) return;


    try {
      const response = await fetchWithAuth(`${api}/api/messages/unpin/${messageId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        // Message unpinned successfully
      }
    } catch (error) {
      console.error('Error unpinning message:', error);
    }
  }, [api, token]);

  const handleEditMessage = useCallback(async (textContent, messageId) => {
    if (!textContent || !messageId) return;

    try {
      const response = await fetchWithAuth(`${api}/api/messages/${messageId}/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text_content: textContent })
      });

      if (response) {
        socket.emit('editedMessage', response);
        setEditedMessage(null);
        fetchChat();
      }
    } catch (error) {
      console.error('Error editing message:', error);
    }
  }, [socket, fetchChat, api, token]);

  const handleReply = useCallback((message) => {
    setRepliedMessage({
      id: message.id,
      sender: message.sender?.username,
      textContent: message.text_content,
      mediaUrl: message.media_url,
      mediaType: message.media_type,
    });
  }, []);

  const handleCancelReply = useCallback(() => {
    setRepliedMessage(null);
  }, []);

  const handleEdit = useCallback((message) => {
    setEditedMessage({
      id: message.id,
      sender: message.sender?.username,
      textContent: message.text_content,
    });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditedMessage(null);
  }, []);

  const handleCopyText = useCallback(async (text) => {
    try {
      setCopiedToClipboard(true);
      setCopiedMessage(text);
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  }, []);

  const handleCopyMessage = useCallback((message) => {
    setCopiedToClipboard(true);
    setCopiedMessage(message);
    const contentToCopy = message.media_url 
      ? JSON.stringify(message.media_url)
      : String(message.text_content);
    
    navigator.clipboard.writeText(contentToCopy)
      .then(() => console.log('Message copied successfully!'))
      .catch((err) => console.error('Failed to copy message:', err));
  }, []);

  const openDeleteDialog = useCallback((messageId) => {
    setSelectedMessageId(messageId);
    setDeleteMessageOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteMessageOpen(false);
    setSelectedMessageId(null);
  }, []);

  const openPinDialog = useCallback((messageId) => {
    setPinnedMessageId(messageId);
  }, []);

  const closePinDialog = useCallback(() => {
    setPinnedMessageId(null);
  }, []);

  return {
    // State
    selectedMessageId,
    selectedMessage,
    editedMessage,
    repliedMessage,
    copiedMessage,
    copiedToClipboard,
    deleteMessageOpen,
    pinnedMessageId,
    
    // Setters
    setSelectedMessageId,
    setSelectedMessage,
    setCopiedToClipboard,
    
    // Actions
    handleDeleteMessage,
    handleDeleteMessageForSelf,
    handlePinMessage,
    handleUnPinMessage,
    handleEditMessage,
    handleReply,
    handleCancelReply,
    handleEdit,
    handleCancelEdit,
    handleCopyText,
    handleCopyMessage,
    openDeleteDialog,
    closeDeleteDialog,
    openPinDialog,
    closePinDialog,
  };
};

