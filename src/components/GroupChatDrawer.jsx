import { 
    Avatar,
    Box,
    Button,
    Drawer,
    IconButton,
    Modal,
    TextField,
    Typography,
    Radio,
    Checkbox,
    useMediaQuery,
    CircularProgress,
    Card,
    CardHeader,
    CardContent,
    CardActions,
    InputAdornment,
    Grid,
    Grid2

} from "@mui/material";

import {
    RadioButtonChecked as RadioButtonCheckedIcon,
    RadioButtonUnchecked as RadioButtonUncheckedIcon,
    Close as CloseIcon,
    Search as SearchIcon,
} from "@mui/icons-material"
import { useEffect, useRef, useState } from "react";


import { useAuth } from "../providers/AuthProvider";

import { useChats } from "../providers/ChatsProvider";


export default function GroupChatDrawer({ openGroupChatDrawer, closeGroupChatDrawer }) {


    const [activeIndex, setActiveIndex] = useState(-1);
    const { authUser } = useAuth();
    const nameRef = useRef();
    const userNameRef = useRef();
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [ departments, setDepartments ] = useState([]);
    const [ selectedParticipants, setSelectedParticipants ] = useState([]);
    const api = import.meta.env.VITE_API_URL;
    const isMobileOrTablet = useMediaQuery("(max-width: 950px)");
    const token = localStorage.getItem('token');
    const { users } = useChats();
    const [ name, setName ] = useState('');

    const isCreateDisabled = name.trim().length === 0 || selectedParticipants.length === 0;
    // const token = Cookies.get('auth_tokens')

    // const handleUserSearch = (event) => {
    //     const { value } = event.target;
    //     setSearchTerm(value);
    
    //     if (value) {
    //         const lowercasedValue = value.toLowerCase();
    
    //         // Filter users by username or departmentName
    //         const usersByNameOrDepartment = users.filter(user =>
    //             user.username.toLowerCase().includes(lowercasedValue) ||
    //             user.department_name.toLowerCase().includes(lowercasedValue)
    //         );
    
    //         // Exclude the authenticated user and ensure unique results
    //         const uniqueUsers = usersByNameOrDepartment
    //             .filter(user => user.user_code !== authUser.user_code)
    //             .reduce((acc, user) => {
    //                 if (!acc.some(u => u.user_code === user.user_code)) {
    //                     acc.push(user);
    //                 }
    //                 return acc;
    //             }, []);
    
    //         setFilteredUsers(uniqueUsers);
    //     } else {
    //         setFilteredUsers([]);
    //     }
    // };

    // const handleUserSearch = (event) => {
    //   setSearchTerm(event.target.value);
    // };

    const handleUserSearch = (event) => {
  const value = event.target.value;
  setSearchTerm(value);

  if (value.trim()) {
    const lowercasedValue = value.toLowerCase();
    const matches = users.filter(
      (u) =>
        u.user_code !== authUser.user_code &&
        u.username.toLowerCase().includes(lowercasedValue)
    );
    setFilteredUsers(matches);
  } else {
    setFilteredUsers([]);
  }
};


  const handleKeyDown = (e) => {
  if (!filteredUsers.length) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    setActiveIndex((prev) =>
      prev < filteredUsers.length - 1 ? prev + 1 : 0
    );
  }

  if (e.key === "ArrowUp") {
    e.preventDefault();
    setActiveIndex((prev) =>
      prev > 0 ? prev - 1 : filteredUsers.length - 1
    );
  }

  if (e.key === "Enter") {
    e.preventDefault();
    const selected = filteredUsers[activeIndex] || filteredUsers[0];
    if (selected) {
      addParticipant(selected);
    }
  }
  };


  const addParticipant = (user) => {
    setSelectedParticipants((prev) => {
      if (prev.some((p) => p.user_code === user.user_code)) return prev;
      return [...prev, user];
    });

    setSearchTerm("");
    setFilteredUsers([]);
    setActiveIndex(-1);
  };


    
    const handleSelectParticipant = (user) => {
        setSelectedParticipants((prevSelectedParticipants) => {
            if (prevSelectedParticipants.some(participant => participant.user_code === user.user_code)) {
                // If user is already selected, remove them
                return prevSelectedParticipants.filter(participant => participant.user_code !== user.user_code);
            } else {
                // If user is not selected, add them
                return [...prevSelectedParticipants, user];
            }
        });
    };

    const removeSelectedParticipant = (user) => {
        setSelectedParticipants((prevSelectedParticipants) => {
          return prevSelectedParticipants.filter(parti => parti.user_code !== user.user_code);
        })
    }

    useEffect(() => {
      setActiveIndex(-1);
    }, [filteredUsers]);

    const createChat = async (event) => {
        event.preventDefault(); // Prevent default if called with an event
        const participantIds = selectedParticipants.map(participant => participant.user_code);

        const name = nameRef.current.value;
       
       

        try {
            // const token = localStorage.getItem(`token`);
            const api = import.meta.env.VITE_API_URL;
            const response = await fetch(`${api}/api/chats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    isGroupChat: true,
                    participantIds,
                    
                })
            });

            console.log("Response", response);
           
            
            if(response) {

                console.log('successfully created a chat')
                setSelectedParticipants([]);
                setSearchTerm('');
                nameRef.current.value="";
                setFilteredUsers([]);
                closeGroupChatDrawer();

                
                    
                //     console.log('Emitting newMessage event with:', response);
                // // socket.emit('sendMessage', savedMessage);    // Emit the saved message, not the original one
                // // console.log("Hi", savedMessage);
                // socket.emit('newMessage', response);

                // textContentRef.current.value="";
                // setMediaType(null);
                // setMediaUrl(null);
                // setSelectedFile(null); // Clear the file after sending the message
                
                // if(repliedMessage) {
                //     setRepliedMessage(null)
                // }

                // if(currentUserId) {
                //     setCurrentChatId(response.chat_id);
                //     fetchChat();
                //     setCurrentUserId(null);
                    
                // } else {
                //     setChat((prev) => ({
                //         ...prev,
                //         messages: [
                //             ...(prev.messages || []), // Spread the existing messages array (or use an empty array if undefined)
                //             response             // Add the new message to the end
                //         ]
                //     }));
                //     // textContentRef.current.value="";
                //     // setMediaType(null);
                //     // setMediaUrl(null);
                //     // setSelectedFile(null); // Clear the file after sending the message
                // }
                // // setMessages(prevMessages => [...prevMessages, savedMessage]);  // Update state with the full message
               
                

            } else {
                throw new Error('Failed to send message');
            }
            
        } catch (error) {
            console.error(error);
            // Handle error appropriately

        }
    };

    if(!users) {
        return (
            <Box><CircularProgress /></Box>
        )
    }


    return (
        <Modal
            open={openGroupChatDrawer}
            onClose={closeGroupChatDrawer}
            sx={{
                background: 'background.paper',
            }}
        >
            <Card
  sx={{
    width: isMobileOrTablet ? "100%" : "800px",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    height: "450px",
    overflowY: "auto",
    borderRadius: "12px",
    // boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
  }}
>
  {/* Header */}
  <CardHeader
    avatar={
      <Avatar
        sx={{
          width: "40px",
          height: "40px",
          background: "#A8A8A8",
          fontSize: "20px",
          fontWeight: "600",
          color: "#FFFFFF",
        }}
      >
        G
      </Avatar>
    }
    title={
      <Typography
        sx={{
          fontSize: "18px",
          fontWeight: "600",
          color: "#121660",
        }}
      >
        Create a Group
      </Typography>
    }
    action={
      <IconButton onClick={closeGroupChatDrawer}>
        <CloseIcon sx={{ fontSize: "30px", color: "#FF3B30" }} />
      </IconButton>
    }
    sx={{
      borderBottom: "1px solid #ccc",
      px: 3,
      py: 2,
    }}
  />

  {/* Content */}
  <CardContent 
    sx={{ 
        px: 3,
        borderBottom: "1px solid #ccc",
        background: "#fdfdfdff",
        // borderBottom: "1px solid #ccc",


    }}
   >
    {/* Group Name */}
    <Box sx={{  }}>
      <Typography sx={{ fontSize: "15px", fontWeight: 400, color: "#121660" }}>
        Group name
      </Typography>
      <TextField
        fullWidth
        type="text"
        placeholder="e.g., SWD Team"
       
        onChange={(e) => setName(e.target.value)}
        value={name}
        sx={{
        //   mt: 1,
          mb: 1,
          backgroundColor: "white",
          '& .MuiOutlinedInput-root': {
                borderRadius: "15px",
                '&.Mui-focused fieldset': {
                    // borderColor: "black",
                },
            },
        }}

        inputRef={nameRef}
         slotProps={{
          htmlInput: { maxLength: 100 },
        }}
      />
      <Box
        sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
        }}
      >
        <Typography sx={{ fontSize: "15px",color: "#a8a8a8" }}>
            Give your group a clear, searchable name.
        </Typography>
        <Typography>
          {name.length}/100
        </Typography>

      </Box>

    </Box>

   
    <Box sx={{ mt: 3 }}>
      <Typography sx={{ fontSize: "15px", fontWeight: 400, color: "#121660" }}>
        Add Participants
      </Typography>

      <Box sx={{ mt: 1 }}>
        {/* Added Members */}
        <Box sx={{ display: "flex", alignItems: "center", gap: "16px" }}>
          

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "18px",
              flexWrap: "wrap",
            }}
          >
            {selectedParticipants?.length > 0 &&
              selectedParticipants.map((participant) => (
                <Box
                  key={participant.user_code}
                  sx={{
                    px: 2,
                    py: 1,
                    border: "1px solid #E5E5EA",
                    borderRadius: "100px",
                    display: "flex",
                    alignItems: "center",
                    gap: "24px",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Avatar
                      src={`${api}/${participant?.user_photo}`}
                      sx={{ width: "24px", height: "24px" }}
                    />
                    <Typography sx={{ fontSize: "12px", fontWeight: "500" }}>
                      {participant.username}
                    </Typography>
                  </Box>
                  <IconButton
                    sx={{ border: "0.5px solid #E5E5EA" }}
                    onClick={() => removeSelectedParticipant(participant)}
                  >
                    <CloseIcon sx={{ fontSize: "10px", color: "#FF3B30" }} />
                  </IconButton>
                </Box>
              ))}
          </Box>
        </Box>

        {/* Search Users */}
        <Box
          sx={{
            mt: 2,
            borderRadius: "8px",
            // border: "0.5px solid #C6C6C8",
            // p: 2,
          }}
        >

        
            

          <TextField
            fullWidth
            
            type="text"
            placeholder="Type a name then press Enter..."
            value={searchTerm}
            onChange={handleUserSearch}
            onKeyDown={handleKeyDown}   
            inputRef={userNameRef}  
            
            sx={{ 
                mb: 1,
                '& .MuiOutlinedInput-root': {
                    borderRadius: "15px",
                    '&.Mui-focused fieldset': {
                        // borderColor: "black",
                    },
            },

             }}
            slotProps={{
                input: {
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon sx={{ color: "#A8A8A8" }} />
                        </InputAdornment>
                    ),
                },
            }}
          />

            {filteredUsers.length > 0 && (
  <Box sx={{ mb: 1, border: "1px solid #E5E5EA", borderRadius: "8px", maxHeight: "150px", overflowY: "auto" }}>
    {filteredUsers.map((user,index) => (
      <Box
        key={user.user_code}
        onClick={() => addParticipant(user)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          px: 2,
          py: 1,
          cursor: "pointer",
          backgroundColor: activeIndex === index ? "#e6f0ff" : "transparent",
          "&:hover": { backgroundColor: "#f0f0f0" },
        }}
      >
        <Avatar src={`${api}/${user.user_photo}`} sx={{ width: 24, height: 24 }} />
        <Typography sx={{ fontSize: "14px" }}>{user.username}</Typography>
      </Box>
    ))}
  </Box>
)}

            {filteredUsers.length === 0 && (
              <Typography sx={{ fontSize: "15px", color: "#a8a8a8"}}>
                Tip: press Enter to add, Backspace on empty to remove last.
              </Typography>
            )}

         

        



        </Box>
      </Box>
    </Box>
  </CardContent>

  {/* Actions */}
  <CardActions sx={{ justifyContent: "flex-end", px: 3, pt: 3 }}>
    <Button
      onClick={closeGroupChatDrawer}
      variant="outlined"
      sx={{ fontSize: "14px", color: "#FF3B30", textTransform: "none", background: "transparent", border: "1px solid #ccc", borderRadius: "10px" }}
    >
      Cancel
    </Button>
    <Button
      onClick={createChat}
      variant="contained"
      disabled={isCreateDisabled} 
      sx={{
        fontSize: "14px",
        background: "#121660",
        color: "#DEF2FF",
        textTransform: "none",
        borderRadius: "10px",
      }}
    >
      Create Group
    </Button>
  </CardActions>
</Card>
        </Modal>
    )
}