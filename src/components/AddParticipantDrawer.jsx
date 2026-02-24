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
   
} from "@mui/icons-material"
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../providers/AuthProvider";
import { useQuery } from "@tanstack/react-query";


export default function AddParticipantDrawer({ closeAddParticipantDrawer, chat, newParticipants, setNewParticipants }) {

    const [searchTerm, setSearchTerm] = useState('');
    const [filteredUsers, setFilteredUsers] = useState([]);
    // const [ users, setUsers ] = useState([]);
    const [ departments, setDepartments ] = useState([]);
    const [ selectedParticipants, setSelectedParticipants ] = useState([]);
   
    const { authUser } = useAuth();
    // const [ users, setUsers ] = useState([]);
    const api = import.meta.env.VITE_API_URL;
    const isMobileOrTablet = useMediaQuery("(max-width: 950px)");
    const token = localStorage.getItem('token');

    // const token = Cookies.get('auth_tokens')

    const fetchUsers = useCallback(async () => {
            try {
              const token = localStorage.getItem('token');
              const api = import.meta.env.VITE_API_URL;
    
              const response = await fetch(`${api}/api/users`, {
                method: 'GET',
                headers: {
                //   'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
              });
    
              if (!response.ok) {
                throw new Error('Failed to fetch users');
              }
              const data = await response.json();
              console.log("Fetched users:", data);
              return data || [];
            } catch (error) {
              console.error('Error fetching users:', error);
            }
          }, []);
    
          const { data: users, isLoading: isUsersLoading, isError: isUsersError } = useQuery({
            queryKey: ['users'],
            queryFn: fetchUsers,
            staleTime: 1000 * 60 * 5,
          });

    const handleUserSearch = (event) => {
        const { value } = event.target;
        setSearchTerm(value);
    
        if (value) {
            const lowercasedValue = value.toLowerCase();
    
            // Filter users by username or departmentName
            const usersByNameOrDepartment = users.filter(user =>
                user.username.toLowerCase().includes(lowercasedValue) ||
                user.department_name.toLowerCase().includes(lowercasedValue)
            );
    
            // Exclude the authenticated user and ensure unique results
            const uniqueUsers = usersByNameOrDepartment
                .filter(user => user.user_code !== authUser.user_code)
                .reduce((acc, user) => {
                    if (!acc.some(u => u.user_code === user.user_code)) {
                        acc.push(user);
                    }
                    return acc;
                }, []);
    
            setFilteredUsers(uniqueUsers);
        } else {
            setFilteredUsers([]);
        }
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
          return prevSelectedParticipants.filter(parti => parti.id !== user.id);
        })
    }

    const handleAddParticipant = async (event) => {
        event.preventDefault(); // Prevent default if called with an event
        
        const participantIds = selectedParticipants.map(participant => participant.user_code);
              

        try {
            // const token = localStorage.getItem(`token`);
            const api = import.meta.env.VITE_API_URL;
            const response = await fetch(`${api}/api/chats/${chat.id}/add-users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userIds: participantIds
                    
                })
            });

            const data = await response.json();
            console.log("Response", response);
            console.log("Response1", data);
           
            
            if(response.status === 200) {

                console.log('successfully added participants into a chat')
                const { participants } = data;

                setNewParticipants((prev) => [
                    ...(prev || []),
                    ...participants.map((user) => ({
                        joined_at: user.joined_at,
                        username: user.username,
                       
                    })),
                ]);
               
                closeAddParticipantDrawer();


                

            } else if (response.status === 403) {
                alert('Only Admin can add new users')
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
                    onClick={closeAddParticipantDrawer}
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
                    Select Users
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
                {selectedParticipants?.length > 0 && selectedParticipants.map(participant => (
                                    <Box
                                        key={participant.id}
                                    >     

                              
                                                            {participant?.user_photo ? (
                                                                <Avatar src={`${api}/${participant.user_photo || participant.user?.user_photo}`} alt={participant.username || 'username'} sx={{ width: 38, height: 38 }} />
                                                            ) : (
                                                                <Avatar sx={{ width: 32, height: 32 }}>
                                                                {participant?.username?.charAt(0).toUpperCase() || "?"}
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
                    placeholder="Search by username or department..."
                    value={searchTerm}
                    onChange={handleUserSearch}
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

                {filteredUsers.length > 0 && (
                                <Box
                                sx={{
                                    marginTop: "24px",
                                    height: "300px",
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
                                        // width: "600px",
                                        marginTop: "10px",
                                        display: "flex",
                                        alignItems: "center",
                                        flexWrap: "wrap",
                                        gap: "8px",
                                        flexDirection: "column",
                                    }}
                                >
                                    {filteredUsers.map(user => (
                                        <Box
                                            key={user.user_code}
                                            sx={{
                                                width: isMobileOrTablet ? "100%" : "300px",
                                                paddingTop: "10px",
                                                paddingBottom: "10px",
                                                paddingLeft: "10px",
                                                borderRadius: "8px",
                                                background: "#F7FBFD",
                                                paddingRight: "10px",
                                               
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
                                                       <Box>
                                                            {user?.user_photo ? (
                                                                <Avatar src={`${api}/${user.user_photo || user.user?.user_photo}`} alt={user.username || 'username'} sx={{ width: 32, height: 32 }} />
                                                            ) : (
                                                                <Avatar sx={{ width: 32, height: 32 }}>
                                                                {user?.username?.charAt(0).toUpperCase() || "?"}
                                                                </Avatar>
                                                            )}
                                                           
                                                        </Box>

                                                        <Box>
                                                            <Typography
                                                                sx={{
                                                                    fontSize: "14px",
                                                                    fontWeight: "500",
                                                                    color: "#000000",
                                                                }}
                                                            >
                                                                {user.username} 
                                                            </Typography>
                                                            <Typography
                                                                sx={{
                                                                    fontSize: "12px",
                                                                    fontWeight: "500",
                                                                    color: "#8E8E93",
                                                                }}
                                                            >
                                                                {user.position}
                                                            </Typography>
                                                            <Typography
                                                                sx={{
                                                                    fontSize: "12px",
                                                                    fontWeight: "500",
                                                                    color: "#8E8E93",
                                                                }}
                                                            >
                                                                {user.department_name}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                

                                                    {chat.participants.some(participant => participant.user_code === user.user_code) ? (
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
                                                            checked={selectedParticipants.some(participant => participant.user_code === user.user_code)}
                                                            onChange={() => handleSelectParticipant(user)}
                                                            icon={<RadioButtonUncheckedIcon />} // Unchecked state icon
                                                            checkedIcon={<RadioButtonCheckedIcon />} // Checked state icon
                                                            sx={{
                                                                '& .MuiSvgIcon-root': {
                                                                    fontSize: 18,
                                                                    borderRadius: "100px",
                                                                    backgroundColor: "#fff",
                                                                    // border: "0.5px solid #000000",
                                                                },
                                                                '&.Mui-checked': {
                                                                    color: '#28A745', // Color when checked
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
                        onClick={handleAddParticipant}
                        disabled={selectedParticipants.length === 0}
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