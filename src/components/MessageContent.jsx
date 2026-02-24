import React, { memo, useMemo } from 'react';
import { Box, Typography, Avatar, Tooltip, IconButton } from '@mui/material';
import {
  Error as ErrorIcon,
  Replay as ReplayIcon,
  FileDownload as FileDownloadIcon,
  InsertDriveFile as InsertDriveFileIcon,
} from '@mui/icons-material';
import PollDemo from './PollDemo';
import { ChatImage, ChatVideo, ChatAudio } from './ChatMediaComponents';

const MessageContent = memo(({
  message,
  isOwnMessage,
  handlers,
  uiConfig,
  mediaState,
  api,
}) => {
  // Memoize replied message preview
  const repliedMessage = useMemo(() => {
    if (!message.reply_to || !message.originalMessage) return null;
    
    return {
      sender: message.originalMessage.sender?.display_name || 
              message.originalMessage.sender?.username || 'Unknown',
      text: message.originalMessage.text_content,
      mediaType: message.originalMessage.media_type,
    };
  }, [message.reply_to, message.originalMessage]);

  // Memoize edited status
  const isEdited = useMemo(() => {
    return Boolean(message.edited_at);
  }, [message.edited_at]);

  return (
    <Box
      sx={{
        position: 'relative',
        maxWidth: '100%',
      }}
    >
      {/* Replied Message Preview */}
      {repliedMessage && (
        <Box
          onClick={() => handlers?.onReply?.(message.reply_to)}
          sx={{
            mb: 0.5,
            px: 1.5,
            py: 0.75,
            borderLeft: '3px solid',
            borderColor: isOwnMessage ? 'rgba(255,255,255,0.5)' : '#121660',
            bgcolor: isOwnMessage ? 'rgba(255,255,255,0.1)' : 'rgba(18,22,96,0.05)',
            borderRadius: 1,
            cursor: 'pointer',
            '&:hover': {
              bgcolor: isOwnMessage ? 'rgba(255,255,255,0.15)' : 'rgba(18,22,96,0.08)',
            },
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontSize: 11,
              fontWeight: 600,
              color: isOwnMessage ? 'rgba(255,255,255,0.8)' : '#121660',
              mb: 0.25,
              display: 'block',
            }}
          >
            {repliedMessage.sender}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontSize: 13,
              color: isOwnMessage ? 'rgba(255,255,255,0.7)' : 'text.secondary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {repliedMessage.mediaType 
              ? `📎 ${repliedMessage.mediaType}`
              : repliedMessage.text}
          </Typography>
        </Box>
      )}

      {/* Main Message Content */}
      <MessageBody
        message={message}
        isOwnMessage={isOwnMessage}
        handlers={handlers}
        uiConfig={uiConfig}
        mediaState={mediaState}
        api={api}
      />

      {/* Edited Indicator */}
      {isEdited && (
        <Typography
          variant="caption"
          sx={{
            fontSize: 10,
            color: isOwnMessage ? 'rgba(255,255,255,0.6)' : 'text.disabled',
            fontStyle: 'italic',
            mt: 0.25,
            display: 'block',
          }}
        >
          (edited)
        </Typography>
      )}

      {/* Failed Message Indicator */}
      {message.failed && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mt: 0.5,
            color: 'error.main',
          }}
        >
          <ErrorIcon sx={{ fontSize: 16 }} />
          <Typography variant="caption" sx={{ fontSize: 11 }}>
            Failed to send
          </Typography>
          <Tooltip title="Retry">
            <IconButton
              size="small"
              onClick={() => handlers?.onRetryMessage?.(message)}
              sx={{
                width: 24,
                height: 24,
                color: 'error.main',
                '&:hover': {
                  bgcolor: 'rgba(211, 47, 47, 0.08)',
                },
              }}
            >
              <ReplayIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
}, (prevProps, nextProps) => {
  // Only re-render if message content actually changed
  if (prevProps.message.id !== nextProps.message.id) return false;
  if (prevProps.message.text_content !== nextProps.message.text_content) return false;
  if (prevProps.message.media_url !== nextProps.message.media_url) return false;
  if (prevProps.message.edited_at !== nextProps.message.edited_at) return false;
  if (prevProps.message.failed !== nextProps.message.failed) return false;
  if (prevProps.message.reply_to !== nextProps.message.reply_to) return false;
  
  // Search term changed (affects highlighting)
  if (prevProps.uiConfig?.searchTerm !== nextProps.uiConfig?.searchTerm) return false;
  
  return true;
});

// ==================== MESSAGE BODY ====================
const MessageBody = memo(({ message, isOwnMessage, handlers, uiConfig, mediaState, api }) => {
  // Poll message
  if (message.media_type === 'poll') {
    return (
      <Box>
        <PollDemo poll={message.Poll} messageId={message.id} />
      </Box>
    );
  }

  // Media messages
  if (message.media_url) {
    return (
      <MediaContent
        message={message}
        isOwnMessage={isOwnMessage}
        handlers={handlers}
        mediaState={mediaState}
        api={api}
      />
    );
  }

  // Text message with potential mentions
  if (message.text_content) {
    const MentionText = uiConfig?.MentionText;
    
    if (MentionText) {
      return (
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderRadius: 2,
            bgcolor: isOwnMessage ? '#121660' : '#F5F5F5',
            color: isOwnMessage ? 'white' : 'text.primary',
            wordBreak: 'break-word',
          }}
        >
          <MentionText
            text={message.text_content}
            searchTerm={uiConfig.searchTerm}
          />
        </Box>
      );
    }

    return (
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderRadius: 2,
          bgcolor: isOwnMessage ? '#121660' : '#F5F5F5',
          color: isOwnMessage ? 'white' : 'text.primary',
          wordBreak: 'break-word',
        }}
      >
        <Typography variant="body1">
          {message.text_content}
        </Typography>
      </Box>
    );
  }

  return null;
}, (prevProps, nextProps) => {
  // Re-render only if content changed
  if (prevProps.message.text_content !== nextProps.message.text_content) return false;
  if (prevProps.message.media_url !== nextProps.message.media_url) return false;
  if (prevProps.message.media_type !== nextProps.message.media_type) return false;
  if (prevProps.uiConfig?.searchTerm !== nextProps.uiConfig?.searchTerm) return false;
  return true;
});

