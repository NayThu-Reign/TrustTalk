import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for managing scroll behavior in conversation
 */
export const useScrollManagement = (messages, currentChatId, fullscreenImage) => {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessageReceived, setNewMessageReceived] = useState(false);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [visibleMessages, setVisibleMessages] = useState(7);
  
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const suppressNextScrollRef = useRef(false);
  const savedScrollTop = useRef(0);
  const prevScrollHeight = useRef(0);

  // Check if user is at bottom of scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;

      const isUserAtBottom = distanceFromBottom < 50; // 50px threshold
      setIsAtBottom(isUserAtBottom);
      setShowScrollDown(distanceFromBottom > 200);

      if (isUserAtBottom) {
        setNewMessageReceived(false);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll to bottom on new chat
  useEffect(() => {
    if (suppressNextScrollRef.current || fullscreenImage) return;
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [currentChatId, fullscreenImage]);

  // Auto-scroll to bottom when shouldScrollToBottom is true
  useEffect(() => {
    if (suppressNextScrollRef.current || fullscreenImage) return;
    if (shouldScrollToBottom && containerRef.current) {
      requestAnimationFrame(() => {
        containerRef.current.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: 'smooth',
        });
        setShouldScrollToBottom(false);
      });
    }
  }, [shouldScrollToBottom, fullscreenImage]);

  // Adjust scroll position when loading more messages
  useEffect(() => {
    if (suppressNextScrollRef.current || fullscreenImage) return;
    if (containerRef.current) {
      containerRef.current.scrollTop =
        containerRef.current.scrollHeight - prevScrollHeight.current;
    }
  }, [visibleMessages, fullscreenImage]);

  // Detect new messages when not at bottom
  useEffect(() => {
    if (!messages.length) return;
    
    const latestMessage = messages[messages.length - 1];
    const isFromOtherUser = latestMessage.sender_id !== latestMessage.authUser?.user_code;
    const hasNotSeen = !latestMessage.viewed_by?.includes(latestMessage.authUser?.user_code);

    if (!isAtBottom && isFromOtherUser && hasNotSeen) {
      setNewMessageReceived(true);
    } else {
      setNewMessageReceived(false);
    }
  }, [messages, isAtBottom]);

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
      setShouldScrollToBottom(false);
      setNewMessageReceived(false);
    }
  }, []);

  const scrollToMessage = useCallback((messageId, messageRefs) => {
    const messageElement = messageRefs.current[messageId]?.current;
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const loadMoreMessages = useCallback(() => {
    if (containerRef.current) {
      const isMobile = window.innerWidth <= 950;
      const scrollPosition = containerRef.current.scrollTop;

      setVisibleMessages((prevVisible) => Math.min(prevVisible + 7, messages.length));

      if (!isMobile) {
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = scrollPosition;
          }
        }, 0);
      }
    }
  }, [messages.length]);

  const saveScrollPosition = useCallback(() => {
    if (containerRef.current) {
      savedScrollTop.current = containerRef.current.scrollTop;
    }
  }, []);

  const restoreScrollPosition = useCallback(() => {
    requestAnimationFrame(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = savedScrollTop.current;
        suppressNextScrollRef.current = false;
      }
    });
  }, []);

  return {
    // Refs
    containerRef,
    bottomRef,
    
    // State
    isAtBottom,
    newMessageReceived,
    shouldScrollToBottom,
    showScrollDown,
    visibleMessages,
    
    // Actions
    setShouldScrollToBottom,
    setVisibleMessages,
    scrollToBottom,
    scrollToMessage,
    loadMoreMessages,
    saveScrollPosition,
    restoreScrollPosition,
    suppressNextScrollRef,
  };
};

