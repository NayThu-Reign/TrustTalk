import { useCallback } from 'react';
import { decryptInWorker } from '../crypto/cryptoClient';

/**
 * Custom hook for handling scroll to message functionality
 * @param {Object} params - Hook parameters
 * @param {Array} params.messages - Current messages array
 * @param {Object} params.searchState - Search state object
 * @param {Function} params.scrollToMessage - Function to scroll to a message element
 * @param {Function} params.updateMessageState - Function to update message state
 * @param {Function} params.dispatch - Dispatch function for chat state
 * @param {string} params.chatId - Current chat ID
 * @param {Function} params.decryptMedia - Function to decrypt media
 * @param {Function} params.setLoadingPinnedMessage - Function to set loading state
 * @returns {Object} Object containing scroll to message handler
 */
export function useScrollToMessage({
  messages,
  searchState,
  scrollToMessage,
  updateMessageState,
  dispatch,
  chatId,
  decryptMedia,
  setLoadingPinnedMessage,
}) {
  /**
   * Handle scrolling to a specific message, loading it from SQLite if needed
   */
  const handleScrollToMessage = useCallback(
    async (messageId) => {
      // Check if the message exists in currently loaded messages
      const isMessageInLoadedMessages = messages.some(
        (message) => message.id === messageId
      );

      if (isMessageInLoadedMessages) {
        // Message is already loaded, just scroll to it
        scrollToMessage(messageId);

        // Highlight the message for 10 seconds
        updateMessageState({
          highlightedId: messageId,
        });

        setTimeout(() => {
          updateMessageState({
            highlightedId: null,
          });
        }, 10000);

        return;
      }

      // Check if the message is in search results (already decrypted)
      const messageInSearchResults = searchState.results.find(
        (sr) => sr.id === messageId
      );

      if (messageInSearchResults) {
        console.log(
          'Message found in search results, loading minimal context...'
        );
        setLoadingPinnedMessage(true);

        try {
          if (!window.messageDb) {
            console.error('SQLite database not available');
            setLoadingPinnedMessage(false);
            return;
          }

          // Get just a few messages around this one for context
          const contextMessages =
            await window.messageDb.getMessagesAroundTimestamp(
              chatId,
              messageInSearchResults.created_at,
              20 // Reduced to 20 for faster loading
            );

          console.log(
            `Loaded ${contextMessages.length} messages from SQLite for context`
          );

          // Decrypt only the NEW messages
          const decryptedMessages = await decryptMessages({
            contextMessages,
            messages,
            messageId,
            chatId,
            decryptMedia,
          });

          // Add the search result message itself (already decrypted)
          decryptedMessages.push(messageInSearchResults);

          // Update state and scroll
          updateMessagesAndScroll({
            decryptedMessages,
            messages,
            dispatch,
            messageId,
            scrollToMessage,
            updateMessageState,
          });
        } catch (error) {
          console.error('Error loading message from search results:', error);
        } finally {
          setLoadingPinnedMessage(false);
        }

        return;
      }

      // Message is not in search results, need to fetch it from SQLite
      console.log(
        'Message not in loaded messages or search, loading from SQLite...'
      );
      setLoadingPinnedMessage(true);

      try {
        if (!window.messageDb) {
          console.error('SQLite database not available');
          setLoadingPinnedMessage(false);
          return;
        }

        const targetMessage = await window.messageDb.getMessageById(messageId);

        if (!targetMessage) {
          console.warn('Message not found in SQLite database');
          setLoadingPinnedMessage(false);
          return;
        }

        // Get messages around this timestamp
        const contextMessages =
          await window.messageDb.getMessagesAroundTimestamp(
            chatId,
            targetMessage.created_at,
            100
          );

        console.log(
          `Loaded ${contextMessages.length} messages from SQLite for context`
        );

        // Decrypt the messages
        const decryptedMessages = await decryptMessages({
          contextMessages,
          messages,
          messageId: null,
          chatId,
          decryptMedia,
        });

        // Update state and scroll
        updateMessagesAndScroll({
          decryptedMessages,
          messages,
          dispatch,
          messageId,
          scrollToMessage,
          updateMessageState,
        });
      } catch (error) {
        console.error('Error loading message from SQLite:', error);
      } finally {
        setLoadingPinnedMessage(false);
      }
    },
    [
      messages,
      searchState.results,
      scrollToMessage,
      updateMessageState,
      dispatch,
      chatId,
      decryptMedia,
      setLoadingPinnedMessage,
    ]
  );

  return {
    handleScrollToMessage,
  };
}

