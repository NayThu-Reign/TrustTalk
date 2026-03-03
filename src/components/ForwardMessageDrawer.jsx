import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  IconButton,
  Typography,
  TextField,
  Button,
  Fade,
  Backdrop,
  InputAdornment,
  Chip,
  useMediaQuery,
  CircularProgress,
  Checkbox,
  Avatar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import ForumIcon from '@mui/icons-material/Forum';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { encryptInWorker } from '../crypto/cryptoClient';
import { encryptFileBeforeUpload } from '../crypto/encryptBeforeUpload';
import sodium from 'libsodium-wrappers-sumo';

const EmptyState = ({ message, isSearch = false }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: 200,
        gap: 2,
      }}
    >
      {isSearch ? (
        <SearchOffIcon
          sx={{
            fontSize: 64,
            color: '#BDBDBD',
          }}
        />
      ) : (
        <ForumIcon
          sx={{
            fontSize: 64,
            color: '#BDBDBD',
          }}
        />
      )}
      <Typography
        variant="body1"
        sx={{
          color: 'text.secondary',
          textAlign: 'center',
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};

const ChatListItem = ({ chat, authUser, api, isSelected, onSelect }) => {
  // Get the other participant for direct chats
  const participant = chat.is_group_chat
    ? null
    : chat.participants?.find((p) => p.user_code !== authUser.user_code);

  // Determine avatar source
  const avatarSrc = chat.is_group_chat
    ? chat.photo
      ? `${api}/${chat.photo}`
      : null
    : participant?.user_photo
      ? `${api}/${participant.user_photo}`
      : null;

  // Get first letter for fallback
  const fallbackLetter = chat.name?.[0]?.toUpperCase() || '?';

  return (
    <Box
      onClick={onSelect}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 1.5,
        borderRadius: 2,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        bgcolor: isSelected ? '#E8F5E9' : '#F7FBFD',
        border: '1px solid',
        borderColor: isSelected ? '#4CAF50' : 'transparent',
        '&:hover': {
          bgcolor: isSelected ? '#E8F5E9' : '#EEF6FB',
          transform: 'translateX(4px)',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          flex: 1,
          minWidth: 0,
        }}
      >
        <Avatar
          src={avatarSrc}
          sx={{
            width: 42,
            height: 42,
            bgcolor: '#121660',
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          {!avatarSrc && fallbackLetter}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 500,
              color: 'text.primary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {chat.name}
          </Typography>
          {chat.is_group_chat && (
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                display: 'block',
              }}
            >
              {chat.participants?.length || 0} members
            </Typography>
          )}
        </Box>
      </Box>

      <Checkbox
        checked={isSelected}
        icon={<RadioButtonUncheckedIcon />}
        checkedIcon={<CheckCircleIcon />}
        onClick={(e) => e.stopPropagation()}
        sx={{
          color: '#BDBDBD',
          '&.Mui-checked': {
            color: '#4CAF50',
          },
        }}
      />
    </Box>
  );
};

