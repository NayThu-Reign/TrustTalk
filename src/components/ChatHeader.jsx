
import {
  Avatar,
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";

import {
  InsertDriveFile as InsertDriveFileIcon,
  Close as CloseIcon,
  FileDownload as FileDownloadIcon,
  ArrowBackIos as ArrowBackIosIcon,
  FileOpen as FileOpenIcon,
  Chat as ChatIcon,
  EmojiEmotionsOutlined as EmojiEmotionsOutlinedIcon,
  ArrowDownward as ArrowDownwardIcon,
  Search as SearchIcon,
  SearchRounded as SearchRoundedIcon,
} from "@mui/icons-material";

import React, {
  useState,
  useEffect,
  useRef,
  lazy,
  Suspense,
  useMemo,
  useCallback,
  startTransition,
} from "react";

const ProfileDrawer = lazy(() => import("./ProfileDrawer"));


export default function ChatHeader({
    chat,
    isActive,
    recipient,
    handleOpenProfileDrawer,
    profileDrawerOpen,
    handleCloseProfileDrawer,
    isChatInfoOpen,
    fullscreenImage,
    closeFullscreen,
    openFullscreen,
    isMobileOrTablet,
    updateUIState,
    type,
    id,
    user,
    searchOpen,
    handleSearchOpen,
    api,
    TimeAgo,
    
}) {
    return (
        <Box
                  sx={{
                    // position: "sticky", // Make the header sticky
                    top: 0, // Stick to the top
                    zIndex: 1015, // Ensure it stays above other elements
                    backgroundColor: "#FFFFFF", // Background color to overlay content beneath it
                    minWidth: isMobileOrTablet ? "100%" : "320px", // Adjust as needed
                    paddingLeft: isMobileOrTablet ? "18px" : "24px",
                    paddingRight: isMobileOrTablet ? "18px" : "40px",
                    height: "128px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "1px solid #E5E5EA",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center", // This ensures the content is centered horizontally
                      gap: "16px",
                      // height: "64px",
                      // border: "1px solid",
                    }}
                  >
                    {chat &&
                      chat?.is_group_chat === false &&
                      (isActive ? (
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
                              src={`${api}/${recipient?.user_photo}`}
                              alt={recipient?.username || "username"}
                              imgProps={{ width: 64, height: 64 }}
                              onClick={handleOpenProfileDrawer}
                              sx={{
                                width: isMobileOrTablet ? "50px" : "64px",
                                height: isMobileOrTablet ? "50px" : "64px",
                                background: "#D9D9D9",
                              }}
                            ></Avatar>
                          ) : (
                            <Avatar
                              alt={recipient?.username || "username"}
                              onClick={handleOpenProfileDrawer}
                              imgProps={{ width: 64, height: 64 }}
                              sx={{
                                width: isMobileOrTablet ? "50px" : "64px",
                                height: isMobileOrTablet ? "50px" : "64px",
                                background: "#D9D9D9",
                                fontSize: isMobileOrTablet ? "18px" : "24px",
                              }}
                            >
                              {recipient?.username?.[0]?.toUpperCase() || "U"}
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
                          ></Box>
        
                          
                        </Box>
                      ) : (
                        <>
                          {recipient?.user_photo ? (
                            <Avatar
                              src={`${api}/${recipient?.user_photo}`}
                              alt={recipient?.username || "username"}
                              imgProps={{ width: 64, height: 64 }}
                              onClick={handleOpenProfileDrawer}
                              sx={{
                                width: "64px",
                                height: "64px",
                                background: "#D9D9D9",
                              }}
                            ></Avatar>
                          ) : (
                            <Avatar
                              alt={recipient?.username || "username"}
                              onClick={handleOpenProfileDrawer}
                              imgProps={{ width: 64, height: 64 }}
                              sx={{
                                width: "64px",
                                height: "64px",
                                background: "#D9D9D9",
                                fontSize: isMobileOrTablet ? "18px" : "24px",
                              }}
                            >
                              {recipient?.username?.[0]?.toUpperCase() || "U"}
                            </Avatar>
                          )}
                          {profileDrawerOpen && (
                            <Suspense fallback={<div>loading...</div>}>
                              <ProfileDrawer
                                openProfileDrawer={profileDrawerOpen}
                                closeProfileDrawer={handleCloseProfileDrawer}
                                userId={recipient.user_code}
                                recipient={recipient}
                              />
                            </Suspense>
                          )}
                        </>
                      ))}
        
                    {chat &&
                      chat?.is_group_chat &&
                      (chat.photo ? (
                        // Display chat photo if available
                        <>
                          <Avatar
                            src={`${api}/${chat.photo}`}
                            onClick={() => openFullscreen(`${api}/${chat.photo}`)}
                            imgProps={{ width: 64, height: 64 }}
                            alt="group photo"
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
                                position: "fixed",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                backgroundColor: "rgba(0, 0, 0, 0.8)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 1500, // Ensures the overlay is above other content
                                cursor: "zoom-out", // Indicates that clicking will zoom out
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
                        </>
                      ) : (
                        // Display participants' user_photos or fallback merged into one Avatar
                        <Avatar
                          imgProps={{ width: 64, height: 64 }}
                          alt="group photo"
                          sx={{
                            marginTop: "8px",
                            width: "64px",
                            height: "64px",
                            position: "relative",
                            background: "#D9D9D9",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Box
                            sx={{
                              width: "100%",
                              height: "100%",
                              position: "relative",
                            }}
                          >
                            {chat.participants
                              .slice(0, 4)
                              .map((participant, index, array) =>
                                participant?.user_photo ? (
                                  <Box
                                    key={index}
                                    component="img"
                                    src={`${api}/${participant?.user_photo}`}
                                    sx={{
                                      position: "absolute",
                                      width:
                                        array.length === 1
                                          ? "100%"
                                          : array.length === 2
                                            ? "50%"
                                            : "50%",
                                      height:
                                        array.length === 1
                                          ? "100%"
                                          : array.length === 2
                                            ? "100%"
                                            : "50%",
                                      objectFit: "cover",
                                      borderRadius: "50%",
                                      top:
                                        array.length === 1
                                          ? "0%"
                                          : index < 2
                                            ? "0%"
                                            : "50%",
                                      left:
                                        array.length === 1
                                          ? "0%"
                                          : index % 2 === 0
                                            ? "0%"
                                            : "50%",
                                      border: "1px solid #fff", // Border for better visuals
                                    }}
                                  />
                                ) : (
                                  <Box
                                    key={index}
                                    sx={{
                                      position: "absolute",
                                      width:
                                        array.length === 1
                                          ? "100%"
                                          : array.length === 2
                                            ? "50%"
                                            : "50%",
                                      height:
                                        array.length === 1
                                          ? "100%"
                                          : array.length === 2
                                            ? "100%"
                                            : "50%",
                                      display: "flex",
                                      justifyContent: "center",
                                      alignItems: "center",
                                      background: "#BDBDBD",
                                      color: "#fff",
                                      fontSize: array.length === 1 ? "14px" : "10px",
                                      fontWeight: "bold",
                                      borderRadius: "50%",
                                      top:
                                        array.length === 1
                                          ? "0%"
                                          : index < 2
                                            ? "0%"
                                            : "50%",
                                      left:
                                        array.length === 1
                                          ? "0%"
                                          : index % 2 === 0
                                            ? "0%"
                                            : "50%",
                                      border: "1px solid #fff", // Border for better visuals
                                    }}
                                  >
                                    {participant.username.charAt(0).toUpperCase()}
                                  </Box>
                                ),
                              )}
                          </Box>
                        </Avatar>
                      ))}
        
                    {!chat &&
                      user &&
                      (user?.user_photo ? (
                        <Avatar
                          src={`${api}/${user?.user_photo}`}
                          alt={user?.username || "username"}
                          onClick={handleOpenProfileDrawer}
                          imgProps={{ width: 64, height: 64 }}
                          sx={{
                            width: "64px",
                            height: "64px",
                            background: "#D9D9D9",
                          }}
                        ></Avatar>
                      ) : (
                        <Avatar
                          alt={user?.username || "username"}
                          onClick={handleOpenProfileDrawer}
                          imgProps={{ width: 64, height: 64 }}
                          sx={{
                            width: "64px",
                            height: "64px",
                            background: "#D9D9D9",
                          }}
                        >
                          {user?.username?.[0]?.toUpperCase() || "U"}
                        </Avatar>
                      ))}

                      {profileDrawerOpen && (
                            <Suspense fallback={<div>loading...</div>}>
                              <ProfileDrawer
                                openProfileDrawer={profileDrawerOpen}
                                closeProfileDrawer={handleCloseProfileDrawer}
                                userId={user? user.user_code : recipient.user_code}
                                recipient={user ? user : recipient}
                              />
                            </Suspense>
                          )}
        
                    <Box>
                      {chat && chat?.is_group_chat === false && (
                        <Typography
                          sx={{
                            fontSize: isMobileOrTablet ? "14px" : "24px",
                            fontWeight: "500",
                            color: "#000000",
                          }}
                        >
                          {recipient?.username}
                        </Typography>
                      )}
                      {chat && chat?.is_group_chat === true && (
                        <Typography
                          sx={{
                            fontSize: isMobileOrTablet ? "14px" : "24px",
                            fontWeight: "500",
                            color: "#000000",
                          }}
                        >
                          {chat?.name}
                        </Typography>
                      )}
                      {type === "u" && id && (
                        <>
                          <Typography
                            sx={{
                              fontSize: isMobileOrTablet ? "14px" : "24px",
                              fontWeight: "500",
                              color: "#000000",
                            }}
                          >
                            {user?.username}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: "14px",
                              fontWeight: "500",
                              color: "#8E8E93",
                            }}
                          >
                            {`${user?.position}, ${user?.department_name ? user?.department_name : ""}`}
                          </Typography>
                        </>
                      )}
                      {isMobileOrTablet ? (
                        <Box>
                          <Typography
                            sx={{
                              fontSize: "10px",
                              fontWeight: "500",
                              color: "#8E8E93",
                            }}
                          >
                            {recipient ? `${recipient?.position}` : `${user?.position}`}
                          </Typography>
        
                          <Typography
                            sx={{
                              fontSize: "10px",
                              fontWeight: "500",
                              color: "#8E8E93",
                            }}
                          >
                            {recipient && recipient?.department_name
                              ? recipient?.department_name
                              : ""}
                          </Typography>
                        </Box>
                      ) : (
                        chat &&
                        !chat?.is_group_chat && (
                          <Typography
                            sx={{
                              fontSize: "14px",
                              fontWeight: "500",
                              color: "#8E8E93",
                            }}
                          >
                            {recipient
                              ? `${recipient?.position},  ${recipient?.department_name ? recipient?.department_name : ""}`
                              : `${user?.position}, ${user?.department_name ? user?.department_name : ""}`}
                          </Typography>
                        )
                      )}
        
                      {chat &&
                        chat?.is_group_chat === false &&
                        (isActive ? (
                          <Typography
                            sx={{
                              fontSize: isMobileOrTablet ? "10px" : "14px",
                              fontWeight: "400",
                              color: "#A8A8A8",
                            }}
                          >
                            Active now
                          </Typography>
                        ) : (
                          <TimeAgo logoutTime={recipient?.logoutTime} />
                          // <Box></Box>
                        ))}
        
                      {/* {!chat && (
                                        <TimeAgo logoutTime={user.logoutTime}  />
                                    )} */}
                      {chat && chat?.is_group_chat && (
                        <Typography
                          sx={{
                            fontSize: "14px",
                            fontWeight: "400",
                            color: "#A8A8A8",
                          }}
                        >
                          Participants: {chat?.participants?.length}
                        </Typography>
                      )}
                    </Box>
                  </Box>
        
                  {type === "c" && id && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: isMobileOrTablet ? "5px" : "16px",
                      }}
                    >
                      <IconButton onClick={handleSearchOpen}>
                        <SearchRoundedIcon
                          sx={{
                            fontSize: isMobileOrTablet
                              ? "18px"
                              : searchOpen
                                ? "30px"
                                : "26px",
                            color: searchOpen ? "#005E7C" : "#808080",
                          }}
                        />
                      </IconButton>
        
                      
        
                      {isMobileOrTablet ? (
                        <Tooltip title="Chat Info">
                          <IconButton
                            onClick={() => {
                              updateUIState({
                                isChatInfoOpen: !isChatInfoOpen,
                                isSharedFileOpen: false,
                                isMediaOpen: false,
                                isAddGroupOpen: false,
                                isAddParticipantOpen: false,
                              })
                              
                            }}
                            sx={{
                              "&:hover": {
                                background: "transparent",
                              },
                            }}
                          >
                            <ChatIcon sx={{ fontSize: "18px" }} />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Button
                          onClick={() => {
                            updateUIState({
                                isChatInfoOpen: !isChatInfoOpen,
                                isSharedFileOpen: false,
                                isMediaOpen: false,
                                isAddGroupOpen: false,
                                isAddParticipantOpen: false,
                              })
                           
                          }}
                          sx={{
                            fontSize: isMobileOrTablet ? "10px" : "16px",
                            fontWeight: "500",
                            color: isChatInfoOpen ? "#28A745" : "#A8A8A8",
                            textTransform: "none",
                            "&:hover": {
                              background: "transparent",
                            },
                          }}
                        >
                          Chat Info
                        </Button>
                      )}
                    </Box>
                  )}
                </Box>
    )
}