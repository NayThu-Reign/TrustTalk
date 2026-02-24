import React, { createContext, useContext } from 'react';

/**
 * MessageContext - Provides message-related handlers and data to avoid prop drilling
 * 
 * This context eliminates the need to pass 50+ props through MessageList to MessageBubble.
 * Instead, MessageBubble can directly consume what it needs using useMessageContext().
 */
const MessageContext = createContext(null);

/**
 * Custom hook to consume MessageContext
 * @throws {Error} If used outside of MessageProvider
 * @returns {Object} All message-related handlers and data
 */
export const useMessageContext = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessageContext must be used within MessageProvider');
  }
  return context;
};

/**
 * MessageProvider - Wraps components that need access to message handlers
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {Object} props.value - All handlers and data to provide
 */
export const MessageProvider = ({ children, value }) => {
  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};

/**
 * Helper function to create the context value object
 * This organizes all the props into a clean structure
 * 
 * @param {Object} params - All parameters from Conversation component
 * @returns {Object} Organized context value
 */
export const createMessageContextValue = ({
  // Chat Data
  chat,
  recipient,
  
  // State
  hoverState,
  messageState,
  uiState,
  searchState,
  
  // Media & Files
  downloadedMessages,
  fullscreenImage,
  reactionIcons,
  
  // Handlers - Menu & Interaction
  handleMenuClick,
  handleMouseEnter,
  handleMouseLeave,
  handleToggleSendText,
  handleMenuClose,
  
  // Handlers - Message Actions
  handleReply,
  handleEdit,
  handleCopyText,
  handleOpenForwardMessageDrawer,
  handleCloseForwardMessageDrawer,
  
  // Handlers - Reactions
  handleOpenReactionPicker,
  handleOpenReactionDrawer,
  handleCloseReactionDrawer,
  handleCloseReactionPicker,
  handleReactionSelect,
  handleRemoveReaction,
  userReaction,
  
  // Handlers - Message Management
  handlePinMessage,
  handleUnPinMessage,
  handleDeleteMessageForSelf,
  handleDeleteMessageOpen,
  handleDeleteMessageClose,
  handleDeleteMessage,
  
  // Handlers - File & Media
  handleFileDownloadWrapper,
  openFullscreen,
  closeFullscreen,
  
  // Handlers - Send & Retry
  sendEncryptedMessage,
  sendEncryptedFileMessage,
  handleRetryFileMessage,
  
  // Utilities
  formatTime,
  MentionText,
  isMobileOrTablet,
  isParticipant,
  
  // State updaters
  updateMessageState,
}) => ({
  // Chat Data
  chat,
  recipient,
  
  // State
  hoverState,
  messageState,
  uiState,
  searchState,
  
  // Media & Files
  downloadedMessages,
  fullscreenImage,
  reactionIcons,
  
  // Handlers - Menu & Interaction
  handleMenuClick,
  handleMouseEnter,
  handleMouseLeave,
  handleToggleSendText,
  handleMenuClose,
  
  // Handlers - Message Actions
  handleReply,
  handleEdit,
  handleCopyText,
  handleOpenForwardMessageDrawer,
  handleCloseForwardMessageDrawer,
  
  // Handlers - Reactions
  handleOpenReactionPicker,
  handleOpenReactionDrawer,
  handleCloseReactionDrawer,
  handleCloseReactionPicker,
  handleReactionSelect,
  handleRemoveReaction,
  userReaction,
  
  // Handlers - Message Management
  handlePinMessage,
  handleUnPinMessage,
  handleDeleteMessageForSelf,
  handleDeleteMessageOpen,
  handleDeleteMessageClose,
  handleDeleteMessage,
  
  // Handlers - File & Media
  handleFileDownloadWrapper,
  openFullscreen,
  closeFullscreen,
  
  // Handlers - Send & Retry
  sendEncryptedMessage,
  sendEncryptedFileMessage,
  handleRetryFileMessage,
  
  // Utilities
  formatTime,
  MentionText,
  isMobileOrTablet,
  isParticipant,
  
  // State updaters
  updateMessageState,
});
