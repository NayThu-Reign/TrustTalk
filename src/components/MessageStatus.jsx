import React, { memo, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CheckIcon from '@mui/icons-material/Check';
import ErrorIcon from '@mui/icons-material/Error';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const MessageStatus = memo(({
  message,
  isOwnMessage,
  viewedByCount,
  isGroupChat,
  formatTime,
  onViewedByClick,
}) => {
  const handleViewedByClick = useCallback((e) => {
    e.stopPropagation();
    if (viewedByCount > 0) {
      onViewedByClick?.(message.id);
    }
  }, [onViewedByClick, message.id, viewedByCount]);

  // Determine status icon
  const StatusIcon = () => {
    if (message.failed) {
      return <ErrorIcon sx={{ fontSize: 14, color: 'error.main' }} />;
    }
    if (message.status === 'pending') {
      return <AccessTimeIcon sx={{ fontSize: 14, color: 'text.disabled' }} />;
    }
    if (viewedByCount > 0) {
      return <DoneAllIcon sx={{ fontSize: 14, color: '#4CAF50' }} />;
    }
    if (message.status === 'delivered') {
      return <DoneAllIcon sx={{ fontSize: 14, color: 'text.secondary' }} />;
    }
    if (message.status === 'sent') {
      return <CheckIcon sx={{ fontSize: 14, color: 'text.secondary' }} />;
    }
    return null;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        mt: 0.25,
        alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
      }}
    >
      {/* Edited indicator */}
      {message.edited_at && (
        <Typography
          variant="caption"
          sx={{
            fontSize: 11,
            color: 'text.disabled',
            fontStyle: 'italic',
          }}
        >
          Edited
        </Typography>
      )}

      {/* Time */}
      <Typography
        variant="caption"
        sx={{
          fontSize: 11,
          color: 'text.secondary',
        }}
      >
        {formatTime?.(message.created_at) || message.created_at}
      </Typography>

      {/* Status icon (only for own messages) */}
      {isOwnMessage && <StatusIcon />}

      {/* Viewed by count (for group chats) */}
      {isOwnMessage && isGroupChat && viewedByCount > 0 && (
        <Typography
          variant="caption"
          onClick={handleViewedByClick}
          sx={{
            fontSize: 11,
            color: '#4CAF50',
            cursor: 'pointer',
            fontWeight: 500,
            '&:hover': {
              textDecoration: 'underline',
            },
          }}
        >
          Seen by {viewedByCount}
        </Typography>
      )}

      {/* Failed message indicator */}
      {message.failed && (
        <Typography
          variant="caption"
          sx={{
            fontSize: 11,
            color: 'error.main',
            fontWeight: 500,
          }}
        >
          Failed to send
        </Typography>
      )}
    </Box>
  );
}, (prevProps, nextProps) => {
  // Re-render only if these specific props changed
  if (prevProps.message.created_at !== nextProps.message.created_at) return false;
  if (prevProps.message.edited_at !== nextProps.message.edited_at) return false;
  if (prevProps.message.status !== nextProps.message.status) return false;
  if (prevProps.message.failed !== nextProps.message.failed) return false;
  if (prevProps.viewedByCount !== nextProps.viewedByCount) return false;
  
  return true;
});

MessageStatus.displayName = 'MessageStatus';

export default MessageStatus;
