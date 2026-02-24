import {
    Box,
    IconButton,
    Typography
} from "@mui/material"

import {
    ArrowBackIos as ArrowBackIosIcon,
    InsertDriveFile as InsertDriveFileIcon,
    FileDownload as FileDownloadIcon
} from "@mui/icons-material"

import React, { useState } from "react";
import { useColorMode } from "../providers/ThemeModeProvider";

export default function SharedFileOpen({ isMobileOrTablet,  formatDate, downloadFile, handleSharedFileClose, groupedFiles }) {
    const { mode, setMode } = useColorMode();
    const [hoveredFileId, setHoveredFileId] = useState(null);
    const [isHoveringFile, setIsHoveringFile] = useState(null);

    const handleMouseFileEnter = (fileId) => {
        console.log("fileHoveredId", fileId);
        setIsHoveringFile(true);
        setHoveredFileId(fileId); // Set current message ID as hovered
        console.log("Hovered File ID:", hoveredFileId);
    };

    const handleMouseFileLeave = () => {
        setIsHoveringFile(false);
        setHoveredFileId(null); // Set current message ID as hovered

    };
    // console.log("hoveredFileId", hoveredFileId);
    return (
        <Box
                            sx={{
                                width: isMobileOrTablet ? "100%" : "350px",
                                paddingTop: "10px",
                                paddingBottom: "10px",
                                paddingLeft: "5px",
                                borderLeft: "1px solid #E5E5EA",
                                overflowX: "hidden",
                                // height: "100vh",
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    marginBottom: "40px",
                                }}
                            >
                                <IconButton
                                    onClick={handleSharedFileClose}
                                    sx={{
                                        "&:hover": {
                                            background: "transparent"
                                        }
                                    }}
                                >
                                    <ArrowBackIosIcon sx={{ color: "#121660" }}/>
                                </IconButton>
                                <Typography
                                    sx={{
                                        fontSize: "16px",
                                        fontWeight: "400",
                                        color: "#121660",
                                    }}
                                >
                                    Shared Files
                                </Typography>
                            </Box>
                            {Object.entries(groupedFiles).map(([dateLabel, files]) => (
                                <React.Fragment key={dateLabel}>
                                    <Typography
                                        sx={{
                                            display: "flex",
                                            justifyContent: "center",
                                            fontSize: "14px",
                                            fontWeight: "400",
                                            color: "#3C3C4399",
                                            marginBottom: "10px",
                                        }}    
                                    >
                                        {dateLabel}
                                    </Typography>
                                    {files.map((file, index) => {
                                        console.log("fileIID", file);
                                        return (
                                            <Box
                                                key={file.id}
                                                sx={{
                                                    width: "100%",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    // justifyContent: "space-between",
                                                    marginBottom: "10px",
                                                    
                                                    "&:hover": {
                                                        background: "#F7F7F7",
                                                    }
                                                }}
                                                onMouseEnter={() => handleMouseFileEnter(file.id)}
                                                onMouseLeave={handleMouseFileLeave}
                                            >
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "8px",
                                                        
                                                    }}
                                                >
                                                   <InsertDriveFileIcon  sx={{ fontSize: "32px", color: "#000" }}/>

                                                    <Box>
                                                        <Typography
                                                            sx={{
                                                                width: isMobileOrTablet ? "200px" : "135px",
                                                                fontSize: "16px",
                                                                fontWeight: "400",
                                                                color: "#000000",
                                                                overflow: "hidden",
                                                                whiteSpace: "nowrap",
                                                                textOverflow: "ellipsis",
                                                            }}
                                                        >
                                                            {file.media_url}
                                                        </Typography>

                                                        <Typography
                                                            sx={{
                                                                fontSize: "12px",
                                                                fontWeight: "400",
                                                                color: "#A8A8A8",
                                                            }}
                                                        >
                                                            {formatDate(file.createdAt)}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                { hoveredFileId === file.id && (
                                                    <>
                                                        <IconButton
                                                            onClick={() => downloadFile(file)}
                                                        >
                                                            <FileDownloadIcon sx={{ color: "#000"}}/>
                                                        </IconButton>

                                                        
                                                    </>
                                                )}
                                                
                                            </Box>
                                        )
                                    })}
                                </React.Fragment>
                            ))}
                        </Box>
    )
}