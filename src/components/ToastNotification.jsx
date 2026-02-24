// src/components/ToastNotification.jsx
import { useState, useEffect } from 'react';
import { Box, Avatar, Typography, IconButton, Slide } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { encryptId } from '../lib/crypto';

export const ToastNotification = ({ 
  notification, 
  onClose, 
  onClick 
}) => {
  if (!notification) return null;

  const { sender, message, notiChat, isMention } = notification;
  console.log("senderNot", message);
  const api = import.meta.env.VITE_API_URL;

  return (
    <Slide direction="left" in={true} mountOnEnter unmountOnExit>
      <Box
        onClick={onClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 1.5,
          mb: 1,
          backgroundColor: isMention ? '#fff3cd' : '#fff',
          borderLeft: isMention ? '4px solid #f59e0b' : '4px solid #3b82f6',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          cursor: 'pointer',
          minWidth: '320px',
          maxWidth: '400px',
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'translateX(-5px)',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
          },
        }}
      >
        <Avatar
          src={sender.user_photo ? `${api}/${sender.user_photo}` : "userphoto"}
          alt={sender.username}
          sx={{ width: 40, height: 40 }}
        />
        
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              fontWeight: 600,
              color: isMention ? '#f59e0b' : '#1976d2',
            }}
          >
            {isMention ? '🔔 ' : '💬 '}
            {sender.username}
            {notiChat.name && ` • ${notiChat.name}`}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#666',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {isMention ? 'Mentioned you' : (message.text_content || '📎 Media')}
          </Typography>
        </Box>

        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          sx={{ color: '#999' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </Slide>
  );
};

export const ToastContainer = ({ notifications, onClose, onNotificationClick }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 40px)',
        overflowY: 'auto',
        pointerEvents: 'none',
        '& > *': {
          pointerEvents: 'auto',
        },
      }}
    >
      {notifications.map((notification) => (
        <ToastNotification
          key={notification.id}
          notification={notification}
          onClose={() => onClose(notification.id)}
          onClick={() => onNotificationClick(notification)}
        />
      ))}
    </Box>
  );
};
