import React, { memo, useCallback } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import ReplyIcon from '@mui/icons-material/Reply';
import EmojiEmotionsOutlinedIcon from '@mui/icons-material/EmojiEmotionsOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

const MessageActions = memo(({
  message,
  isOwnMessage,
  onReply,
  onReact,
  onMenu,
}) => {
  const handleReply = useCallback((e) => {
    e.stopPropagation();
    onReply?.(message);
  }, [onReply, message]);

  const handleReact = useCallback((e) => {
    e.stopPropagation();
    onReact?.(e, message);
  }, [onReact, message]);

  const handleMenu = useCallback((e) => {
    e.stopPropagation();
    onMenu?.(e, message);
  }, [onMenu, message]);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        ml: isOwnMessage ? 0 : 1,
        mr: isOwnMessage ? 1 : 0,
        opacity: 0,
        animation: 'fadeIn 0.2s ease forwards',
        '@keyframes fadeIn': {
          from: { opacity: 0, transform: 'translateY(-4px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      {/* Reply Button */}
      <Tooltip title="Reply" placement="top">
        <IconButton
          size="small"
          onClick={handleReply}
          sx={{
            width: 32,
            height: 32,
            bgcolor: 'background.paper',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            '&:hover': {
              bgcolor: '#F5F5F5',
            },
          }}
        >
          <ReplyIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>

      {/* React Button */}
      <Tooltip title="React" placement="top">
        <IconButton
          size="small"
          onClick={handleReact}
          sx={{
            width: 32,
            height: 32,
            bgcolor: 'background.paper',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            '&:hover': {
              bgcolor: '#F5F5F5',
            },
          }}
        >
          <EmojiEmotionsOutlinedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>

      {/* More Options */}
      <Tooltip title="More" placement="top">
        <IconButton
          size="small"
          onClick={handleMenu}
          sx={{
            width: 32,
            height: 32,
            bgcolor: 'background.paper',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            '&:hover': {
              bgcolor: '#F5F5F5',
            },
          }}
        >
          <MoreHorizIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}, (prevProps, nextProps) => {
  // Don't re-render if message ID hasn't changed
  // (actions are always the same for a given message)
  return prevProps.message.id === nextProps.message.id;
});

MessageActions.displayName = 'MessageActions';

export default MessageActions;
