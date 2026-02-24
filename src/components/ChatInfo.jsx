import {
    Box,
    Typography,
    Button,
    IconButton,
    Avatar,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogActions,
} from "@mui/material";

import {
    VolumeUp as VolumeUpIcon,
    VolumeOff as VolumeOffIcon,
    GroupAdd as GroupAddIcon,
    InsertDriveFile as InsertDriveFileIcon,
    Edit as EditIcon,
    FileDownload as FileDownloadIcon,
    ArrowBackIos as ArrowBackIosIcon,
} from "@mui/icons-material";

import { lazy, Suspense, useState } from "react";
const ProfileDrawer = lazy(() => import("./ProfileDrawer"));
import { useAuth } from "../providers/AuthProvider";
import { useChats } from "../providers/ChatsProvider";
import LongPress from "./LongPress";


export default function ChatInfo({ 
      chat, 
    api, 
    recipient,
    triggerFileInput,
    handleMuteChat,
    handleUnMuteChat,
    handleOpenAddParticipantDrawer,
    handleOpenAddGroupDrawer,
    handleRightClick,
    dialogOpen,
    handleDialogClearClose,
    handleConfirmRemove,
    handleClose,
    handleClickLeaveOpen,
    handleClickOpen,
    handleGiveAdmin,
    leaveDialogOpen,
    handleLeaveDialogClearClose,
    handleLeaveChat,
    fullscreenImage,
    openFullscreen,
    closeFullscreen,
    formatDate,
    isMobileOrTablet,
    sharedMedias,
    sharedFiles,
    handleOpenProfileDrawer,
    handleCloseProfileDrawer,
    profileDrawerOpen,
    handleFileDownload,
    groupedMedias,
    fileInputRef,
    handleFileChange,
    ownerAdminIds,
    contextMenu,
    selectedParticipantId,
    userId,
    isActive,
    downloadedMessages,
    setDownloadedMessages,
    handleMouseFileEnter,
    handleMouseFileLeave,
    hoveredFileId,
    updateHoverState,
    medias,
    files,
    groupedFiles,
    }) {
        
       const { onlineUsers } = useChats();
    const { authUser } = useAuth();
    
    // Internal view state
    const [currentView, setCurrentView] = useState('info'); // 'info', 'media', 'files'
    
    const latestMedias = sharedMedias.slice(-3); 
    const isAdmin = chat?.ownerAdmins?.some(a => a.user_code === authUser.user_code);
    const isParticipant = chat?.participants?.some(p => p.user_code === authUser.user_code);

    const mutedByArray = Array.isArray(chat?.muted_by)
        ? chat.muted_by
        : chat?.muted_by
            ? JSON.parse(chat.muted_by)
            : [];

    const mutedChat = mutedByArray.includes(authUser.user_code);

    // Render different views based on currentView state
    if (currentView === 'files') {
        return (
            <Box
                sx={{
                    width: "100%",
                    paddingTop: "10px",
                    paddingBottom: "40px",
                    paddingRight: "24px",
                    paddingLeft: "24px",
                    height: "80vh",
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
                        onClick={() => setCurrentView('info')}
                        sx={{
                            "&:hover": {
                                background: "transparent",
                            },
                        }}
                    >
                        <ArrowBackIosIcon sx={{ color: "#121660" }} />
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
                <Box
                    sx={{
                        height: "60vh",
                        overflowY: "auto",
                        paddingBottom: "30px",
                    }}
                >
                    {Object.entries(groupedFiles).map(([dateLabel, files]) => (
                        <Box key={dateLabel}>
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
                            {files.map((file) => (
                                <Box
                                    key={file.id}
                                    sx={{
                                        width: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        marginBottom: "15px",
                                        "&:hover": {
                                            background: "#F7F7F7",
                                        },
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
                                        <InsertDriveFileIcon sx={{ fontSize: "32px" }} />
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
                                                {file.media_url.split("/").pop().replace(".enc", "")}
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
                                    {hoveredFileId === file.id && !downloadedMessages.includes(file.id) && (
                                        <IconButton
                                            aria-label="download file"
                                            onClick={() => handleFileDownload(file, file.chat_id)}
                                        >
                                            <FileDownloadIcon />
                                        </IconButton>
                                    )}
                                </Box>
                            ))}
                        </Box>
                    ))}
                </Box>
            </Box>
        );
    }

    if (currentView === 'media') {
        return (
            <Box
                sx={{
                    width: "100%",
                    paddingTop: "10px",
                    paddingBottom: "10px",
                    paddingRight: "24px",
                    paddingLeft: "20px",
                    height: "80vh",
                    overflowY: "auto",
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "40px",
                    }}
                >
                    <IconButton
                        onClick={() => setCurrentView('info')}
                        sx={{
                            "&:hover": {
                                background: "transparent",
                            },
                        }}
                    >
                        <ArrowBackIosIcon sx={{ color: "#121660" }} />
                    </IconButton>
                    <Typography
                        sx={{
                            fontSize: "16px",
                            fontWeight: "400",
                            color: "#121660",
                        }}
                    >
                        Media
                    </Typography>
                </Box>

                {Object.entries(groupedMedias).map(([dateLabel, medias]) => (
                    <Box key={dateLabel}>
                        <Typography
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                                marginBottom: "15px",
                                fontSize: "14px",
                                fontWeight: "400",
                                color: "#3C3C4399",
                            }}
                        >
                            {dateLabel}
                        </Typography>
                        <Box
                            sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: isMobileOrTablet ? "20px" : "20px",
                                paddingBottom: "40px",
                            }}
                        >
                            {medias.length > 0 &&
                                medias.map((media) => (
                                    <Box key={media.id}>
                                        <img
                                            style={{
                                                width: isMobileOrTablet ? "100px" : "110px",
                                                height: isMobileOrTablet ? "50px" : "150px",
                                                marginBottom: "10px",
                                                cursor: "pointer",
                                            }}
                                            src={media.decryptedUrl}
                                            onClick={() => openFullscreen(media.decryptedUrl)}
                                        />
                                    </Box>
                                ))}
                        </Box>
                    </Box>
                ))}

                {fullscreenImage && (
                    <div
                        onClick={closeFullscreen}
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            backgroundColor: "rgba(0, 0, 0, 0.8)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 1500,
                            cursor: "zoom-out",
                        }}
                    >
                        <img
                            src={fullscreenImage}
                            alt="Full-size"
                            style={{
                                maxWidth: "90%",
                                maxHeight: "90%",
                                borderRadius: "8px",
                            }}
                        />
                    </div>
                )}
            </Box>
        );
    }



        
       
    return (
        <Box
            sx={{
                // width: isMobileOrTablet ? "100%"  : "350px",
                paddingTop: "10px",
                paddingBottom: "120px",
                paddingRight: "20px",
                paddingLeft: "20px",
                borderLeft: "1px solid #E5E5EA",
                zIndex: 1010, // Higher z-index value
                                    // height: "100vh",
                                    // overflowY: "auto",
                                    // border: "1px solid",
                                    // height: "100vh",
            }}
        >
                                <Box
                                    sx={{
                                        paddingBottom: "16px",
                                        borderBottom: "1px solid #E5E5EA"
                                    }}
                                >
                                    <Box>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: "center",
                                            }}
                                        >
                                            { (chat && chat?.is_group_chat === false) && (
                                    isActive === true ? (
                                        <Box
                                        sx={{
                                            position: "relative",
                                            display: "inline-block",
                                            // marginTop: "14px",
                
                                            // border: "1px solid",
                                        }}
                                    >


                                        {recipient?.user_photo ? (
                                            <Avatar 
                                                src={`${api}/${recipient.user_photo || recipient.user?.user_photo}`} 
                                                alt={recipient.username} 
                                                sx={{
                                                    width: isMobileOrTablet ? "50px" : "64px",
                                                    height: isMobileOrTablet ? "50px" : "64px",
                                                    background: "#D9D9D9",
                                                }} 
                                                onClick={handleOpenProfileDrawer}

                                            />
                                        ) : (
                                            <Avatar 
                                                sx={{  
                                                    width: isMobileOrTablet ? "50px" : "64px",
                                                    height: isMobileOrTablet ? "50px" : "64px", 
                                                }}
                                                onClick={handleOpenProfileDrawer}

                                                
                                            >
                                            {recipient?.username?.charAt(0).toUpperCase() || recipient?.user?.username?.charAt(0).toUpperCase() || "?"}
                                            </Avatar>
                                        )}
                                        
                                      
                                     
            
                                        <Box
                                            sx={{
                                                position: "absolute",
                                                bottom: "4px",
                                                right: "-2px",
                                                width: "14px",
                                                height: "14px",
                                                backgroundColor: "#34C759",
                                                borderRadius: "50%",
                                                border: "1px solid #fff",
                                            }}
                                        >
            
                                        </Box>

                                        {profileDrawerOpen && recipient && (
                                                <Suspense fallback={<div>loading...</div>} >
                                                <ProfileDrawer openProfileDrawer={profileDrawerOpen} closeProfileDrawer={handleCloseProfileDrawer} userId={recipient.employeeId} recipient={recipient}/>
                                            </Suspense>
                                            )}
            
                                    
                                        </Box>
                                    ) : (
                                        <>

                                        {recipient?.user_photo ? (
                                            <Avatar src={`${api}/${recipient.user_photo || recipient.user?.user_photo}`} alt={recipient.username} sx={{
                                                width: isMobileOrTablet ? "50px" : "64px",
                                                height: isMobileOrTablet ? "50px" : "64px",
                                                background: "#D9D9D9",
                                            }} 
                                            onClick={handleOpenProfileDrawer}
                                             
                                             />
                                        ) : (
                                            <Avatar 
                                                sx={{  width: isMobileOrTablet ? "50px" : "64px",
                                                height: isMobileOrTablet ? "50px" : "64px", }}
                                             onClick={handleOpenProfileDrawer}

                                            >
                                            {recipient?.username?.charAt(0).toUpperCase() || recipient?.user?.username?.charAt(0).toUpperCase() || "?"}
                                            </Avatar>
                                        )}
                                           
                                            {profileDrawerOpen && recipient && (
                                                <Suspense fallback={<div>loading...</div>} >
                                                <ProfileDrawer openProfileDrawer={profileDrawerOpen} closeProfileDrawer={handleCloseProfileDrawer} userId={recipient.employeeId} recipient={recipient}/>
                                            </Suspense>
                                            )}
                                        </>
                                            ))}
                                            
                                            {/* {chat && chat.is_group_chat && (
                                        chat.photo ? (
                                            // Display chat photo if available
                                            <>

                                             <Avatar 
                                                src={`${api}/${chat.photo}`} 
                                                alt={chat.name} 
                                                onClick={() => openFullscreen(`${api}/${chat.photo}`)}
                                                    sx={{
                                                        marginTop: "8px",
                                                        width: "64px",
                                                        height: "64px",
                                                        background: "#D9D9D9",
                                                    }}
                                                
                                            />
                                                
                                                
                                                {fullscreenImage && (
                                                    <div
                                                                                    onClick={closeFullscreen}
                                                                                    style={{
                                                                                        position: 'fixed',
                                                                                        top: 0,
                                                                                        left: 0,
                                                                                        width: '100%',
                                                                                        height: '100%',
                                                                                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        justifyContent: 'center',
                                                                                        zIndex: 1500, // Ensures the overlay is above other content
                                                                                        cursor: 'zoom-out', // Indicates that clicking will zoom out
                                                                                    }}
                                                                                >
                                                                                    <img
                                                                                        src={fullscreenImage}
                                                                                        alt="Full-size"
                                                                                        style={{
                                                                                            maxWidth: '90%',
                                                                                            maxHeight: '90%',
                                                                                            borderRadius: '8px',
                                                                                        }}
                                                                                    />
                                                    </div>
                                                )}
                                                
                                            </>
                                        ) : (
                                            // Display participants' user_photos or fallback merged into one Avatar
                                            <Avatar
                                                onClick={triggerFileInput}
                                                sx={{
                                                    marginTop: "8px",
                                                    width: "64px",
                                                    height: "64px",
                                                    position: 'relative',
                                                    background: "#D9D9D9",
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        width: '100%',
                                                        height: '100%',
                                                        position: 'relative',
                                                    }}
                                                >
                                                    {chat.participants.slice(0, 4).map((participant, index, array) => (
                                                        participant.user_photo ? (
                                                            <Box
                                                                key={index}
                                                                component="img"
                                                                src={`${api}/${participant.user_photo}`}
                                                                alt="photo"
                                                                sx={{
                                                                    position: 'absolute',
                                                                    width: array.length === 1 ? '100%' :
                                                                        array.length === 2 ? '50%' : '50%',
                                                                    height: array.length === 1 ? '100%' :
                                                                            array.length === 2 ? '100%' : '50%',
                                                                    objectFit: 'cover',
                                                                    borderRadius: '50%',
                                                                    top: array.length === 1 ? '0%' : index < 2 ? '0%' : '50%',
                                                                    left: array.length === 1 ? '0%' : index % 2 === 0 ? '0%' : '50%',
                                                                    border: '1px solid #fff', // Border for better visuals
                                                                }}
                                                            />
                                                        ) : (
                                                            <Box
                                                                key={index}
                                                                sx={{
                                                                    position: 'absolute',
                                                                    width: array.length === 1 ? '100%' :
                                                                        array.length === 2 ? '50%' : '50%',
                                                                    height: array.length === 1 ? '100%' :
                                                                        array.length === 2 ? '100%' : '50%',
                                                                    display: 'flex',
                                                                    justifyContent: 'center',
                                                                    alignItems: 'center',
                                                                    background: '#BDBDBD',
                                                                    color: '#fff',
                                                                    fontSize: array.length === 1 ? '14px' : '10px',
                                                                    fontWeight: 'bold',
                                                                    borderRadius: '50%',
                                                                    top: array.length === 1 ? '0%' : index < 2 ? '0%' : '50%',
                                                                    left: array.length === 1 ? '0%' : index % 2 === 0 ? '0%' : '50%',
                                                                    border: '1px solid #fff', // Border for better visuals
                                                                }}
                                                            >
                                                                {participant.username.charAt(0).toUpperCase()}
                                                            </Box>
                                                        )
                                                    ))}
                                                </Box>
                                                    <input 
                                                    ref={fileInputRef}
                                                    type="file" 
                                                    style={{ display: 'none'}}
                                                    onChange={handleFileChange}
                                        
                                                />
                                            </Avatar>
                                        )
                                            )} */}

                                            {chat && chat?.is_group_chat && (
                                        chat.photo ? (
                                            // Display chat photo if available
                                            <Box>
                                                <Box sx={{display: "flex", alignItems: "center", gap: "5px"}}>
                                                    <Avatar
                                                        src={`${api}/${chat.photo}`}
                                                        onClick={() => openFullscreen(`${api}/${chat.photo}`)}
                                                        sx={{
                                                            marginTop: "8px",
                                                            width: "64px",
                                                            height: "64px",
                                                            background: "#D9D9D9",
                                                        }}
                                                    />
                                                    {chat && chat?.is_group_chat && isAdmin && isParticipant && (
                                                <IconButton onClick={triggerFileInput}>
                                                    <EditIcon />
                                                </IconButton>
                                            )}
                                            <input 
                                                    ref={fileInputRef}
                                                    type="file" 
                                                    style={{ display: 'none'}}
                                                    onChange={handleFileChange}
                                        
                                                />
                                                </Box>
                                                <Typography
                                                sx={{
                                                    fontSize: "16px",
                                                    fontWeight: "500",
                                                    color: "#000000",
                                                    textAlign: "center",
                                                }}
                                            
                                            >
                                                {chat?.name}
                                            </Typography>

                                                
                                                {fullscreenImage && (
                                                    <div
                                                                                    onClick={closeFullscreen}
                                                                                    style={{
                                                                                        position: 'fixed',
                                                                                        top: 0,
                                                                                        left: 0,
                                                                                        width: '100%',
                                                                                        height: '100%',
                                                                                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        justifyContent: 'center',
                                                                                        zIndex: 1500, // Ensures the overlay is above other content
                                                                                        cursor: 'zoom-out', // Indicates that clicking will zoom out
                                                                                    }}
                                                                                >
                                                                                    <img
                                                                                        src={fullscreenImage}
                                                                                        alt="Full-size"
                                                                                        style={{
                                                                                            maxWidth: '90%',
                                                                                            maxHeight: '90%',
                                                                                            borderRadius: '8px',
                                                                                        }}
                                                                                    />
                                                    </div>
                                                )}
                                                
                                            </Box>
                                        ) : (
                                            <Box>
                                            <Box sx={{display: "flex", alignItems: "center", gap: "5px"}}>
                                            <Avatar
                                                onClick={triggerFileInput}
                                                sx={{
                                                    marginTop: "8px",
                                                    width: "64px",
                                                    height: "64px",
                                                    position: 'relative',
                                                    background: "#D9D9D9",
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        width: '100%',
                                                        height: '100%',
                                                        position: 'relative',
                                                    }}
                                                >
                                                    {chat.participants.slice(0, 4).map((participant, index, array) => (
                                                        participant.user_photo ? (
                                                            <Box
                                                                key={index}
                                                                component="img"
                                                                src={`${api}/${participant.user_photo}`}
                                                                sx={{
                                                                    position: 'absolute',
                                                                    width: array.length === 1 ? '100%' :
                                                                        array.length === 2 ? '50%' : '50%',
                                                                    height: array.length === 1 ? '100%' :
                                                                            array.length === 2 ? '100%' : '50%',
                                                                    objectFit: 'cover',
                                                                    borderRadius: '50%',
                                                                    top: array.length === 1 ? '0%' : index < 2 ? '0%' : '50%',
                                                                    left: array.length === 1 ? '0%' : index % 2 === 0 ? '0%' : '50%',
                                                                    border: '1px solid #fff', // Border for better visuals
                                                                }}
                                                            />
                                                        ) : (
                                                            <Box
                                                                key={index}
                                                                sx={{
                                                                    position: 'absolute',
                                                                    width: array.length === 1 ? '100%' :
                                                                        array.length === 2 ? '50%' : '50%',
                                                                    height: array.length === 1 ? '100%' :
                                                                        array.length === 2 ? '100%' : '50%',
                                                                    display: 'flex',
                                                                    justifyContent: 'center',
                                                                    alignItems: 'center',
                                                                    background: '#BDBDBD',
                                                                    color: '#fff',
                                                                    fontSize: array.length === 1 ? '14px' : '10px',
                                                                    fontWeight: 'bold',
                                                                    borderRadius: '50%',
                                                                    top: array.length === 1 ? '0%' : index < 2 ? '0%' : '50%',
                                                                    left: array.length === 1 ? '0%' : index % 2 === 0 ? '0%' : '50%',
                                                                    border: '1px solid #fff', // Border for better visuals
                                                                }}
                                                            >
                                                                {participant.username.charAt(0).toUpperCase()}
                                                            </Box>
                                                        )
                                                    ))}
                                                    
                                                </Box>
                                                    
                                                
                                            </Avatar>
                                            {chat && chat?.is_group_chat && isAdmin && isParticipant && (
                                                <IconButton onClick={triggerFileInput}>
                                                    <EditIcon />
                                                </IconButton>
                                            )}
                                            <input 
                                                    ref={fileInputRef}
                                                    type="file" 
                                                    style={{ display: 'none'}}
                                                    onChange={handleFileChange}
                                        
                                                />
                                            </Box>
                                            <Typography
                                                sx={{
                                                    fontSize: "16px",
                                                    fontWeight: "500",
                                                    color: "#000000",
                                                    textAlign: "center",
                                                }}
                                            
                                            >
                                                {chat?.name}
                                            </Typography>
                                            </Box>
                                            // Display participants' user_photos or fallback merged into one Avatar
                                            
                                        )
                                            )} 

                                            
                                            
                                        </Box>
                                        <Box>
                                           
                                            {chat?.is_group_chat === false && (
                                                <Box>
                                                     <Typography
                                                sx={{
                                                    fontSize: "16px",
                                                    fontWeight: "500",
                                                    color: "#000000",
                                                    textAlign: "center",
                                                }}
                                            
                                            >
                                                {chat?.name}
                                            </Typography>
                                                    <Typography
                                                        sx={{
                                                            fontSize: "14px",
                                                            fontWeight: "500",
                                                            color: "#8E8E93",
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        {recipient.position},
                                                    </Typography>
                                                    <Typography
                                                        sx={{
                                                            fontSize: "14px",
                                                            fontWeight: "500",
                                                            color: "#8E8E93",
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        {recipient.department_name}
                                                    </Typography>
                                                </Box>
                
                                            )}
                                        </Box>
                                    </Box>
                
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "50px",
                                            marginTop: "24px",
                                            justifyContent: isMobileOrTablet && "center",
                                        }}
                                    
                                    >
                                        {mutedChat ? (
                                            <Box
                                            sx={{
                                                marginLeft: "25px",
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                justifyContent: "center",

                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    // display: "flex",
                                                    // justifyContent: "center",
                                                    
                                                }}
                                            >
                                                <IconButton
                                                    onClick={handleUnMuteChat}
                                                    sx={{
                                                        background: "#F2F2F7",
                                                    }}
                                                >
                                                    <VolumeOffIcon />
                                                </IconButton>
                                            </Box>
                                            <Typography
                                                sx={{
                                                    fontSize: "14px",
                                                    fontWeight: "400",
                                                    color: "#8E8E93",
                                                    textAlign: "center",
                                                    
                                                }}
                                            >
                                                UnMute this chat
                                            </Typography>
                                        </Box>
                                        ) : (
                                            <Box
                                            sx={{
                                                marginLeft: "25px",
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "center",
                                                alignItems: "center",
                                            }}
                                        >
                                            <Box
                                            
                                            >
                                                <IconButton
                                                    onClick={handleMuteChat}
                                                    sx={{
                                                        background: "#F2F2F7",
                                                    }}
                                                >
                                                    <VolumeUpIcon />
                                                </IconButton>
                                            </Box>
                                            <Typography
                                                sx={{
                                                    fontSize: "14px",
                                                    fontWeight: "400",
                                                    color: "#8E8E93",
                                                    textAlign: "center",
                                                }}
                                            >
                                                Mute this chat
                                            </Typography>
                                        </Box>
                                        )}
                
                                        <Box>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                {chat?.is_group_chat === true ? (
                                                    <IconButton
                                                        onClick={handleOpenAddParticipantDrawer}
                                                        sx={{
                                                            background: "#F2F2F7",
                                                        }}
                                                    >
                                                        <GroupAddIcon />
                                                    </IconButton>
                                                ) : (
                                                    <IconButton
                                                        onClick={handleOpenAddGroupDrawer}
                                                        sx={{
                                                            background: "#F2F2F7",
                                                        }}
                                                    >
                                                        <GroupAddIcon />
                                                    </IconButton>
                                                )}
                                            </Box>
                                            <Typography
                                            
                                                sx={{
                                                    fontSize: "14px",
                                                    fontWeight: "400",
                                                    color: "#8E8E93",
                                                    textAlign: "center",                  
                                                }}
                                            >
                                                {chat?.is_group_chat === true ? "Add participant" : "Add to group"}
                                            </Typography>
                                        </Box>


                                    </Box>
                                </Box>

                                {chat?.is_group_chat === true && (
                                    <Box
                                        sx={{
                                            marginTop: "32px",

                                        }}
                                    >
                                        <Box
                                            sx={{
                                                marginTop: "16px",
                                            }}
                                        >
                                            <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                            }}
                                        >
                                            <Typography
                                                sx={{
                                                    fontSize: "14px",
                                                    fontWeight: "400",
                                                    color: "#121660"
                                                }}
                                            >
                                                Participants
                                            </Typography>
                            
                                        </Box>
                
                                        <Box
                                            sx={{
                                                marginTop: "16px",
                                                maxHeight: "600px",
                                                width: "100%",
                                                overflowY: "auto",
                                                paddingBottom: "30px",
                                                // paddingBottom: "10px",
                                                "&::-webkit-scrollbar": {
                                                    width: "8px", // Set scrollbar width
                                                    height: "2px",
                                                },
                                                "&::-webkit-scrollbar-thumb": {
                                                    backgroundColor: "#888", // Scrollbar thumb color
                                                    borderRadius: "4px", // Round scrollbar edges
                                                    height: "2px",
                                                },
                                                "&::-webkit-scrollbar-thumb:hover": {
                                                    backgroundColor: "#555", // Darker on hover
                                                },
                                                "&::-webkit-scrollbar-track": {
                                                    background: "#f1f1f1", // Track color behind the thumb
                                                    borderRadius: "4px",
                                                },
                                            }}
                                        >
                                            {chat?.participants
                                            ?.sort((a, b) => {
                                                const isAOwnerAdmin = ownerAdminIds.has(a.user_code) ? 0 : 1;
                                                const isBOwnerAdmin = ownerAdminIds.has(b.user_code) ? 0 : 1;
                                                return isAOwnerAdmin - isBOwnerAdmin;
                                            })
                                            .map((participant, index) => {
                                                // const isOnline = onlineUsers.includes(participant.user_code);
                                            const isOnline = onlineUsers.some(u => u.user_code === participant.user_code);

                                              {profileDrawerOpen && (
                                                <Suspense fallback={<div>loading...</div>} >
                                                <ProfileDrawer openProfileDrawer={profileDrawerOpen} closeProfileDrawer={handleCloseProfileDrawer} userId={participant.user_code} recipient={participant}/>
                                            </Suspense>
                                            )}
                                                   
                                                console.log("isParticipantOnline", isOnline);
                                               return (
                                                 <Box
                                                key={participant.user_code}
                                                sx={{
                                                    display: "flex",
                                                    paddingRight: "4px",
                                                    paddingLeft: "4px",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                    width: isMobileOrTablet ? "100%" : "252px",
                                                    marginBottom: index === chat.participants?.length - 1 ? "0px" : "16px", // No margin on last item
                                                }}
                                                onContextMenu={(event) => handleRightClick(event, participant.user_code)} // Right-click event
                                                 
                                                >


                                                   {isOnline ? (
                                                    <Box
                                        sx={{
                                            position: "relative",
                                            display: "inline-block",
                                            // marginTop: "14px",
                
                                            // border: "1px solid",
                                        }}
                                    >


                                        {participant?.user_photo ? (
                                            <Avatar 
                                                src={`${api}/${participant.user_photo || participant.user?.user_photo}`} 
                                                alt={participant.username} 
                                                sx={{
                                                    width: isMobileOrTablet ? "40px" : "50px",
                                                    height: isMobileOrTablet ? "40px" : "50px",
                                                    background: "#D9D9D9",
                                                }} 
                                                onClick={handleOpenProfileDrawer}

                                            />
                                        ) : (
                                            <Avatar 
                                                sx={{  
                                                    width: isMobileOrTablet ? "40px" : "50px",
                                                    height: isMobileOrTablet ? "40px" : "50px", 
                                                }}
                                                onClick={handleOpenProfileDrawer}

                                                
                                            >
                                            {participant?.username?.charAt(0).toUpperCase() || participant?.user?.username?.charAt(0).toUpperCase() || "?"}
                                            </Avatar>
                                        )}

                                        
                                        
                                      
                                     
            
                                        <Box
                                            sx={{
                                                position: "absolute",
                                                bottom: "4px",
                                                right: "-2px",
                                                width: "14px",
                                                height: "14px",
                                                backgroundColor: "#34C759",
                                                borderRadius: "50%",
                                                border: "1px solid #fff",
                                            }}
                                        >
            
                                        </Box>

                                     
            
                                    
                                                    </Box>

                                                   ) : (
                                                    participant?.user_photo ? (
                                                    <Avatar 
                                                        src={`${api}/${participant.user_photo || participant.user?.user_photo}`} 
                                                        alt={participant.username} 
                                                        sx={{
                                                            width: isMobileOrTablet ? "40px" : "50px",
                                                            height: isMobileOrTablet ? "40px" : "50px",
                                                            background: "#D9D9D9",
                                                        }} 
                                                        onClick={handleOpenProfileDrawer}

                                                    />
                                        ) : (
                                            <Avatar 
                                                sx={{  
                                                    width: isMobileOrTablet ? "40px" : "50px",
                                                    height: isMobileOrTablet ? "40px" : "50px", 
                                                }}
                                                onClick={handleOpenProfileDrawer}

                                                
                                            >
                                            {participant?.username?.charAt(0).toUpperCase() || participant?.user?.username?.charAt(0).toUpperCase() || "?"}
                                            </Avatar>
                                        )
                                                    // <Avatar
                                                    //     src={`${api}/${participant.user_photo}`}
                                                    //     alt={participant.username[0] || "username"}
                                                    //     sx={{
                                                    //     width: "50px",
                                                    //     height: "50px",
                                                    //     background: "#D9D9D9",
                                                    //     }}
                                                    // />
                                                   )}

                                                 

                                                   
                                                    
                                                    <Box sx={{ width: "100%", paddingLeft: "20px" }}>
                                                        <Box
                                                        sx={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                        }}
                                                        >
                                                        <Box sx={{ display: "flex", alignItems: "center" }}>
                                                            <Typography
                                                            sx={{
                                                                width: isMobileOrTablet ? "200px" : "100px",
                                                                fontSize: "16px",
                                                                fontWeight: "400",
                                                                color: "#000000",
                                                                overflow: "hidden",
                                                                whiteSpace: "nowrap",
                                                                textOverflow: "ellipsis",
                                                            }}
                                                            >
                                                            {participant.username}
                                                            
                                                            </Typography>
                                                            {ownerAdminIds.has(participant.user_code) && (
                                                                <Typography
                                                                component="span"
                                                                sx={{
                                                                    fontSize: "12px",
                                                                    color: "#808080",
                                                                    marginLeft: "8px",
                                                                }}
                                                                >
                                                                Admin
                                                                </Typography>
                                                            )}

                                                        
                                                        </Box>

                                                        

                                                        <Dialog open={dialogOpen} onClose={handleDialogClearClose}>
                                                            <DialogTitle>{"Are you sure you want to remove this participant?"}</DialogTitle>
                                                            <DialogActions>
                                                            <Button onClick={handleDialogClearClose} color="primary">
                                                                Cancel
                                                            </Button>
                                                            <Button onClick={handleConfirmRemove} color="secondary" autoFocus>
                                                                Yes
                                                            </Button>
                                                            </DialogActions>
                                                        </Dialog>
                                                        </Box>
                                                        <Typography
                                                        sx={{
                                                            marginTop: "8px",
                                                            fontSize: "12px",
                                                            fontWeight: "400",
                                                            color: "#A8A8A8",
                                                        }}
                                                        >
                                                        {participant.position}, {participant.department_name} 
                                                        </Typography>
                                                    </Box>
                                                    <Menu
                                                        open={contextMenu !== null}
                                                        onClose={handleClose}
                                                        anchorReference="anchorPosition"
                                                        anchorPosition={
                                                            contextMenu !== null
                                                                ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                                                                : undefined
                                                        }
                                                        slotProps={{
                                                            paper: {
                                                                elevation: 0, // Remove shadow
                                                                sx: {
                                                                    boxShadow: 'none', // No shadow
                                                                    border: '1px solid #ddd', // Optional: cleaner look with border
                                                                },
                                                            },
                                                        }}
                                                    >
                                                        {/* Show "Leave Chat" if the participant is the current user */}
                                                        {selectedParticipantId === authUser.user_code && (
                                                            <MenuItem
                                                                onClick={() => {
                                                                    handleClickLeaveOpen(selectedParticipantId);
                                                                }}
                                                            >
                                                                Leave Chat
                                                            </MenuItem>
                                                        )}

                                                        {/* Show "Remove Participant" if authUser is an admin and participant is not an admin */}
                                                        {selectedParticipantId !== authUser.user_code &&
                                                            ownerAdminIds.has(authUser.user_code) &&
                                                            !ownerAdminIds.has(selectedParticipantId) && [
                                                                <MenuItem
                                                                    key="remove-participant"
                                                                    onClick={() => {
                                                                        handleClickOpen(selectedParticipantId);
                                                                    }}
                                                                >
                                                                    Remove Participant
                                                                </MenuItem>,
                                                                <MenuItem
                                                                    key="give-admin"
                                                                    onClick={() => {
                                                                        handleGiveAdmin(selectedParticipantId);
                                                                    }}
                                                                >
                                                                    Give Admin
                                                                </MenuItem>,
                                                        ]}

                                                    </Menu>

                                                    <Dialog open={leaveDialogOpen} onClose={handleLeaveDialogClearClose}>
                                                            <DialogTitle>{"Are you sure you want to leave from this chat?"}</DialogTitle>
                                                            <DialogActions>
                                                            <Button onClick={handleLeaveDialogClearClose} color="primary">
                                                                Cancel
                                                            </Button>
                                                            <Button onClick={handleLeaveChat} color="secondary" autoFocus>
                                                                Yes
                                                            </Button>
                                                            </DialogActions>
                                                    </Dialog>


                                                </Box>
                                               )
                                            })}

                                        </Box>
                                        
                                        </Box>

                                        
                                
                                    </Box>
                                )}

                            
                                {sharedMedias.length > 0 && (
                                    <Box
                                        sx={{
                                            marginTop: "32px",
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                            }}
                                        >
                                            <Typography
                                                sx={{
                                                    fontSize: "14px",
                                                    fontWeight: "400",
                                                    color: "#121660"
                                                }}
                                            >
                                                Media
                                            </Typography>
                                            <Button
                                                onClick={() => setCurrentView('media')}
                                                sx={{
                                                    fontSize: "12px",
                                                    fontWeight: "400",
                                                    color: "#8E8E93",
                                                    textTransform: "none",
                                                    "&:hover": {
                                                        background: "transparent"
                                                    }
                                                }}
                                            >
                                                See All
                                            </Button>
                                        </Box>
                
                                        <Box
                                            sx={{
                                                marginTop: "16px",
                                                // height: "210px",
                                                marginBottom: "20px",
                                                // border: "1px solid",
                                            }}
                                        >
                                            {isMobileOrTablet ? (
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        gap: "10%",
                                                    }}
                                                >
                                                    <img
                                                        style={{
                                                            width: "25%",
                                                            height: "100px",
                                                        }}
                                                        onClick={() => openFullscreen(sharedMedias[0]?.decryptedUrl)}
        
                                                        src={sharedMedias[0]?.media_type === "gif" ? sharedMedias[0]?.decryptedUrl : sharedMedias[0]?.decryptedUrl} 
                                                    />
                                                    <img
                                                        style={{
                                                            width: "25%",
                                                            height: "100px",
                                                        }}
                                                        onClick={() => openFullscreen(sharedMedias[1]?.decryptedUrl)}
        
                                                        src={sharedMedias[1]?.media_type === "gif" ? sharedMedias[1]?.decryptedUrl : sharedMedias[1]?.decryptedUrl} 
                                                    />
                                                    <img
                                                        style={{
                                                            width: "25%",
                                                            height: "100px",
                                                        }}
                                                        onClick={() => openFullscreen(sharedMedias[2]?.decryptedUrl)}
        
                                                        src={sharedMedias[2] ? (sharedMedias[2]?.media_type === "gif" ? sharedMedias[2]?.decryptedUrl : sharedMedias[2]?.decryptedUrl) : ""} 
                                                    />
    {fullscreenImage && (
                                                                                <div
                                                                                    onClick={closeFullscreen}
                                                                                    style={{
                                                                                        position: 'fixed',
                                                                                        top: 0,
                                                                                        left: 0,
                                                                                        width: '100%',
                                                                                        height: '100%',
                                                                                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        justifyContent: 'center',
                                                                                        zIndex: 1500, // Ensures the overlay is above other content
                                                                                        cursor: 'zoom-out', // Indicates that clicking will zoom out
                                                                                    }}
                                                                                >
                                                                                    <img
                                                                                        src={fullscreenImage}
                                                                                        alt="Full-size"
                                                                                        style={{
                                                                                            maxWidth: '90%',
                                                                                            maxHeight: '90%',
                                                                                            borderRadius: '8px',
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                )}
                                                    
                                                </Box>
                                            ) : (
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        gap: "10px",
                                                        flexWrap: "wrap",
                                                    }}
                                                    >
                                                    {latestMedias.map((media, index) => (
                                                        <Box
                                                        key={index}
                                                        sx={{
                                                            flex: "1 1 calc(33.33% - 10px)", // 3 items per row with gap
                                                            maxWidth: "calc(33.33% - 10px)",
                                                            aspectRatio: "1 / 1", // keep square shape
                                                            overflow: "hidden",
                                                        }}
                                                        >
                                                        <img
                                                            style={{
                                                            width: "100%",
                                                            height: "100%",
                                                            objectFit: "cover",
                                                            cursor: "pointer",
                                                            }}
                                                            onClick={() =>
                                                            openFullscreen(
                                                                media.media_type === "gif"
                                                                ? media.decryptedUrl
                                                                : media.decryptedUrl
                                                            )
                                                            }
                                                            src={
                                                            media.media_type === "gif"
                                                                ? media.decryptedUrl
                                                                : media.decryptedUrl
                                                            }
                                                        />
                                                        </Box>
                                                    ))}
                                                </Box>
                                            )}

                                        </Box>
                
                                    
                                    </Box>
                                )} 
            
                                {sharedFiles.length > 0 && (
                                    <Box
                                        sx={{
                                            marginTop: "24px",
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                            }}
                                        >
                                            <Typography
                                                sx={{
                                                    fontSize: "14px",
                                                    fontWeight: "400",
                                                    color: "#121660"
                                                }}
                                            >
                                                Shared Files
                                            </Typography>
                                            <Button
                                                onClick={() => setCurrentView('files')}
                                                sx={{
                                                    fontSize: "12px",
                                                    fontWeight: "400",
                                                    color: "#8E8E93",
                                                    textTransform: "none",
                                                    "&:hover": {
                                                        background: "transparent"
                                                    }
                                                }}
                                            >
                                                See All
                                            </Button>
                                        </Box>
                
                                        <Box
                                            sx={{
                                                marginTop: "16px",
                                                height: "220px"
                                            }}
                                        >
                                            {sharedFiles.map(file => (
                                                <Box
                                                    key={file.id}
                                                    sx={{
                                                        display: "flex",
                                                        paddingRight: "4px",
                                                        paddingLeft: "4px",
                                                        alignItems: "center",
                                                        gap: "8px",
                                                        width: "252px",
                                                        marginBottom: "16px",
                                                        // border: "1px solid",
                                                    }}
                                                     onMouseEnter={() => handleMouseFileEnter(file.id)}
                                                    onMouseLeave={handleMouseFileLeave}
                                                >
                                                    <InsertDriveFileIcon />
                                                    <Box>
                                                        <Typography
                                                            sx={{
                                                                width: "200px",
                                                                fontSize: "16px",
                                                                fontWeight: "400",
                                                                color: "#000000",
                                                                overflow: "hidden",
                                                                whiteSpace: "nowrap",
                                                                textOverflow: "ellipsis",
                                                            }}
                                                        >
                                                        
                                                            {/* {file.media_url.split('/').pop()} */}
                                                            {/* {file.media_url.split('/').pop().split('_').slice(1).join('_')} */}
                                                            {file.media_url.split('/').pop().replace('.enc', '')}



                                                        </Typography>
                                                        <Typography
                                                            sx={{
                                                                marginTop: "8px",
                                                                fontSize: "12px",
                                                                fontWeight: "400",
                                                                color: "#A8A8A8",
                                                            }}
                                                        >
                                                            {formatDate(file.createdAt || file.created_at)}
                                                        </Typography>
                                                    </Box>
                                                     { hoveredFileId === file.id && (
                                                    <>

                                                     {!downloadedMessages.includes(file.id) && (
                                                                                                                          <a
                                                                                                                             
                                                                                                                              style={{ marginLeft: 'auto', textDecoration: 'none' }}
                                                                                                                             
                                                                                                                              aria-label={`Download ${file.media_url.split('/').pop().split('_').slice(1).join('_')}`}
                                                                                                                          >
                                                                                                                               <IconButton
                                                    aria-label="download file"
                                                    onClick={() => handleFileDownload(file, file.chat_id)}
                                                  >
                                                    <FileDownloadIcon />
                                                  </IconButton>
                                                                                                                          </a>
                                                                                                                      )}
                                                        {/* <IconButton
                                                            onClick={() => downloadFile(file)}
                                                        >
                                                            <FileDownloadIcon />
                                                        </IconButton> */}

                                                        
                                                    </>
                                                )}
                                                </Box>
                                            ))}
                                        </Box>
                    
                                    </Box>
                                )}

                                {chat?.is_group_chat && chat.participants?.some(
                                    (participant) =>
                                        participant.id === userId && participant.ChatParticipants?.left_at === null
                                ) && (
                                    <Button onClick={() => handleLeaveChat(chat.id)}>
                                        <Typography>Leave Chat</Typography>
                                    </Button>
                                )}

                                





                                
        </Box>  
    );
}