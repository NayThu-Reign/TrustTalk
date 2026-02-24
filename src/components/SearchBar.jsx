import React from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  InputAdornment,
  Tooltip,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';

const SearchBar = ({
  isOpen,
  searchTerm,
  currentIndex,
  totalResults,
  onSearchChange,
  onNavigate,
  onClose,
}) => {
  if (!isOpen) return null;

  const hasResults = totalResults > 0;
  const isFirstResult = currentIndex === 0;
  const isLastResult = currentIndex === totalResults - 1;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        px: { xs: 2, sm: 3 },
        py: 1.5,
        bgcolor: 'background.paper',
        boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
        zIndex: 100, // Lower z-index since it's not sticky anymore
      }}
    >
      {/* Search Input */}
      <TextField
        autoFocus
        size="small"
        placeholder="Search in conversation..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            </InputAdornment>
          ),
        }}
        sx={{
          flex: 1,
          maxWidth: { xs: '100%', sm: 400 },
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

      {/* Results Counter & Navigation */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexShrink: 0,
        }}
      >
        {/* Results count chip */}
        <Chip
          label={
            hasResults
              ? `${currentIndex + 1} / ${totalResults}`
              : 'No results'
          }
          size="small"
          sx={{
            height: 28,
            bgcolor: hasResults ? '#F0F0F0' : '#FFF3E0',
            color: hasResults ? 'text.primary' : '#F57C00',
            fontWeight: 500,
            fontSize: '0.813rem',
            minWidth: 60,
          }}
        />

        {/* Navigation buttons */}
        <Box
          sx={{
            display: 'flex',
            gap: 0.5,
            borderRadius: 1,
            bgcolor: '#F5F5F5',
            p: 0.5,
          }}
        >
          <Tooltip title="First result">
            <span>
              <IconButton
                size="small"
                onClick={() => onNavigate('first')}
                disabled={!hasResults || isFirstResult}
                sx={{
                  width: 32,
                  height: 32,
                  '&:hover': {
                    bgcolor: 'background.paper',
                  },
                }}
              >
                <FirstPageIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Previous result">
            <span>
              <IconButton
                size="small"
                onClick={() => onNavigate('prev')}
                disabled={!hasResults || isFirstResult}
                sx={{
                  width: 32,
                  height: 32,
                  '&:hover': {
                    bgcolor: 'background.paper',
                  },
                }}
              >
                <KeyboardArrowUpIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Next result">
            <span>
              <IconButton
                size="small"
                onClick={() => onNavigate('next')}
                disabled={!hasResults || isLastResult}
                sx={{
                  width: 32,
                  height: 32,
                  '&:hover': {
                    bgcolor: 'background.paper',
                  },
                }}
              >
                <KeyboardArrowDownIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Last result">
            <span>
              <IconButton
                size="small"
                onClick={() => onNavigate('last')}
                disabled={!hasResults || isLastResult}
                sx={{
                  width: 32,
                  height: 32,
                  '&:hover': {
                    bgcolor: 'background.paper',
                  },
                }}
              >
                <LastPageIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {/* Close button */}
        <Tooltip title="Close search">
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              ml: 0.5,
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
  );
};

export default SearchBar;
