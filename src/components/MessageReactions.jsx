import React, { memo, useMemo } from 'react';
import { Box, Typography } from '@mui/material';

const reactionIcons = {
  like: '👍',
  love: '❤️',
  haha: '😂',
  wow: '😮',
  sad: '😢',
  angry: '😡',
};

const MessageReactions = memo(({
  reactions,
  reactionCounts,
  userReaction,
  isOwnMessage,
  onReactionClick,
  messageId,
}) => {
  // Sort reactions by count and get top 2
  const displayReactions = useMemo(() => {
    const sorted = Object.entries(reactionCounts)
      .sort((a, b) => b[1] - a[1]);
    
    const topTwo = sorted.slice(0, 2);
    const others = sorted.slice(2);
    const othersCount = others.reduce((sum, [, count]) => sum + count, 0);
    
    return { topTwo, othersCount, totalCount: reactions.length };
  }, [reactionCounts, reactions.length]);

  const handleClick = (e) => {
    e.stopPropagation();
    onReactionClick?.(messageId);
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        mt: 0.5,
        px: 1,
        py: 0.5,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        '&:hover': {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          transform: 'translateY(-1px)',
        },
      }}
    >
      {/* Display top 2 reaction types */}
      <Box sx={{ display: 'flex', gap: 0.25 }}>
        {displayReactions.topTwo.map(([type, count]) => (
          <Box
            key={type}
            sx={{
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {reactionIcons[type] || type}
          </Box>
        ))}
      </Box>

      {/* Total count */}
      <Typography
        variant="caption"
        sx={{
          fontSize: 12,
          fontWeight: 500,
          color: 'text.secondary',
          ml: 0.25,
        }}
      >
        {displayReactions.totalCount}
      </Typography>

      {/* Others indicator */}
      {displayReactions.othersCount > 0 && (
        <Typography
          variant="caption"
          sx={{
            fontSize: 11,
            color: 'text.secondary',
          }}
        >
          +{displayReactions.othersCount}
        </Typography>
      )}
    </Box>
  );
}, (prevProps, nextProps) => {
  // Only re-render if reactions actually changed
  if (prevProps.reactions?.length !== nextProps.reactions?.length) return false;
  if (prevProps.userReaction !== nextProps.userReaction) return false;
  
  // Deep compare reaction counts
  const prevCounts = JSON.stringify(prevProps.reactionCounts);
  const nextCounts = JSON.stringify(nextProps.reactionCounts);
  if (prevCounts !== nextCounts) return false;
  
  return true;
});

MessageReactions.displayName = 'MessageReactions';

export default MessageReactions;
