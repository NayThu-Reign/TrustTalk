import { useCallback } from 'react';
import { fetchWithAuth } from '../hooks/fetchWithAuth';

/**
 * Custom hook for chat management actions (delete, pin, mute, remove participants, etc.)
 * @param {Object} params - Hook parameters
 * @param {Object} params.messageState - Current message state
 * @param {string} params.api - API base URL
 * @param {string} params.decryptedId - Decrypted chat ID
 * @param {string} params.token - Authentication token
 * @param {Object} params.socket - Socket.io instance
 * @param {string} params.id - Chat ID
 * @param {Function} params.handleMenuClose - Function to close menu
 * @param {Function} params.handleDeleteMessageClose - Function to close delete message dialog
 * @param {string} params.pinnedMessageId - ID of pinned message
 * @param {Function} params.handleDialogClose - Function to close dialog
 * @param {Object} params.chat - Current chat object
 * @param {Function} params.setMutedChat - Function to set muted chat state
 * @param {string} params.selectedParticipantId - Selected participant ID for removal
 * @param {Function} params.handleDialogClearClose - Function to clear and close dialog
 * @param {Function} params.handleClose - Function to close drawer/modal
 * @param {Function} params.navigate - React Router navigate function
 * @param {Function} params.handleLeaveDialogClearClose - Function to clear and close leave dialog
 * @returns {Object} Object containing all chat management handlers
 */