const ForwardMessageDrawer = ({
  openForwardMessageDrawer,
  closeForwardMessageDrawer,
  selectedMessageId,
  handleMenuClose,
  forwardedMessage,
}) => {
  const { authUser } = useAuth();
  const api = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('token');
  const isMobileOrTablet = useMediaQuery('(max-width: 950px)');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChats, setSelectedChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [forwarding, setForwarding] = useState(false);

  // Fetch chats
  const fetchChats = async () => {
    try {
      const result = await fetch(`${api}/api/chatsOne`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await result.json();
      return data.processedChats;
    } catch (error) {
      console.error('Error fetching chats:', error);
      throw error;
    }
  };

  const { data: chats, isLoading } = useQuery({
    queryKey: ['chatsOne', authUser?.user_code],
    queryFn: fetchChats,
    enabled: !!authUser && openForwardMessageDrawer,
    staleTime: 1000 * 60 * 5,
  });

  // Initialize and filter chats
  useEffect(() => {
    if (!chats) return;
    setFilteredChats(chats);
  }, [chats]);

  // Search filter
  useEffect(() => {
    if (!searchTerm) {
      setFilteredChats(chats || []);
      return;
    }

    const filtered = chats?.filter((chat) =>
      chat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredChats(filtered || []);
  }, [searchTerm, chats]);

  // Reset state when modal closes
  useEffect(() => {
    if (!openForwardMessageDrawer) {
      setSearchTerm('');
      setSelectedChats([]);
    }
  }, [openForwardMessageDrawer]);

  const handleSelectChat = (chat) => {
    setSelectedChats((prev) => {
      const isSelected = prev.some((c) => c.id === chat.id);
      if (isSelected) {
        return prev.filter((c) => c.id !== chat.id);
      }
      return [...prev, chat];
    });
  };

  const handleRemoveChat = (chatId) => {
    setSelectedChats((prev) => prev.filter((c) => c.id !== chatId));
  };

  const handleForward = async (event) => {
    event.preventDefault();
    setForwarding(true);

    try {
      const forwardPayloads = [];

      for (const chat of selectedChats) {
        const participants = chat.participants;
        const keyVersion = sessionStorage.getItem(
          `chatkey_${chat.id}_latestVersion`
        );

        // Text message
        if (forwardedMessage.text_content) {
          const { ciphertext, nonce } = await encryptInWorker({
            chatId: chat.id,
            plaintext: forwardedMessage.text_content,
            participants,
          });

          forwardPayloads.push({
            chat_id: chat.id,
            ciphertext,
            nonce,
            key_version: keyVersion,
            forwarded_from: forwardedMessage.id,
            media_url: null,
            media_type: null,
          });
        }
        // Media message
        else if (forwardedMessage.media_url) {
          if (
            forwardedMessage.media_type === 'gif' ||
            forwardedMessage.media_type === 'sticker'
          ) {
            forwardPayloads.push({
              chat_id: chat.id,
              media_url: forwardedMessage.media_url,
              media_type: forwardedMessage.media_type,
              key_version: keyVersion,
              forwarded_from: forwardedMessage.id,
              ciphertext: null,
              nonce: null,
            });
          } else {
            const sameChat = forwardedMessage.chat_id == chat.id;

            // Same chat - reuse encrypted file
            if (sameChat) {
              forwardPayloads.push({
                chat_id: chat.id,
                media_url: forwardedMessage.media_url,
                media_type: forwardedMessage.media_type,
                nonce: forwardedMessage.nonce,
                key_version: forwardedMessage.key_version,
                forwarded_from: forwardedMessage.id,
                ciphertext: null,
              });
              continue;
            }

            // Different chat - re-encrypt
            const res = await fetch(`${api}/${forwardedMessage.media_url}`);
            const encryptedBase64 = await res.text();
            const encryptedBytes = sodium.from_base64(encryptedBase64.trim());

            const sourceKeyBase64 = sessionStorage.getItem(
              `chatkey_${forwardedMessage.chat_id}_v${forwardedMessage.key_version}`
            );

            if (!sourceKeyBase64) {
              throw new Error('Source chat key not found');
            }

            const sourceKey = sodium.from_base64(sourceKeyBase64);
            const sourceNonce = sodium.from_base64(forwardedMessage.nonce);

            const decryptedBytes = sodium.crypto_secretbox_open_easy(
              encryptedBytes,
              sourceNonce,
              sourceKey
            );

            const { encryptedFile, nonce: newNonce } =
              await encryptFileBeforeUpload(decryptedBytes, chat.id);

            const formData = new FormData();
            formData.append('file', encryptedFile);
            formData.append('chatId', chat.id);
            formData.append('nonce', newNonce);

            const uploadRes = await fetch(`${api}/api/upload/media`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
              body: formData,
            });

            const uploadData = await uploadRes.json();

            if (uploadData.status !== 1) {
              throw new Error('File upload failed');
            }

            forwardPayloads.push({
              chat_id: chat.id,
              media_url: uploadData.media_url,
              media_type: forwardedMessage.media_type,
              nonce: newNonce,
              key_version: keyVersion,
              forwarded_from: forwardedMessage.id,
              ciphertext: null,
            });
          }
        }
      }

      // Send all forwards
      const response = await fetch(`${api}/api/messages/forward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: forwardPayloads }),
      });

      const data = await response.json();

      if (data.status === 1) {
        closeForwardMessageDrawer();
        handleMenuClose?.();
      }
    } catch (error) {
      console.error('Error forwarding message:', error);
    } finally {
      setForwarding(false);
    }
  };

  return (
    <Modal
      open={openForwardMessageDrawer}
      onClose={closeForwardMessageDrawer}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 500,
          sx: { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
        },
      }}
    >
      <Fade in={openForwardMessageDrawer}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: isMobileOrTablet ? '95%' : 700,
            maxWidth: 700,
            height: isMobileOrTablet ? '95vh' : '85vh',
            bgcolor: 'background.paper',
            borderRadius: 3,
            boxShadow: 24,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              Forward Message
            </Typography>
            <IconButton
              onClick={closeForwardMessageDrawer}
              size="small"
              disabled={forwarding}
              sx={{
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Search */}
          <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: '#F5F5F5',
                  '&:hover': {
                    bgcolor: '#EEEEEE',
                  },
                  '&.Mui-focused': {
                    bgcolor: 'background.paper',
                  },
                },
              }}
            />
          </Box>

          {/* Selected Chats Chips */}
          {selectedChats.length > 0 && (
            <Box
              sx={{
                p: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                gap: 1,
                flexWrap: 'wrap',
                bgcolor: '#F7FBFD',
              }}
            >
              <Typography
                variant="caption"
                sx={{ width: '100%', color: 'text.secondary', mb: 0.5 }}
              >
                Selected ({selectedChats.length}):
              </Typography>
              {selectedChats.map((chat) => (
                <Chip
                  key={chat.id}
                  label={chat.name}
                  onDelete={() => handleRemoveChat(chat.id)}
                  size="small"
                  sx={{
                    bgcolor: '#121660',
                    color: 'white',
                    '& .MuiChip-deleteIcon': {
                      color: 'rgba(255, 255, 255, 0.7)',
                      '&:hover': {
                        color: 'white',
                      },
                    },
                  }}
                />
              ))}
            </Box>
          )}

          {/* Chat List */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
            }}
          >
            {isLoading ? (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                }}
              >
                <CircularProgress size={40} />
              </Box>
            ) : filteredChats?.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {filteredChats.map((chat) => (
                  <ChatListItem
                    key={chat.id}
                    chat={chat}
                    authUser={authUser}
                    api={api}
                    isSelected={selectedChats.some((c) => c.id === chat.id)}
                    onSelect={() => handleSelectChat(chat)}
                  />
                ))}
              </Box>
            ) : (
              <EmptyState
                message={
                  searchTerm
                    ? 'No conversations found'
                    : 'No conversations available'
                }
              />
            )}
          </Box>

          {/* Footer - Send Button */}
          <Box
            sx={{
              p: 2.5,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Button
              fullWidth
              variant="contained"
              onClick={handleForward}
              disabled={selectedChats.length === 0 || forwarding}
              startIcon={
                forwarding ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <SendIcon />
                )
              }
              sx={{
                bgcolor: '#121660',
                py: 1.2,
                textTransform: 'none',
                fontSize: 16,
                fontWeight: 500,
                '&:hover': {
                  bgcolor: '#0D1048',
                },
                '&.Mui-disabled': {
                  bgcolor: '#E0E0E0',
                  color: '#9E9E9E',
                },
              }}
            >
              {forwarding
                ? `Forwarding to ${selectedChats.length} ${selectedChats.length === 1 ? 'conversation' : 'conversations'}...`
                : `Send to ${selectedChats.length || 0} ${selectedChats.length === 1 ? 'conversation' : 'conversations'}`}
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default ForwardMessageDrawer;
