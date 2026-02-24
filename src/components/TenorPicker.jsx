import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Popover,
  TextField,
  Button,
  ButtonGroup,
  Tooltip,
  ImageList,
  ImageListItem,
} from '@mui/material';
import AddReactionIcon from '@mui/icons-material/AddReaction';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';

export default function TenorPicker({ onSelectGif, closePicker }) {
  const [media, setMedia] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null); // Anchor for Popover
  const [isPickerOpen, setIsPickerOpen] = useState(false); // State to manage visibility
  const [activeType, setActiveType] = useState('gif'); // 'gif' or 'sticker'
  const api = import.meta.env.VITE_API_URL;

  const fetchMedia = async (query = '') => {
    try {
      const endpoint = query
        ? `${api}/tenor/${activeType === 'gif' ? 'high' : 'sticker'}?q=${query}&limit=20`
        : `${api}/tenor/${activeType === 'gif' ? 'high' : 'sticker'}?limit=20`;
      const response = await fetch(endpoint); // Call your backend
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
  
      const data = await response.json();
      setMedia(data.results);
    } catch (error) {
      console.error('Error fetching media:', error);
    }
  };

  useEffect(() => {
    if (isPickerOpen) fetchMedia();
  }, [isPickerOpen, activeType]);

  const handleSearch = (event) => {
    event.preventDefault();
    fetchMedia(searchTerm);
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setIsPickerOpen((prev) => !prev);
    closePicker(); // Notify parent component to close the picker
  };

  const handleClose = () => {
    setAnchorEl(null);
    setIsPickerOpen(false);
  };

  const open = Boolean(anchorEl);

  return (
    <Box>
      <Tooltip title="Gif & Sticker">
        <IconButton onClick={handleClick}>
          <AddReactionIcon sx={{ fontSize: '32px', color: '#121660' }} />
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          style: {
            borderRadius: '8px',
            width: '300px',
            height: '350px',
            overflow: 'hidden',
            padding: '8px',
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton
            size="small"
            onClick={handleClose}
            sx={{
              color: '#121660',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Box display="flex" alignItems="center" mb={2}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1 }}
          />
          <IconButton onClick={handleSearch}>
            <SearchIcon />
          </IconButton>
        </Box>

        <ButtonGroup variant="outlined" fullWidth>
          <Button onClick={() => setActiveType('gif')} variant={activeType === 'gif' ? 'contained' : 'outlined'}>
            GIFs
          </Button>
          <Button onClick={() => setActiveType('sticker')} variant={activeType === 'sticker' ? 'contained' : 'outlined'}>
            Stickers
          </Button>
        </ButtonGroup>

        <Box
          sx={{
            maxHeight: '280px',
            overflowY: 'auto',
            borderRadius: '8px',
          }}
        >
          <ImageList cols={3} gap={8}>
            {media.map((item) => (
              <ImageListItem
                key={item.id}
                onClick={() => {
                  onSelectGif(item.media_formats.gif.url); // Use the gif URL for Tenor
                  handleClose(); // Close the picker after selecting a GIF
                }}
              >
                <img
                  src={item.media_formats.gif.url}
                  alt={item.title}
                  style={{ cursor: 'pointer' }}
                />
              </ImageListItem>
            ))}
          </ImageList>
        </Box>
      </Popover>
    </Box>
  );
}

