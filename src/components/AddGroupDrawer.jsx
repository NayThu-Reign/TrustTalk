import {
    Avatar,
    Box,
    Button,
    Checkbox,
    IconButton,
    TextField,
    Typography,
    useMediaQuery,
} from "@mui/material"

import {
    ArrowBackIos as ArrowBackIosIcon,
    RadioButtonChecked as RadioButtonCheckedIcon,
    RadioButtonUnchecked as RadioButtonUncheckedIcon,
    Close as CloseIcon,
} from "@mui/icons-material"
import { useEffect, useState } from "react";

import { useAuth } from "../providers/AuthProvider";
import { useChats } from "../providers/ChatsProvider";

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



export default function AddGroupDrawer({ closeAddGroupDrawer, chat, user }) {

    const [searchTerm, setSearchTerm] = useState('');
    const isMobileOrTablet = useMediaQuery("(max-width: 950px)");

    const [filteredGroups, setFilteredGroups] = useState([]);
    // const [ chats, setChats ] = useState([]);
    const [ departments, setDepartments ] = useState([]);
    const [ selectedGroups, setSelectedGroups ] = useState([]);

    const { authUser } = useAuth();
    const api = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('token');
    const { chats, setChats } = useChats();

    // const token = Cookies.get('auth_tokens')


   


   

    const handleGroupSearch = (event) => {
        const { value } = event.target;
        setSearchTerm(value);
        if (value) {


            

            const usersByName = chats.filter(chat =>
                chat?.is_group_chat &&
                chat.name?.toLowerCase().includes(value.toLowerCase())
            );


            

            
            setFilteredGroups(usersByName);
        } else {
            setFilteredGroups([]);
        }
    };

    const handleSelectGroup = (group) => {
        setSelectedGroups((prevSelectedGroups) => {
            if (prevSelectedGroups.some(g => g.id === group.id)) {
                // If user is already selected, remove them
                return prevSelectedGroups.filter(g => g.id !== group.id);
            } else {
                // If user is not selected, add them
                return [...prevSelectedGroups, group];
            }
        });
    };

    const removeSelectedGroup = (group) => {
        setSelectedGroups((prevSelectedGroups) => {
          return prevSelectedGroups.filter(parti => parti.id !== group.id);
        })
    }

    const handleAddGroup = async (event) => {
        event.preventDefault(); // Prevent default if called with an event
        
        const groupIds = selectedGroups.map(group => group.id);

        console.log('user_code', user);
              

        try {
            // const token = localStorage.getItem(`token`);
            const api = import.meta.env.VITE_API_URL;
            const response = await fetch(`${api}/api/users/${user.user_code}/add-to-group`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    chatIds: groupIds
                    
                })
            });

            console.log("Response", response);

            if(response.status === 403) {
                alert('Only Admin can add new user')
            }
           
            
            if(response.status === 201) {

                console.log('successfully added participants into a chat')
               
                closeAddGroupDrawer();
                

            } else {
                throw new Error('Failed to send message');
            }
            
        } catch (error) {
            console.error(error);
            // Handle error appropriately

        }
    };

    return (
        <Box
            sx={{
                width: isMobileOrTablet ? "100%" : "350px",
                paddingTop: "10px",
                // paddingBottom: "10px",
                // paddingRight: "10px",
                paddingLeft: "10px",
                borderLeft: "1px solid #E5E5EA",
                background: "#fff",
                overflowX: "hidden",
                // border: "1px solid",
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
                    onClick={closeAddGroupDrawer}
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
                    Select Groups
                </Typography>

            </Box>

            <Box
                sx={{
                    marginBottom: "20px",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "10px",
                }}
            >
                {selectedGroups?.length > 0 && selectedGroups.map(group => (
                                    <Box
                                        key={group.id}
                                    >     
                                            {group.photo ? (
                                                                  <Avatar src={`${api}/${group.photo}`} alt={group.name || "group photo"} sx={{ width: 38, height: 38 }} />
                                                                ) : (
                                                                  <Avatar sx={{ width: 38, height: 38, position: "relative" }}>
                                                                    <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
                                                                      {group.participants.slice(0, 4).map((participant, index, array) =>
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
                                                                )}                                  
                                    </Box>
                ))}
            </Box>

           <Box
                sx={{
                    paddingLeft: "10px",
                    paddingRight: "10px",
                }}
           >
                <TextField
                    
                    type="text"
                    placeholder="Search Group Chat"
                    value={searchTerm}
                    onChange={handleGroupSearch}
                    sx={{ 
                        width: isMobileOrTablet ? "100%" : "250px",
                        mb: 2,
                        backgroundColor: 'white',
                        '& .MuiOutlinedInput-root': {
                            '&.Mui-focused fieldset': {
                                borderColor: "black",
                            },
                            height: "24px",
                        },
                                                                
                    }}
                                        
                />

                {filteredGroups.length > 0 && (
                                <Box
                                sx={{
                                    marginTop: "24px",
                                    hieght: "300px",
                                    overflowY: "auto",
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: "12px",
                                        fontWeight: "400",
                                        color: "#3C3C4399",
                                    }}
                                >
                                    Search results;
                                </Typography>

                                <Box
                                    sx={{
                                        marginTop: "10px",
                                        display: "flex",
                                        alignItems: "center",
                                        flexWrap: "wrap",
                                        gap: "8px",
                                        flexDirection: "column",
                                    }}
                                >
                                    {filteredGroups.map(group => (
                                        <Box
                                            key={group.id}
                                            sx={{
                                                width: isMobileOrTablet ? "100%" : "200px",
                                                paddingTop: "10px",
                                                paddingBottom: "10px",
                                                paddingLeft: "10px",
                                                paddingRight: "10px",
                                                borderRadius: "8px",
                                                background: "#F7FBFD",
                                                
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between"
                                                }}
                                            >
                                                
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            gap: "10px",
                                                            alignItems: "center",

                                                        }}
                                                    >
                                                       

                                                         {group.photo ? (
                                                                  <Avatar src={`${api}/${group.photo}`} alt={group.name || "group photo"} sx={{ width: 40, height: 40 }} />
                                                                ) : (
                                                                  <Avatar sx={{ width: 40, height: 40, position: "relative" }}>
                                                                    <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
                                                                      {group.participants.slice(0, 4).map((participant, index, array) =>
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
                                                                )}

                                                        <Box>
                                                            <Typography
                                                                sx={{
                                                                    fontSize: "14px",
                                                                    fontWeight: "500",
                                                                    color: "#000000",
                                                                }}
                                                            >
                                                                {group.name}
                                                            </Typography>
                                                           
                                                            
                                                        </Box>
                                                    </Box>
                                                

                                                    {group.participants.some(p => p.user_code === user.user_code) ? (
                                                        <Typography
                                                            sx={{
                                                                color: '#8E8E93',
                                                                fontSize: '12px',
                                                            }}
                                                        >
                                                            participant
                                                        </Typography>
                                                    ) : (
                                                        <Checkbox
                                                            checked={selectedGroups.some(g => g.id === group.id)}
                                                            onChange={() => handleSelectGroup(group)}
                                                            icon={<RadioButtonUncheckedIcon />} // Unchecked state icon
                                                            checkedIcon={<RadioButtonCheckedIcon />} // Checked state icon
                                                            sx={{
                                                                '& .MuiSvgIcon-root': {
                                                                    fontSize: 16,
                                                                    borderRadius: "100px",
                                                                    backgroundColor: "#fff",
                                                                    border: "0.5px solid #000000",
                                                                },
                                                                '&.Mui-checked': {
                                                                    color: '#000', // Color when checked
                                                                }
                                                            }}
                                                        />
                                                    )}
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                            )}



           </Box>

           <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "16px",
                    position: "fixed",
                    bottom: "10px",
                    zIndex: 1000,
                    width: isMobileOrTablet ? "100%" : "300px",
                    paddingLeft: "24px",
                    paddingRight: "24px",
                    background: "white",
                }}
            
            >
                
                    <Button
                        variant="contained"
                        onClick={handleAddGroup}
                        disabled={selectedGroups.length === 0}
                        sx={{
                            fontSize: "14px",
                            fontWeight: "400",
                            color: "#fff",
                            textTransform: "none",

                        }}
                    >
                        Add
                    </Button>

            </Box>

        </Box>
    )
}