/**
 * Decrypt messages from SQLite
 */
async function decryptMessages({
  contextMessages,
  messages,
  messageId,
  chatId,
  decryptMedia,
}) {
  const decryptedMessages = [];

  for (const originalMsg of contextMessages) {
    const msg = { ...originalMsg };

    // Skip if already in messages array or if it's the target message (already decrypted in search)
    if (
      messages.some((m) => m.id === msg.id) ||
      (messageId && msg.id === messageId)
    ) {
      continue;
    }

    // TEXT DECRYPTION
    if (!msg.text_content && msg.ciphertext && msg.nonce) {
      try {
        msg.text_content = await decryptInWorker({
          chatId,
          ciphertext: msg.ciphertext,
          nonce: msg.nonce,
          version: msg.key_version,
        });
      } catch (error) {
        console.error('Failed to decrypt message text:', error);
        continue;
      }
    }

    // Decrypt original message if it's a reply
    if (msg.originalMessage?.nonce) {
      try {
        msg.originalMessage.text_content = await decryptInWorker({
          chatId,
          ciphertext: msg.originalMessage.ciphertext,
          nonce: msg.originalMessage.nonce,
          version: msg.originalMessage.key_version,
        });
      } catch (error) {
        console.error('Failed to decrypt original message:', error);
      }
    }

    // MEDIA DECRYPTION
    if (!msg.text_content && msg.media_type) {
      if (
        msg.media_type === 'gif' ||
        msg.media_type === 'sticker' ||
        !msg.nonce
      ) {
        msg.decryptedUrl = msg.media_url;
      } else if (msg.media_type !== 'poll') {
        try {
          msg.decryptedUrl = await decryptMedia(msg, chatId);
        } catch (error) {
          console.error('Failed to decrypt media:', error);
        }
      }
    }

    // Decrypt original message media
    if (msg.originalMessage?.media_type) {
      try {
        msg.originalMessage.decryptedUrl =
          msg.originalMessage.media_type === 'gif' ||
          msg.originalMessage.media_type === 'sticker'
            ? msg.originalMessage.media_url
            : await decryptMedia(msg.originalMessage, chatId);
      } catch (error) {
        console.error('Failed to decrypt original message media:', error);
      }
    }

    decryptedMessages.push(msg);
  }

  return decryptedMessages;
}

/**
 * Update messages state and scroll to target message
 */
function updateMessagesAndScroll({
  decryptedMessages,
  messages,
  dispatch,
  messageId,
  scrollToMessage,
  updateMessageState,
}) {
  // Remove duplicates and sort
  const uniqueDecryptedMessages = decryptedMessages.filter(
    (newMsg) => !messages.some((existingMsg) => existingMsg.id === newMsg.id)
  );
  uniqueDecryptedMessages.sort((a, b) => a.created_at - b.created_at);

  // Use PREPEND_MESSAGES to add them to the state
  if (uniqueDecryptedMessages.length > 0) {
    dispatch({
      type: 'PREPEND_MESSAGES',
      payload: uniqueDecryptedMessages,
    });
  }

  // Update media files
  // const allMessages = [...messages, ...uniqueDecryptedMessages];
  // dispatch({
  //   type: 'SET_MEDIA_DERIVED',
  //   payload: {
  //     sharedMedias: allMessages
  //       .filter((m) => ['image', 'gif', 'sticker'].includes(m.media_type))
  //       .slice(-3),
  //     medias: allMessages.filter((m) =>
  //       ['image', 'gif', 'sticker'].includes(m.media_type)
  //     ),
  //     sharedFiles: allMessages.filter((m) => m.media_type === 'file').slice(-5),
  //     files: allMessages.filter((m) => m.media_type === 'file'),
  //   },
  // });

  // Wait for DOM to update, then scroll
  setTimeout(() => {
    scrollToMessage(messageId);

    // Highlight the message
    updateMessageState({ highlightedId: messageId });
    setTimeout(() => {
      updateMessageState({ highlightedId: null });
    }, 10000);
  }, 200);
}