// ==================== MEDIA CONTENT ====================
const MediaContent = memo(({ message, isOwnMessage, handlers, mediaState, api }) => {
  const mediaType = message.media_type;
  const mediaUrl = message.decryptedUrl || `${api}/${message.media_url}`;

  // Image or GIF
  if (mediaType === 'image' || mediaType === 'gif') {
    return (
      <Box
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          cursor: 'pointer',
          maxWidth: 400,
          '&:hover': {
            opacity: 0.95,
          },
        }}
        onClick={() => mediaState?.openFullscreen?.(mediaUrl)}
      >
        <ChatImage
          src={mediaUrl}
          alt="Message attachment"
          loading="lazy"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
          }}
        />
      </Box>
    );
  }

  // Video
  if (mediaType === 'video') {
    return (
      <Box
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          maxWidth: 400,
        }}
      >
        <ChatVideo
          src={mediaUrl}
          controls
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
          }}
        />
      </Box>
    );
  }

  // Audio
  if (mediaType === 'audio') {
    return (
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderRadius: 2,
          bgcolor: isOwnMessage ? '#121660' : '#F5F5F5',
        }}
      >
        <ChatAudio
          src={mediaUrl}
          controls
          style={{
            width: '100%',
            maxWidth: 300,
          }}
        />
      </Box>
    );
  }

  // File attachment
  if (mediaType === 'file') {
    return (
      <FileAttachment
        message={message}
        isOwnMessage={isOwnMessage}
        handlers={handlers}
        mediaState={mediaState}
      />
    );
  }

  // Sticker
  if (mediaType === 'sticker') {
    return (
      <Box
        sx={{
          maxWidth: 200,
        }}
      >
        <img
          src={mediaUrl}
          alt="Sticker"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
          }}
        />
      </Box>
    );
  }

  return null;
}, (prevProps, nextProps) => {
  if (prevProps.message.media_url !== nextProps.message.media_url) return false;
  if (prevProps.message.decryptedUrl !== nextProps.message.decryptedUrl) return false;
  return true;
});

// ==================== FILE ATTACHMENT ====================
const FileAttachment = memo(({ message, isOwnMessage, handlers, mediaState }) => {
  const isDownloaded = mediaState?.downloadedMessages?.includes(message.id);
  const fileName = message.file_name || 'Attachment';
  
  // Get file extension for icon
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'file';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.5,
        borderRadius: 2,
        bgcolor: isOwnMessage ? '#121660' : '#F5F5F5',
        color: isOwnMessage ? 'white' : 'text.primary',
        minWidth: 200,
        maxWidth: 400,
        cursor: isDownloaded ? 'default' : 'pointer',
        '&:hover': {
          bgcolor: isOwnMessage ? '#0D1048' : '#EEEEEE',
        },
      }}
      onClick={() => !isDownloaded && handlers?.onFileDownload?.(message)}
    >
      {/* File Icon */}
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 1,
          bgcolor: isOwnMessage ? 'rgba(255,255,255,0.1)' : 'rgba(18,22,96,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <InsertDriveFileIcon
          sx={{
            fontSize: 24,
            color: isOwnMessage ? 'rgba(255,255,255,0.8)' : '#121660',
          }}
        />
      </Box>

      {/* File Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: isOwnMessage ? 'white' : 'text.primary',
          }}
        >
          {fileName}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: isOwnMessage ? 'rgba(255,255,255,0.7)' : 'text.secondary',
            textTransform: 'uppercase',
          }}
        >
          {fileExtension}
        </Typography>
      </Box>

      {/* Download Icon */}
      {!isDownloaded && (
        <Tooltip title="Download">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handlers?.onFileDownload?.(message);
            }}
            sx={{
              color: isOwnMessage ? 'white' : '#121660',
              '&:hover': {
                bgcolor: isOwnMessage
                  ? 'rgba(255,255,255,0.1)'
                  : 'rgba(18,22,96,0.08)',
              },
            }}
          >
            <FileDownloadIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      )}

      {isDownloaded && (
        <Typography
          variant="caption"
          sx={{
            color: isOwnMessage ? 'rgba(255,255,255,0.7)' : 'text.secondary',
            fontSize: 11,
          }}
        >
          Downloaded
        </Typography>
      )}
    </Box>
  );
}, (prevProps, nextProps) => {
  if (prevProps.message.id !== nextProps.message.id) return false;
  if (prevProps.message.file_name !== nextProps.message.file_name) return false;
  
  // Check if download status changed for this specific message
  const wasDownloaded = prevProps.mediaState?.downloadedMessages?.includes(prevProps.message.id);
  const isDownloaded = nextProps.mediaState?.downloadedMessages?.includes(nextProps.message.id);
  if (wasDownloaded !== isDownloaded) return false;
  
  return true;
});

MessageContent.displayName = 'MessageContent';
MessageBody.displayName = 'MessageBody';
MediaContent.displayName = 'MediaContent';
FileAttachment.displayName = 'FileAttachment';

export default MessageContent;
