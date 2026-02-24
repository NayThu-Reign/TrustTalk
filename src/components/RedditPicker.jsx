import React, { useEffect, useState } from 'react';
import {
  Box,
  IconButton,
  TextField,
  ImageList,
  ImageListItem,
  Popover,
  ButtonGroup,
  Button,
  Tooltip,
  useMediaQuery,
} from '@mui/material';

import {
  Search as SearchIcon,
  AddReaction as AddReactionIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

export default function RedditPicker({ onSelectGif, closePicker }) {
  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [activeType, setActiveType] = useState('gifs'); // Default subreddit
    const isMobileOrTablet = useMediaQuery("(max-width: 950px)");

  const api = import.meta.env.VITE_API_URL;
  const subreddits = {
    gifs: 'gifs',
    stickers: 'stickers',
  };

  const fetchRedditPosts = async (query = '') => {
    try {
      const subreddit = subreddits[activeType];
      // const endpoint = query
      //   ? `https://www.reddit.com/r/${subreddit}/search.json?q=${query}&restrict_sr=1`
      //   : `https://www.reddit.com/r/${subreddit}/hot.json`;

      const proxyUrl = `${api}/api/reddit?subreddit=${subreddit}${query ? `&query=${query}` : ''}`;


      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      setPosts(data.data.children);
    } catch (error) {
      console.error('Error fetching Reddit posts:', error);
    }
  };

  useEffect(() => {
    if (isPickerOpen) fetchRedditPosts();
  }, [isPickerOpen, activeType]);

  const handleSearch = (event) => {
    event.preventDefault();
    fetchRedditPosts(searchTerm);
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
      <Tooltip title="Gif&Sticker">
        <IconButton aria-label="open gif" onClick={handleClick}>
          <AddReactionIcon sx={{ fontSize: isMobileOrTablet ? "15px" : '32px', color: '#121660' }} />
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
            aria-label="gif close"
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
          <IconButton aria-label="gif search" onClick={handleSearch}>
            <SearchIcon />
          </IconButton>
        </Box>

        <ButtonGroup variant="outlined" fullWidth>
          <Button
            aria-label="gifs"
            onClick={() => setActiveType('gifs')}
            variant={activeType === 'gifs' ? 'contained' : 'outlined'}
          >
            GIFs
          </Button>
          <Button
            aria-label="stickers"
            onClick={() => setActiveType('stickers')}
            variant={activeType === 'stickers' ? 'contained' : 'outlined'}
          >
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
            {posts.map((post) => {
              const imageUrl =
                post.data?.url_overridden_by_dest || post.data?.thumbnail;

              return (
                <ImageListItem
                  key={post.data.id}
                  onClick={() => {
                    onSelectGif(imageUrl, activeType === 'gifs' ? 'gif' : 'sticker');
                    handleClose();
                  }}
                >
                  <img
                    src={imageUrl}
                    alt={post.data.title}
                    style={{ cursor: 'pointer' }}
                  />
                </ImageListItem>
              );
            })}
          </ImageList>
        </Box>
      </Popover>
    </Box>
  );
}


