import { Box, IconButton, Typography } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { memo } from "react";
import { ChatImage } from "./ChatMediaComponents";

const MessagePreview = memo(({ message, onCancel, type, api,openFullscreen }) => (
    <Box sx={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px',
        borderRadius: '8px',
        backgroundColor: '#e0f7fa',
        marginX: 'auto',
    }}>
        <Box sx={{ flexGrow: 1 }}>
            {message.mediaUrl ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: "10px" }}>
                    {message.mediaType === "gif" && (
                        <img src={message.mediaUrl} alt="Media preview" style={{ width: 50, height: 50, borderRadius: 4 }}/>
                    )}
                        {message.mediaType === "image" && (
                            <img src={message.decryptedUrl} alt={message.id}  style={{ width: 50, height: 50, borderRadius: 4 }}/>
                        )}
                       
                    
                    <Box>
                        <Typography sx={{ fontSize: "14px", fontWeight: "600", color: "#000" }}>
                            {message.sender}
                        </Typography>
                        <Typography variant="body2" noWrap>
                            {message.mediaType === 'image' ? 'Photo Message' : message.mediaType === "poll" ? "Poll Message" : message.mediaType === "autio" ? "Audio Message" : message.mediaType === "video" ? "Video Message" : ''}
                        </Typography>
                        
                        {message.mediaType === "file" && (
                            <Typography
                            variant="body2"
                            sx={{
                                width: "100%",
                              
                            }}
                        >
                            {message.mediaUrl.split('/').pop().replace('.enc', '')}
                        </Typography>
                        )}
                    </Box>
                </Box>
            ) : (
                <Box>
                    <Typography sx={{ fontSize: "14px", fontWeight: "400", color: "#000" }}>
                        {message.sender}:
                    </Typography>
                    <Box>{message.textContent}</Box>
                </Box>
            )}
        </Box>
        <IconButton onClick={onCancel}>
            <CloseIcon fontSize="small" />
        </IconButton>
    </Box>
));

export default MessagePreview;