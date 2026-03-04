import { useCallback, startTransition } from 'react';
import { fetchWithAuth } from '../hooks/fetchWithAuth';

/**
 * Custom hook for message action handlers
 * @param {Object} params - Hook parameters
 * @param {Function} params.updateUIState - Function to update UI state
 * @param {Function} params.updateHoverState - Function to update hover state
 * @param {Function} params.updateMessageState - Function to update message state
 * @param {Function} params.dispatch - Dispatch function for chat state
 * @param {Function} params.handleMenuClose - Function to close menu
 * @param {Object} params.chat - Current chat object
 * @param {string} params.api - API base URL
 * @param {string} params.token - Authentication token
 * @param {Function} params.setCopiedToClipboard - Function to set clipboard copied state
 * @param {Function} params.setCopiedMessage - Function to set copied message
 * @returns {Object} Object containing all message action handlers
 */
export function useMessageActions({
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
}) {
  /**
   * Handle opening message context menu
   */
  const handleMenuClick = useCallback((event, messageId, message) => {
    updateUIState({ menuOpen: true });
    updateHoverState({
      anchorElS1: event.currentTarget,
      messageId: messageId,
    });
    updateMessageState({
      selectedId: messageId,
      selected: message,
    });
}, [updateUIState, updateHoverState, updateMessageState]);

  /**
   * Handle reply to message
   */
  const handleReply = useCallback(
    (message) => {
      console.log('Replying to message:', message);
      updateMessageState({
        replied: {
          id: message.id,
          chat_id: message.chat_id,
          sender: message.sender?.username,
          textContent: message.text_content,
          mediaUrl: message.media_url,
          mediaType: message.media_type,
          decryptedUrl: message.decryptedUrl,
        },
      });
    },
    [updateMessageState]
  );

  /**
   * Handle cancel reply
   */
  const handleCancelReply = useCallback(() => {
    updateMessageState({
      replied: null,
    });
  }, [updateMessageState]);

  /**
   * Handle edit message
   */
  const handleEdit = useCallback(
    (message) => {
      console.log('Editing message:', message);
      updateMessageState({
        edited: {
          id: message.id,
          chat_id: message.chat_id,
          sender: message.sender?.username,
          textContent: message.text_content,
        },
      });
    },
    [updateMessageState]
  );

  /**
   * Handle cancel edit
   */
  const handleCancelEdit = useCallback(() => {
    updateMessageState({
      edited: null,
    });
  }, [updateMessageState]);

  /**
   * Handle copy text to clipboard
   */
  const handleCopyText = useCallback(
    async (text) => {
      try {
        setCopiedToClipboard(true);
        setCopiedMessage(text);
        await navigator.clipboard.writeText(text);
        console.log('Text copied!');
      } catch (err) {
        console.error('Failed to copy text:', err);
      }
    },
    [setCopiedToClipboard, setCopiedMessage]
  );

  /**
   * Handle delete message for self only
   */
  const handleDeleteMessageForSelf = useCallback(
    async (messageId) => {
      try {
        await fetchWithAuth(`${api}/api/messages/${messageId}/deleteForSelf`, {
          method: 'PATCH',
          headers: {
            'CONTENT-TYPE': 'application/json',
            authorization: `bearer ${token}`,
          },
        });

        dispatch({
          type: 'DELETE_MESSAGE_FOR_SELF',
          payload: { chatId: chat.id, messageId },
        });

        handleMenuClose();
      } catch (error) {
        console.error('Failed to delete message for self', error);
      }
    },
    [dispatch, handleMenuClose, api, token, chat]
  );

  /**
   * Handle file change for chat photo update
   */
  const handleFileChange = useCallback(
    async (e) => {
      if (e.target.files) {
        const fileArray = Array.from(e.target.files);

        const filesData = await Promise.all(
          fileArray.map(async (file) => {
            const fileContent = await readFileContent(file);
            return { file, fileName: file.name, fileContent };
          })
        );

        console.log('File type:', filesData[0].file.type);

        const photo = filesData[0].fileContent;

        console.log('Photo:', photo);

        try {
          const result = await fetchWithAuth(
            `${api}/api/chats/photo-update/${chat.id}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                chat_photo: photo,
              }),
            }
          );

          const data = await result.json();

          if (data.status === 201) {
            console.log('Chat photo updated successfully');
          } else {
            console.log('Failed to update chat photo');
          }
        } catch (error) {
          console.error('Error updating chat photo:', error);
          throw error;
        }
      }
    },
    [api, chat, token]
  );

  return {
    handleMenuClick,
    handleReply,
    handleCancelReply,
    handleEdit,
    handleCancelEdit,
    handleCopyText,
    handleDeleteMessageForSelf,
    handleFileChange,
  };
}

/**
 * Helper function to read file content as data URL
 * @param {File} file - File to read
 * @returns {Promise<string>} Promise that resolves to file content as data URL
 */
function readFileContent(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve(event.target.result);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
}
