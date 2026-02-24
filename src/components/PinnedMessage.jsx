import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PushPinIcon from '@mui/icons-material/PushPin';
import ImageIcon from '@mui/icons-material/Image';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import GifBoxIcon from '@mui/icons-material/GifBox';


const PinnedMessage = ({
  pinnedMessage,
  chat,
  recipient,
  api,
  searchOpen = false,
  onScrollToMessage,
  onUnpin,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!pinnedMessage) return null;

  const handleDialogOpen = (e) => {
    e.stopPropagation();
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleUnpin = () => {
    onUnpin(pinnedMessage.id);
    setDialogOpen(false);
  };

  const handleContainerClick = () => {
    onScrollToMessage(pinnedMessage.id);
  };

  const renderMediaPreview = () => {
    switch (pinnedMessage.media_type) {
      case 'image':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                position: 'relative',
                width: 56,
                height: 56,
                borderRadius: 2,
                overflow: 'hidden',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <img
                src={pinnedMessage.decryptedUrl}
                alt="Pinned"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <ImageIcon sx={{ fontSize: 16, color: '#8E8E93' }} />
                <Typography variant="body2" fontWeight={500}>
                  Photo
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Pinned message
              </Typography>
            </Box>
          </Box>
        );

      case 'file':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                bgcolor: '#F5F5F5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AttachFileIcon sx={{ fontSize: 28, color: '#8E8E93' }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <AttachFileIcon sx={{ fontSize: 16, color: '#8E8E93' }} />
                <Typography variant="body2" fontWeight={500}>
                  File
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Pinned message
              </Typography>
            </Box>
          </Box>
        );

      case 'gif':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                position: 'relative',
                width: 56,
                height: 56,
                borderRadius: 2,
                overflow: 'hidden',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <img
                src={pinnedMessage.media_url}
                alt="Pinned GIF"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <GifBoxIcon sx={{ fontSize: 16, color: '#8E8E93' }} />
                <Typography variant="body2" fontWeight={500}>
                  GIF
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Pinned message
              </Typography>
            </Box>
          </Box>
        );

      default:
        return (
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                mb: 0.5,
                fontWeight: 400,
                lineHeight: 1.5,
              }}
            >
              {pinnedMessage.text_content}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PushPinIcon sx={{ fontSize: 14, color: '#8E8E93' }} />
              <Typography variant="caption" color="text.secondary">
                Pinned message
              </Typography>
            </Box>
          </Box>
        );
    }
  };

  

  return (
    <>
      <Box
        onClick={handleContainerClick}
        sx={{
          minWidth: 320,
          minHeight: 80,
          borderBottom: '1px solid',
          borderColor: 'divider',
          position: 'sticky',
          top: searchOpen ? 70 : 0,
          zIndex: 1000,
          bgcolor: 'background.paper',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          '&:hover': {
            bgcolor: '#FAFAFA',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            px: { xs: 2, sm: 3 },
            py: 1.5,
          }}
        >
          {/* Left accent bar */}
          <Box
            sx={{
              width: 3,
              height: 56,
              bgcolor: '#121660',
              borderRadius: 1.5,
              flexShrink: 0,
            }}
          />

          {/* Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {renderMediaPreview()}
          </Box>

          {/* Close button */}
          <Tooltip title="Unpin message" placement="left">
            <IconButton
              onClick={handleDialogOpen}
              size="small"
              sx={{
                flexShrink: 0,
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Unpin confirmation dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 320,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>Remove pin?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {chat?.is_group_chat
              ? 'This will remove the pin for you and other participants.'
              : `This will unpin the message in your conversation${recipient ? ` with ${recipient.username}` : ''}.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDialogClose} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            onClick={handleUnpin}
            variant="contained"
            sx={{
              bgcolor: '#121660',
              '&:hover': {
                bgcolor: '#0D1048',
              },
            }}
          >
            Remove Pin
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PinnedMessage;