export function useChatManagement({
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
  dispatch
}) {
  /**
   * Handle delete message for everyone
   */
  const handleDeleteMessage = useCallback(
    async () => {
      if (messageState.selectedId) {
        const selectedMessageId = messageState.selectedId;
        try {
          const response = await fetchWithAuth(
            `${api}/api/messages/${decryptedId}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ messageId: selectedMessageId }),
            }
          );

          if (response) {
            console.log(
              'Message deletion successful, messageId:',
              selectedMessageId
            );

            socket.emit('deleteMessage', {
              chatId: id,
              messageId: selectedMessageId,
            });
            handleMenuClose();
            handleDeleteMessageClose();
          } else {
            console.log('Failed to delete message');
          }
        } catch (error) {
          console.log('Error deleting message:', error);
        }
      }
    },
    [
      messageState.selectedId,
      api,
      decryptedId,
      token,
      socket,
      id,
      handleMenuClose,
      handleDeleteMessageClose,
    ]
  );

  /**
   * Handle pin message
   */
  const handlePinMessage = useCallback(
    async (messageId) => {
      console.log('Pinning message:', messageId);
      try {
        const response = await fetchWithAuth(
          `${api}/api/messages/pin/${messageId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        console.log('Pin data:', data);

        if (data.status === 1) {
          console.log('Message pinned successfully, messageId:', messageId);
          handleMenuClose();
        } else {
          console.log('Failed to pin message');
        }
      } catch (error) {
        console.log('Error pinning message:', error);
      }
    },
    [api, token, handleMenuClose]
  );

  /**
   * Handle unpin message
   */
  const handleUnPinMessage = useCallback(
    async (pinnedMessageId) => {
      console.log('Unpinning message:', pinnedMessageId);
      if (pinnedMessageId) {
        try {
          const response = await fetchWithAuth(
            `${api}/api/messages/unpin/${pinnedMessageId}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            }
          );

          console.log('Unpin response:', response);

          if (response.status === 200) {
            console.log(
              'Message unpinned successfully, messageId:',
              pinnedMessageId
            );
            handleMenuClose();
            handleDialogClose();
          } else {
            console.log('Failed to unpin message');
          }
        } catch (error) {
          console.log('Error unpinning message:', error);
        }
      }
    },
    [pinnedMessageId, api, token, handleMenuClose, handleDialogClose]
  );

  /**
   * Handle mute chat
   */
  const handleMuteChat = useCallback(
    async () => {
      if (chat.id) {
        try {
          const response = await fetchWithAuth(
            `${api}/api/chats/mute/${chat.id}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const data = await response.json();
          console.log('Mute response:', response);

          if (response.status === 200) {
            dispatch({
              type: "UPDATE_CHAT_MUTED_BY",
              payload: data.muted_by
            });
          
            
          } else {
            console.log('Failed to mute chat');
          }
        } catch (error) {
          console.log('Error muting chat:', error);
        }
      }
    },
    [chat, api, token, setMutedChat]
  );

  /**
   * Handle unmute chat
   */
  const handleUnMuteChat = useCallback(
    async () => {
      if (chat.id) {
        try {
          const response = await fetchWithAuth(
            `${api}/api/chats/unmute/${chat.id}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const data = await response.json();
          console.log('Unmute response:', data);

          if (response.status === 200) {
            dispatch({
              type: "UPDATE_CHAT_MUTED_BY",
              payload: data.muted_by
            });
          
          
          } else {
            console.log('Failed to unmute chat');
          }
        } catch (error) {
          console.log('Error unmuting chat:', error);
        }
      }
    },
    [chat, api, token, setMutedChat]
  );

  /**
   * Handle confirm remove participant
   */
  const handleConfirmRemove = useCallback(
    async () => {
      if (selectedParticipantId) {
        const userIds = Array.isArray(selectedParticipantId)
          ? selectedParticipantId
          : [selectedParticipantId];

        const res = await fetch(`${api}/api/chats/${decryptedId}/remove-users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userIds }),
        });

        const data = await res.json();

        if (data.status === 1) {
          console.log('User removed successfully:', res);
          handleDialogClearClose();
          handleClose();
        }
      }
    },
    [
      selectedParticipantId,
      api,
      id,
      token,
      handleDialogClearClose,
      handleClose,
    ]
  );

  /**
   * Handle give admin privileges
   */
  const handleGiveAdmin = useCallback(
    async (participantId) => {
      if (participantId) {
        const userIds = participantId;
        console.log('Giving admin to participant:', userIds);

        const res = await fetchWithAuth(`${api}/api/chats/${decryptedId}/give-admin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userIds }),
        });

        console.log('Give admin response:', res);

        if (res.status === 200) {
          handleClose();
        }
      }
    },
    [api, id, token, handleClose]
  );

  /**
   * Handle leave chat
   */
  const handleLeaveChat = useCallback(
    async () => {
      if (!selectedParticipantId) {
        return false;
      }

      try {
        const response = await fetchWithAuth(
          `${api}/api/chats/leave/${chat.id}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 201) {
          navigate('/');
          handleLeaveDialogClearClose();
        } else {
          console.error('Leave chat failed');
        }
      } catch (error) {
        console.error('Error leaving chat:', error);
      }
    },
    [
      selectedParticipantId,
      api,
      chat,
      token,
      navigate,
      handleLeaveDialogClearClose,
    ]
  );

  /**
   * Handle mark all messages as read
   */
  const handleMarkRead = useCallback(
    async (selectedChatId) => {
      console.log('Marking chat as read:', selectedChatId);
      try {
        const response = await fetch(`${api}/api/messages/markReadAllMessages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ chatId: selectedChatId }),
        });

        const result = await response.json();
        console.log('Mark read result:', result);
        
        if (result.status === 1) {
          console.log('Messages marked as read successfully');
        } else {
          console.error('Failed to mark messages as read');
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    },
    [api, token]
  );

  /**
   * Send encrypted file message
   */
  const sendEncryptedFileMessage = useCallback(
    async ({
      file,
      fileName,
      fileType,
      repliedMessage,
      recipientId,
      chat,
      tempId,
      messageState,
      type,
      decryptedId,
    }) => {
      const formData = new FormData();

      if (chat) {
        const { encryptFileBeforeUpload } = await import(
          '../crypto/encryptBeforeUpload'
        );
        const { ciphertext, nonce } = await encryptFileBeforeUpload(
          file,
          chat.id
        );

        const encryptedBlob = new Blob([ciphertext]);
        formData.append('file', encryptedBlob, `${fileName}.enc`);
        formData.append('nonce', nonce);
        formData.append('chat_id', chat.id);
        formData.append(
          'key_version',
          sessionStorage.getItem(`chatkey_${chat.id}_latestVersion`) || 1
        );

        if (!chat.is_group_chat) {
          formData.append('recipient_id', recipientId);
        }
      } else {
        formData.append('file', file);
      }

      formData.append('file_name', fileName);
      formData.append('media_type', fileType);

      if (type === 'u') {
        formData.append('recipient_id', decryptedId);
      }

      if (messageState?.replied) {
        formData.append('reply_to', messageState.replied.id);
      }

      if (type === 'c') {
        formData.append('client_temp_id', tempId);
      }

      const res = await fetch(`${api}/api/uploadFileMessage`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      return res;
    },
    [api, token]
  );

  return {
    handleDeleteMessage,
    handlePinMessage,
    handleUnPinMessage,
    handleMuteChat,
    handleUnMuteChat,
    handleConfirmRemove,
    handleGiveAdmin,
    handleLeaveChat,
    handleMarkRead,
    sendEncryptedFileMessage,
  };
}
