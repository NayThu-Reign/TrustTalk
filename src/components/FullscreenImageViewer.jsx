import React from 'react';
import { Box, IconButton, Fade } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';

const FullscreenImageViewer = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  const handleBackdropClick = (e) => {
    // Only close if clicking the backdrop, not the image
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <Fade in={!!imageUrl}>
      <Box
        onClick={handleBackdropClick}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1500,
          cursor: 'zoom-out',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Close Button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            color: 'white',
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.2)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* Zoom indicator */}
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: 'white',
            bgcolor: 'rgba(0, 0, 0, 0.6)',
            px: 2,
            py: 1,
            borderRadius: 2,
          }}
        >
          <ZoomOutIcon fontSize="small" />
          Click anywhere to close
        </Box>

        {/* Image */}
        <Box
          component="img"
          src={imageUrl}
          alt="Fullscreen view"
          sx={{
            maxWidth: '90%',
            maxHeight: '90%',
            objectFit: 'contain',
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            cursor: 'default',
          }}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
        />
      </Box>
    </Fade>
  );
};

export default FullscreenImageViewer;
