import { format, isToday, isYesterday } from 'date-fns';

/**
 * Format message date for display
 */
export const formatMessageDate = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);

  if (isToday(date)) {
    return 'Today';
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else {
    return format(date, 'MMM d');
  }
};

/**
 * Format time for message timestamp
 */
export const formatTime = (dateString) => {
  const date = new Date(dateString);
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  hours = String(hours).padStart(2, '0');

  return `${hours}:${minutes} ${ampm}`;
};

/**
 * Format date for file/media display
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${day}/${month}/${year}`;
};

/**
 * Group messages by date
 */
export const groupMessagesByDate = (messages) => {
  return messages.reduce((acc, message) => {
    const formattedDate = formatMessageDate(message.createdAt);

    if (!acc[formattedDate]) {
      acc[formattedDate] = [];
    }

    acc[formattedDate].push({ ...message, type: 'message' });
    return acc;
  }, {});
};

/**
 * Check if message is from current user
 */
export const isMessageFromUser = (message, userId) => {
  return message.sender_id === userId;
};

/**
 * Get message type
 */
export const getMessageType = (message) => {
  if (message.media_type) {
    return message.media_type;
  }
  if (message.text_content) {
    return 'text';
  }
  return 'unknown';
};

/**
 * Check if timestamp should be shown
 */
export const shouldShowTimestamp = (currentMessage, nextMessage, isLastMessage) => {
  if (isLastMessage) return true;
  if (!nextMessage) return true;
  
  // Show timestamp if different sender
  if (currentMessage.sender_id !== nextMessage.sender_id) {
    return true;
  }
  
  // Show timestamp if more than 5 minutes apart
  const timeDiff = new Date(nextMessage.createdAt) - new Date(currentMessage.createdAt);
  return timeDiff > 300000; // 5 minutes
};

/**
 * Extract filename from media URL
 */
export const extractFileName = (mediaUrl) => {
  if (!mediaUrl) return '';
  return mediaUrl.split('/').pop().replace('.enc', '');
};

/**
 * Check if message is deleted
 */
export const isMessageDeleted = (message, userId) => {
  if (!message.deleted_by) return false;
  try {
    const deletedBy = JSON.parse(message.deleted_by);
    return Array.isArray(deletedBy) && deletedBy.includes(userId);
  } catch {
    return false;
  }
};

