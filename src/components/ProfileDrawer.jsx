import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  Box,
  IconButton,
  Typography,
  Avatar,
  Fade,
  Backdrop,
  useMediaQuery,
  Skeleton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { produce } from 'immer';
import { useAuth } from '../providers/AuthProvider';

import FullscreenImageViewer from './FullscreenImageViewer';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const ProfileField = ({ label, value, icon }) => {
  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 0.5,
        }}
      >
        {icon && (
          <Box sx={{ color: '#8E8E93', display: 'flex' }}>
            {icon}
          </Box>
        )}
        <Typography
          variant="caption"
          sx={{
            fontSize: 13,
            fontWeight: 500,
            color: '#8E8E93',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {label}
        </Typography>
      </Box>
      <Typography
        variant="body1"
        sx={{
          fontSize: 16,
          fontWeight: 400,
          color: 'text.primary',
          pl: icon ? 3 : 0,
        }}
      >
        {value || 'Not specified'}
      </Typography>
    </Box>
  );
};

const ProfileDrawer = ({
  openProfileDrawer,
  closeProfileDrawer,
  userId,
  setUserId,
  recipient=null,
}) => {
  const { authUser, updateAuthenticatedUser } = useAuth();
  const token = localStorage.getItem('token');
  const api = import.meta.env.VITE_API_URL;
  const isMobileOrTablet = useMediaQuery('(max-width: 950px)');

  const queryClient = useQueryClient();

 
  const [loading, setLoading] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef();

  const isOwnProfile = authUser?.user_code === userId;

  const fetchUser = async (userId) => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetch(`${api}/api/users/${userId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.status !== 1) {
        throw new Error('Failed to fetch user data');
      }

      return data.user;
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const {
    data: user,
    isLoading: isLoading,
    isError: isError,
  } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUser(userId),
    enabled: !!userId && !recipient,
    staleTime: 1000 * 60 * 10,
    onSettled: () => setLoading(false),
  });
 
  const handleFileChange = async (e) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    setUploadingPhoto(true);

    try {
      const fileContent = await readFileContent(file);

      const response = await fetch(`${api}/api/users/update/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_photo: fileContent,
        }),
      });

      const data = await response.json();

      if (data.status === 1) {
        // setUser(
        //   produce((draft) => {
        //     draft.user_photo = data.updatedUser?.user_photo;
        //   })
        // );

        const updateUserMutation = useMutation({
            mutationFn: updateUser,
            onSuccess: (updatedUser) => {
              queryClient.setQueryData(["user", userId], updatedUser);
            },
          });


        updateAuthenticatedUser({
          user_photo: data.updatedUser?.user_photo,
        });
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const openFullscreen = (url) => {
    setFullscreenImage(url);
  };

  const closeFullscreen = () => {
    setFullscreenImage(null);
  };

  const currentPhoto = isOwnProfile
    ? authUser?.user_photo
    : user?.user_photo || recipient?.user_photo;
  const currentUsername = isOwnProfile
    ? authUser?.username
    : user?.username || recipient?.username;
  const photoUrl = currentPhoto ? `${api}/${currentPhoto}` : null;

  return (
    <>
      <Modal
        open={openProfileDrawer}
        onClose={closeProfileDrawer}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
            sx: { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
          },
        }}
      >
        <Fade in={openProfileDrawer}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: isMobileOrTablet ? '95%' : 600,
              maxWidth: 600,
              bgcolor: 'background.paper',
              borderRadius: 3,
              boxShadow: 24,
              maxHeight: '90vh',
              overflow: 'auto',
            }}
          >
            {/* Header */}
            <Box
              sx={{
                position: 'sticky',
                top: 0,
                bgcolor: 'background.paper',
                zIndex: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
                p: 2.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="h6" fontWeight={600}>
                Profile
              </Typography>
              <IconButton
                onClick={closeProfileDrawer}
                size="small"
                sx={{
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Content */}
            <Box sx={{ p: 3 }}>
              {loading ? (
                <ProfileSkeleton />
              ) : (
                <>
                  {/* Profile Photo Section */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      mb: 4,
                    }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <Avatar
                        src={photoUrl}
                        alt={currentUsername}
                        onClick={() => photoUrl && openFullscreen(photoUrl)}
                        sx={{
                          width: 120,
                          height: 120,
                          fontSize: 48,
                          fontWeight: 600,
                          cursor: photoUrl ? 'pointer' : 'default',
                          bgcolor: '#121660',
                          border: '4px solid',
                          borderColor: 'background.paper',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: photoUrl ? 'scale(1.05)' : 'none',
                          },
                        }}
                      >
                        {!photoUrl && currentUsername?.[0]?.toUpperCase()}
                      </Avatar>

                      {isOwnProfile && (
                        <IconButton
                          onClick={triggerFileInput}
                          disabled={uploadingPhoto}
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            bgcolor: '#121660',
                            color: 'white',
                            width: 36,
                            height: 36,
                            '&:hover': {
                              bgcolor: '#0D1048',
                            },
                            '&.Mui-disabled': {
                              bgcolor: '#ccc',
                            },
                          }}
                        >
                          {uploadingPhoto ? (
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                border: '2px solid white',
                                borderTopColor: 'transparent',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                '@keyframes spin': {
                                  '0%': { transform: 'rotate(0deg)' },
                                  '100%': { transform: 'rotate(360deg)' },
                                },
                              }}
                            />
                          ) : (
                            <CameraAltIcon fontSize="small" />
                          )}
                        </IconButton>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                      />
                    </Box>

                    <Typography
                      variant="h5"
                      fontWeight={600}
                      sx={{ mt: 2 }}
                    >
                      {user?.username || recipient?.username}
                    </Typography>
                  </Box>

                  {/* Profile Fields */}
                  <Box
                    sx={{
                      bgcolor: '#F7FBFD',
                      borderRadius: 2,
                      p: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2.5,
                    }}
                  >
                    <ProfileField
                      label="Name"
                      value={user?.username || recipient?.username}
                    />
                    <ProfileField
                      label="Position"
                      value={user?.position || recipient?.position || 'Not specified'}
                    />
                    <ProfileField
                      label="Department"
                      value={user?.department_name || recipient?.department_name || 'Not specified'}
                    />
                  </Box>
                </>
              )}
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* Fullscreen Image Viewer */}
      <FullscreenImageViewer
        imageUrl={fullscreenImage}
        onClose={closeFullscreen}
      />
    </>
  );
};

// Loading Skeleton Component
const ProfileSkeleton = () => (
  <Box>
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        mb: 4,
      }}
    >
      <Skeleton variant="circular" width={120} height={120} />
      <Skeleton variant="text" width={150} height={40} sx={{ mt: 2 }} />
    </Box>
    <Box
      sx={{
        bgcolor: '#F7FBFD',
        borderRadius: 2,
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5,
      }}
    >
      <Skeleton variant="rectangular" width="100%" height={60} />
      <Skeleton variant="rectangular" width="100%" height={60} />
      <Skeleton variant="rectangular" width="100%" height={60} />
    </Box>
  </Box>
);

export default ProfileDrawer;
