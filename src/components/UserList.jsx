import React, { useRef, useState } from "react";
import { FixedSizeList as List } from "react-window";
import { Box, Avatar, Typography, Menu, MenuItem } from "@mui/material";

const getAvatarPositionStyle = (index, total) => ({
    position: "absolute",
    width: total === 1 ? "100%" : "50%",
    height: total === 1 ? "100%" : "50%",
    objectFit: "cover",
    borderRadius: "50%",
    top: total === 1 ? "0%" : index < 2 ? "0%" : "50%",
    left: total === 1 ? "0%" : index % 2 === 0 ? "0%" : "50%",
    border: "1px solid #fff",
});

const getInitialAvatarStyle = (index, total) => ({
    position: "absolute",
    width: total === 1 ? "100%" : "50%",
    height: total === 1 ? "100%" : "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#BDBDBD",
    color: "#fff",
    fontSize: total === 1 ? "14px" : "10px",
    fontWeight: "bold",
    borderRadius: "50%",
    top: total === 1 ? "0%" : index < 2 ? "0%" : "50%",
    left: total === 1 ? "0%" : index % 2 === 0 ? "0%" : "50%",
    border: "1px solid #fff",
});

const highlightText = (text, query) => {
  if (!text) return null;
  const regex = new RegExp(`(${query})`, "gi");
  return text.split(regex).map((part, i) =>
    regex.test(part) ? (
      <span key={i} style={{ backgroundColor: "yellow" }}>{part}</span>
    ) : (
      part
    )
  );
};



const UserListItem = ({ data, index, style }) => {
  const { users, handleUserClick, api,searchTerm } = data;
  const rightClickRef = useRef(false);

  const user = users[index];
  const [ selectedChatId, setSelectedChatId ] = useState(null);
  const [ contextMenu, setContextMenu ] = useState(null);

  const handleClose = () => {
    setContextMenu(null);
    setSelectedChatId(null);
  }

  console.log('Rendering user:', user);

  const handleRightClick = (event, chat) => {
    event.preventDefault();
    event.stopPropagation();
    rightClickRef.current = true;
    setContextMenu(
        contextMenu === null
            ? { mouseX: event.clientX, mouseY: event.clientY }
            : null
    );
    setSelectedChatId(chat); // Store the chat ID for delete action
};

  

  return (
    <div style={style}>
      <Box
        onClick={() => handleUserClick(user)}
        onContextMenu={(e) => handleRightClick(e, user)}

        sx={{
          cursor: "pointer",
          maxHeight: "87px",
          p: "16px 10px 16px 12px",
          display: "flex",
          gap: "10px",
        }}
      >
        {user.user_photo ? (
          <Avatar
          src={`${api}/${user?.user_photo}`}
          alt={user.username || 'photo'}
          sx={{ width: "44px", height: "44px", background: "#D9D9D9" }}
          loading="lazy"
        />
        ) : (user.is_group_chat && user.photo) ? (
          <Avatar
          src={`${api}/${user?.photo}`}
          alt={user.name || 'photo'}
          sx={{ width: "44px", height: "44px", background: "#D9D9D9" }}
          loading="lazy"
          />
        ) : (user.is_group_chat && !user.photo) ? (
          <Avatar sx={{ width: 32, height: 32, position: "relative" }}>
            <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
              {user.participants.slice(0, 4).map((participant, index, array) =>
                participant.user_photo ? (
                  <Box
                    key={index}
                    component="img"
                    src={`${api}/${participant.user_photo}`}
                    alt={participant.username}
                    sx={getAvatarPositionStyle(index, array.length)}
                  />
                ) : (
                  <Box key={index} sx={getInitialAvatarStyle(index, array.length)}>
                    {participant.username?.charAt(0).toUpperCase()}
                  </Box>
                )
              )}
            </Box>
          </Avatar>
        ) : (
          <Avatar sx={{ width: 32, height: 32 }} alt={user.username || 'photo'}>
              {user.username?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || "?"}
          </Avatar>
        )}
        <Box>
  <Typography sx={textStyles}>
    {user.type === "chat"
      ? highlightText(user.name, searchTerm)
      : (user.username || user.name)}
  </Typography>

  {user.type === "chat" && user.highlight === "message" && (
    <Typography sx={subTextStyles}>
      {highlightText(user.matchedMessage, searchTerm)}
    </Typography>
  )}

  {user.type === "chat" && user.highlight === "name" && (
    <Typography sx={subTextStyles}>Group chat</Typography>
  )}

  {user.type === "user" && (
    <>
      <Typography sx={subTextStyles}>{user.position}</Typography>
      <Typography sx={subTextStyles}>{user.department_name}</Typography>
    </>
  )}
</Box>

{contextMenu !== null && ((user.id  == selectedChatId.id) || (user.user_code == selectedChatId.user_code)) && (
        <Menu
          open={true}
          onClose={handleClose}
          anchorReference="anchorPosition"
          anchorPosition={{ top: contextMenu.mouseY, left: contextMenu.mouseX }}
        >
          <MenuItem onClick={(e) => { 
            e.stopPropagation(); 

            
            handleUserClick(selectedChatId, "normal", true)
            

            handleClose();
          }}
          >
            Open Chat
          </MenuItem>
         
        </Menu>
      )}

      </Box>
    </div>
  );
};

const textStyles = {
  fontSize: "16px",
  fontWeight: "400",
  color: "#000",
  width: "80%",
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
};

const subTextStyles = {
  fontSize: "14px",
  fontWeight: "400",
  color: "#3C3C4399",
  width: "80%",
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
};

const UserList = ({ filteredUsers, handleUserClick, api, searchTerm }) => {
  return (
    <Box
      sx={{
        marginTop: "4px",
        background: "#fff",
        borderRadius: "8px",
        height: "300px",
        overflow: "hidden",
      }}
    >
      <List
        height={300} 
        itemCount={filteredUsers.length}
        itemSize={87} 
        width="100%"
        itemData={{ users: filteredUsers, handleUserClick, api, searchTerm }} 
      >
        {UserListItem}
      </List>
    </Box>
  );
};

export default React.memo(UserList);

