import React, { useMemo } from 'react';
import { Box, Typography, Button } from '@mui/material';
import MessageBubble from './MessageBubble';
import { formatMessageDate } from '../utils/messageUtils';

/**
 * MessageList component - Handles rendering of grouped messages with date headers
 * @param {Object} props - Component props
 */
const MessageListInner = ({
  // Data
  messages,
  leftParticipants = [],
  newParticipants = [],
  handleVisibleMessages,
  
  // Pagination
  paginationState,
  loadMoreMessages,
  
  // State
  clickedMessages,
  messageRefs,
  hoverState,
  messageState,
  uiState,
  searchState,
  
  // Chat data
  chat,
  recipient,
  
  // Media
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
  handleRetryLoadMessage,
  
  // Utilities
  formatTime,
  MentionText,
  isMobileOrTablet,
  isParticipant,
  
  // State updaters
  updateMessageState,
  
  visibleMessageList,
  // Refs
  bottomRef,
}) => {
  // Group messages by date
  const groupedMessages = useMemo(() => {
    return visibleMessageList.reduce((acc, message) => {
      const created = message.createdAt || message.created_at;
      const formattedDate = formatMessageDate(created);
      if (!acc[formattedDate]) {
        acc[formattedDate] = [];
      }
      acc[formattedDate].push({ ...message, type: 'message' });
      return acc;
    }, {});
  }, [visibleMessageList]);

  // Group leave events by date
  const groupedLeaves = useMemo(() => {
    return (leftParticipants || []).reduce((acc, leave) => {
      const formattedDate = formatMessageDate(leave.leftAt);
      if (!acc[formattedDate]) {
        acc[formattedDate] = [];
      }
      acc[formattedDate].push({
        username: leave.username,
        leftAt: leave.leftAt,
        type: 'left',
      });
      return acc;
    }, {});
  }, [leftParticipants]);

  // Group join events by date
  const groupedJoins = useMemo(() => {
    return (newParticipants || []).reduce((acc, join) => {
      const formattedDate = formatMessageDate(join.joinedAt);
      if (!acc[formattedDate]) {
        acc[formattedDate] = [];
      }
      acc[formattedDate].push({
        username: join.username,
        joinedAt: join.joinedAt,
        type: 'join',
      });
      return acc;
    }, {});
  }, [newParticipants]);

  // Combine and sort all groups by date
  const sortedCombinedGroups = useMemo(() => {
    const combinedGroups = { ...groupedMessages };

    // Add leave events
    Object.entries(groupedLeaves || {}).forEach(([date, leaves]) => {
      if (!combinedGroups[date]) {
        combinedGroups[date] = [];
      }
      combinedGroups[date].push(
        ...leaves.map((leave) => ({ ...leave, type: 'left' }))
      );
    });

    // Add join events
    Object.entries(groupedJoins || {}).forEach(([date, joins]) => {
      if (!combinedGroups[date]) {
        combinedGroups[date] = [];
      }
      combinedGroups[date].push(...joins);
    });

    // Sort dates
    const sortedDates = Object.keys(combinedGroups).sort(
      (b, a) => new Date(b) - new Date(a)
    );

    return sortedDates.reduce((acc, date) => {
      acc[date] = combinedGroups[date];
      return acc;
    }, {});
  }, [groupedMessages, groupedLeaves, groupedJoins]);

  return (
    <Box
      sx={{
        flexGrow: 1,
        paddingLeft: '24px',
        paddingRight: '24px',
        paddingBottom: '140px',
        width: '100%',
      }}
    >
      {/* Load More Button */}
      {messages.length > 0 && paginationState.hasMore && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '10px',
          }}
        >
          <Button
            onClick={loadMoreMessages}
            disabled={paginationState.loadingMessages}
            sx={{
              marginBottom: '10px',
              color: '#00000',
              '&:hover': { background: 'transparent' },
            }}
          >
            {paginationState.loadingMessages ? 'Loading...' : 'Load More'}
          </Button>
        </Box>
      )}

      {/* Grouped Messages */}
      {Object.entries(sortedCombinedGroups).map(([dateLabel, items]) => (
        <React.Fragment key={dateLabel}>
          {/* Date Header */}
          <Typography
            sx={{
              display: 'flex',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: '400',
              color: '#3C3C4399',
            }}
          >
            {dateLabel}
          </Typography>

          {/* Messages for this date */}
          {items.map((item, index) => (
            <MessageBubble
              key={item.id}
              item={item}
              index={index}
              clickedMessages={clickedMessages}
              messageRefs={messageRefs}
              visibleMessageList={visibleMessageList}
              hoveredMessageId={hoverState.messageId}
              handleMenuClick={handleMenuClick}
              chat={chat}
              handleMouseEnter={handleMouseEnter}
              handleMouseLeave={handleMouseLeave}
              handleToggleSendText={handleToggleSendText}
              isMobileOrTable={isMobileOrTablet}
              highlightedMessageId={messageState.highlightedId}
              openFullscreen={openFullscreen}
              MentionText={MentionText}
              handleOpenForwardMessageDrawer={handleOpenForwardMessageDrawer}
              handleCopyText={handleCopyText}
              handleReply={handleReply}
              handleMenuClose={handleMenuClose}
              formatTime={formatTime}
              reactionIcons={reactionIcons}
              fullscreenImage={fullscreenImage}
              closeFullscreen={closeFullscreen}
              handleEdit={handleEdit}
              recipient={recipient}
              downloadedMessages={downloadedMessages}
              handleFileDownloadWrapper={handleFileDownloadWrapper}
              searchTerm={searchState.term}
              anchorER={hoverState.anchorER}
              handleCloseForwardMessageDrawer={handleCloseForwardMessageDrawer}
              handleCloseReactionDrawer={handleCloseReactionDrawer}
              handleCloseReactionPicker={handleCloseReactionPicker}
              userReaction={userReaction}
              handleRemoveReaction={handleRemoveReaction}
              handleReactionSelect={handleReactionSelect}
              anchorElS1={hoverState.anchorElS1}
              selectedMessage={messageState.selected}
              updateMessageState={updateMessageState}
              forwardMessageDrawer={uiState.forwardMessageDrawer}
              selectedMessageId={messageState.selectedId}
              reactionDrawer={uiState.reactionDrawer}
              deleteMessageOpen={uiState.deleteMessageOpen}
              isParticipant={isParticipant}
              handleOpenReactionPicker={handleOpenReactionPicker}
              handleOpenReactionDrawer={handleOpenReactionDrawer}
              handlePinMessage={handlePinMessage}
              handleUnPinMessage={handleUnPinMessage}
              handleDeleteMessageForSelf={handleDeleteMessageForSelf}
              handleDeleteMessageOpen={handleDeleteMessageOpen}
              handleDeleteMessageClose={handleDeleteMessageClose}
              handleDeleteMessage={handleDeleteMessage}
              sendEncryptedMessage={sendEncryptedMessage}
              sendEncryptedFileMessage={sendEncryptedFileMessage}
              handleRetryFileMessage={handleRetryFileMessage}
              handleRetryLoadMessage={handleRetryLoadMessage}
              handleVisibleMessages={handleVisibleMessages}
            />
          ))}
        </React.Fragment>
      ))}

      {/* Bottom scroll anchor */}
      <Box ref={bottomRef} />
    </Box>
  );
};

const MessageList = React.memo(MessageListInner);
export default MessageList;
