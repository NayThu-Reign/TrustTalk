import React,{ useEffect, useRef, useState,Suspense,  } from 'react';
import { Box, IconButton, Tooltip,useMediaQuery } from '@mui/material';
import { 
    EmojiEmotions as EmojiEmotionsIcon,
    Close as CloseIcon, 
} from '@mui/icons-material';


export default function EmojiSelector({ onSelect }) {
    const [isOpen, setIsOpen] = useState(false);
    const pickerRef = useRef(null);
    const [PickerComponent, setPickerComponent] = useState(null);
    const isMobileOrTablet = useMediaQuery("(max-width: 950px)");


    const loadEmojiPicker = async () => {
        if (!PickerComponent) {
            const module = await import('emoji-picker-react');
            setPickerComponent(() => module.default);
        }
        setIsOpen(true);
    };

    const togglePicker = () => {
        setIsOpen(!isOpen);
    };

    const onEmojiClick = (emojiData) => {
        onSelect(emojiData.emoji);
        // setIsOpen(false);
    };

    const closePicker = () => {
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <Box sx={{ position: 'relative' }}>
           <Tooltip title="Emoji">
                <IconButton
                    aria-label="emoji open"
                    onClick={loadEmojiPicker}
                    sx={{
                        "&:hover": {
                            background: "transparent",
                        }
                    }}
                >
                    <EmojiEmotionsIcon sx={{ color: "#121660", fontSize: isMobileOrTablet ? "15px" : "32px" }}/>
                </IconButton>
           </Tooltip>

            {isOpen && PickerComponent && (
                <Box
                    ref={pickerRef}
                    sx={{
                        position: 'absolute',
                        bottom: '100%', // This will display the picker above the input if the parent is fixed
                        left: 0,
                        zIndex: 10, // Ensure it appears above other content
                        boxShadow: 3,
                        backgroundColor: 'white', // Ensures the picker has a background
                    }}
                >
                     <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <IconButton
                            aria-label="emoji close"
                            size="small"
                            onClick={closePicker}
                            sx={{
                                color: '#121660',
                                "&:hover": {
                                    backgroundColor: '#f5f5f5',
                                },
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <PickerComponent onEmojiClick={onEmojiClick} />
                    
                </Box>
            )}
        </Box>
    );
}

