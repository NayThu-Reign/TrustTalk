import { useMemo } from 'react';

/**
 * Custom hook for memoized message state calculations
 * Prevents recalculating on every render
 */
const useMessageState = (message, authUser, messageState) => {
  // Check if message is deleted for current user (memoized)
  const isDeletedForUser = useMemo(() => {
    try {
      const deletedBy = JSON.parse(message?.deleted_by || '[]');
      return deletedBy.includes(authUser.user_code);
    } catch {
      return false;
    }
  }, [message?.deleted_by, authUser.user_code]);

  // Check if user has reacted (memoized)
  const userReaction = useMemo(() => {
    if (!message?.reactions?.length) return null;
    const reaction = message?.reactions.find(
      r => r.user_id === authUser.user_code
    );
    return reaction?.reaction_type || null;
  }, [message?.reactions, authUser.user_code]);

  // Calculate reaction counts (memoized)
  const reactionCounts = useMemo(() => {
    if (!message?.reactions?.length) return {};
    
    return message?.reactions.reduce((acc, r) => {
      acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1;
      return acc;
    }, {});
  }, [message?.reactions]);

  // Get top reactions (memoized)
  const topReactions = useMemo(() => {
    const sorted = Object.entries(reactionCounts)
      .sort((a, b) => b[1] - a[1]);
    
    const topTwo = sorted.slice(0, 2);
    const others = sorted.slice(2);
    const othersCount = others.reduce((sum, [, count]) => sum + count, 0);
    
    return { topTwo, othersCount };
  }, [reactionCounts]);

  // Calculate viewed by count (memoized)
  const viewedByCount = useMemo(() => {
    if (!message?.viewed_by) return 0;
    
    if (Array.isArray(message?.viewed_by)) {
      return message?.viewed_by.length;
    }
    
    if (typeof message?.viewed_by === 'string') {
      try {
        return JSON.parse(message?.viewed_by).length;
      } catch {
        return 0;
      }
    }
    
    return 0;
  }, [message?.viewed_by]);

  // Check if message is from current user (memoized)
  const isOwnMessage = useMemo(() => {
    return message?.sender_id === authUser.user_code;
  }, [message?.sender_id, authUser.user_code]);

  // Check if message is hovered (memoized)
  const isHovered = useMemo(() => {
    return messageState?.hoveredMessageId === message?.id;
  }, [messageState?.hoveredMessageId, message?.id]);

  // Check if message is highlighted (memoized)
  const isHighlighted = useMemo(() => {
    return messageState?.highlightedMessageId === message?.id;
  }, [messageState?.highlightedMessageId, message?.id]);

  // Check if message is clicked (memoized)
  const isClicked = useMemo(() => {
    return messageState?.clickedMessages?.includes(message?.id);
  }, [messageState?.clickedMessages, message?.id]);

  // Check if this is the latest message (memoized)
  const isLatestMessage = useMemo(() => {
    return messageState?.latestMessageId === message?.id;
  }, [messageState?.latestMessageId, message?.id]);

  // Determine if action buttons should show (memoized)
  const shouldShowActions = useMemo(() => {
    return (isHovered || isClicked) && !message?.failed;
  }, [isHovered, isClicked, message?.failed]);

  // Check if message has failed (memoized)
  const hasFailed = useMemo(() => {
    return Boolean(message?.failed || message?.status === 'failed');
  }, [message?.failed, message?.status]);

  // Get message status (memoized)
  const messageStatus = useMemo(() => {
    if (hasFailed) return 'failed';
    if (message?.status === 'pending') return 'pending';
    if (message?.status === 'sent') return 'sent';
    if (viewedByCount > 0) return 'read';
    return 'delivered';
  }, [hasFailed, message?.status, viewedByCount]);

  return {
    isDeletedForUser,
    userReaction,
    reactionCounts,
    topReactions,
    viewedByCount,
    isOwnMessage,
    isHovered,
    isHighlighted,
    isClicked,
    isLatestMessage,
    shouldShowActions,
    hasFailed,
    messageStatus,
  };
};

export default useMessageState;
