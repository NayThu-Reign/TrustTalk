import { 
    Avatar,
    Box,
    Button,
    IconButton,
    Modal,
    TextField,
    Typography,
    Checkbox

} from "@mui/material";

import {
    RadioButtonChecked as RadioButtonCheckedIcon,
    RadioButtonUnchecked as RadioButtonUncheckedIcon,
    Close as CloseIcon,
    Edit as EditIcon,
    Save as SaveIcon,
} from "@mui/icons-material"
import { useEffect, useRef, useState } from "react";
import { useUIState } from "../providers/UIStateProvider";
import { useFetchWithAuth } from "../hooks/useFetchWithAuth";
import { useAuth } from "../providers/AuthProvider";

export default function GroupPhotoDrawer({ openGroupPhotoDrawer, closeGroupPhotoDrawer, chatId, setChatId }) {

    const { authUser } = useAuth();
    const api = import.meta.env.VITE_API_URL;


    
    const fetchWithAuth = useFetchWithAuth();
    const fileInputRef = useRef();
    const [ photo, setPhoto ] = useState(null);
    const [ chat, setChat ] = useState([]);
    const token = localStorage.getItem('token');
    // const token = Cookies.get('auth_tokens')


    console.log("ChatId", chatId);
    
    // const [ user, setUser ] = useState([]);
    // const [ editName, setEditName ] = useState(false);
    const fetchChat = async () => {
        try {

          const api = import.meta.env.VITE_API_URL;
         

          const result = await fetch(`${api}/api/chats/${chatId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            
          });

        //   if (!res.ok) {
        //     if (res.status === 401) {
        //       throw new Error('Unauthorized: Please login to access chats');
        //     } else {
        //         console.error('Error fetching chats:', res.error);
        //     }
        //   }

          
          
          setChat(result);
          setPhoto(result?.photo);

        } catch (error) {
          console.error(error);
          throw error;
        }
    };

    useEffect(() => {
        fetchChat();
    }, []);

    const handleFileChange = async (e) => {
        if (e.target.files) {
            const fileArray = Array.from(e.target.files);
            
            const filesData = await Promise.all(fileArray.map(async (file) => {
                const fileContent = await readFileContent(file);
                return { file, fileName: file.name, fileContent };
            }));

            console.log("HEII", filesData[0].file.type);
            
           
            const photo = filesData[0].fileContent; // Optional: Preview or use the content elsewhere

            console.log("Photo", photo);

            try {

                const api = import.meta.env.VITE_API_URL;
               
      
                const result = await fetch(`${api}/api/chats/photo-update/${chatId}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    photo: photo,
                  })
                  
                });
      
              //   if (!res.ok) {
              //     if (res.status === 401) {
              //       throw new Error('Unauthorized: Please login to access chats');
              //     } else {
              //         console.error('Error fetching chats:', res.error);
              //     }
              //   }
      
                
                
                if(result) {
                    fetchChat();
                } else {
                    console.log("Something wrong")
                }
      
              } catch (error) {
                console.error(error);
                throw error;
              }
            
        }
    };


    const readFileContent = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                resolve(event.target.result);
            };
            reader.onerror = (error) => {
                reject(error);
            };
            reader.readAsDataURL(file); 
        });
    };

      const triggerFileInput = () => {
        fileInputRef.current.click();
      }


      if(!chat || !chat.username) {
        <Box>Loading...</Box>
      }
      


    return (
        <Modal
            open={openGroupPhotoDrawer}
            onClose={closeGroupPhotoDrawer}
            sx={{
                background: 'background.paper',
            }}
        >
            <Box
                sx={{
                    width: "800px",
                    paddingLeft: "32px",
                    paddingRight: "32px",
                    paddingTop: "24px",
                    paddingBottom: "24px",
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: "#fff",
                    boxShadow: 'none',  // Removes the box shadow
                    border: 'none',      // Removes the border
                    outline: 'none', // Disable the outline to prevent the initial border
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
                            fontSize: "20px",
                            fontWeight: "600",
                            color: "#121660",
                        }}
                    >
                        {userId === authUser.id ? "Your Profile" : "Profile"}
                    </Typography>

                    <IconButton
                        onClick={closeProfileDrawer}
                    >
                        <CloseIcon />
                    </IconButton>

                </Box>

                <Box
                    sx={{
                        marginTop: "40px",
                        display: "flex",
                        alignItems: "center",
                        gap: "16px"
                    }}
                >   
                    <Avatar
                        src={`${api}/${user?.user_photo}`}
                        sx={{
                            width: "64px",
                            height: "64px",
                            background: "#A8A8A8",
                        }}
                    >
                        
                    </Avatar>
                    <Box>
                        <Typography
                            sx={{
                                fontSize: "20px",
                                fontWeight: "500",
                                color: "#000000",
                            }}
                        >
                            {user.username}
                        </Typography>
                        <Typography
                            sx={{
                                marginTop: "4px",
                            }}
                        >
                            {user.position}, {user.department?.name}
                        </Typography>
                    </Box>
                </Box>

                <Box
                    sx={{
                        marginTop: "40px",
                        width: "241px",
                        height: "88px",
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: "16px",
                            fontWeight: "400",
                            color: "#000000",
                        }}
                    >
                        Active Status
                    </Typography>

                    <Box
                        sx={{
                            marginTop: "8px",
                            borderRadius: "8px",
                            border: "0.5px solid #C6C6C8",
                            paddingTop: "16px",
                            paddingBottom: "16px",
                            paddingLeft: "12px",
                            paddingRight: "12px",
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: "16px",
                                fontWeight: "400",
                                color: "#3C3C4399",
                            }}
                        >
                            {user.active === true ? "Active" : "Offline"}
                        </Typography>
                    </Box>
                </Box>

                <Box
                    sx={{
                        marginTop: "40px",

                    }}
                >
                    <Typography
                        sx={{
                            fontSize: "16px",
                            fontWeight: "400",
                            color: "#A8A8A8",
                        }}
                    >
                        Details
                    </Typography>

                    <Box
                        sx={{
                            marginTop: "8px",
                            paddingTop: "16px",
                            paddingBottom: "16px",
                            paddingLeft: "24px",
                            paddingRight: "24px",
                            background: "#F7FBFD",
                        }}
                    >
                        <Box>
                            <Typography
                                sx={{
                                    fontSize: "16px",
                                    fontWeight: "400",
                                    color: "#A8A8A8",
                                }}
                            >
                                Profile Photo
                            </Typography>
                            <Box
                                sx={{
                                    marginTop: "4px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "16px"
                                }}
                            >
                                <Avatar
                                    src={`${api}/${user.user_photo}`}
                                    sx={{
                                        width: "64px",
                                        height: "64px",
                                        background: "#A8A8A8",
                                    }}
                                >

                                </Avatar>
                                {user.id === authUser.id && (
                                    <>
                                        <Button
                                            onClick={triggerFileInput}
                                            sx={{
                                                fontSize: "12px",
                                                fontWeight: "400",
                                                color: "#1D0707",
                                                textTransform: "none",
                                                "&:hover": {
                                                    background: "transparent"
                                                }
                                            }}
                                        >
                                            edit photo
                                        </Button>
                                        <input 
                                            ref={fileInputRef}
                                            type="file" 
                                            style={{ display: 'none'}}
                                            onChange={handleFileChange}
                                
                                        />
                                    </>
                                )}
                            </Box>
                        </Box>

                        <Box
                            sx={{
                                marginTop: "16px",

                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: "16px",
                                        fontWeight: "400",
                                        color: "#A8A8A8",
                                    }}
                                >
                                    Name
                                </Typography>

                                { userId === authUser.id && (
                                     (userId === authUser.id && !editName) ? (
                                        <IconButton
                                            onClick={() => {
                                                setEditName(prev => !prev);
                                            }}
                                        
                                        >
                                            <EditIcon sx={{ fontSize: "20px" }}/>
                                        </IconButton>
                                    ) : (
                                        <IconButton
                                            onClick={handleEdit}
                                        >
                                            <SaveIcon sx={{ fontSize: "20px" }}/>
                                        </IconButton>
                                    )

                                )}


                            </Box>
                            { (editName && userId === authUser.id) ? (
                                <TextField
                                    name="username"
                                    value={user.username || ''}
                                    onChange={handleInputChange}                        
                                    type="text"
                                    sx={{ 
                                        width: "100%",
                                        display: "flex",                        
                                        backgroundColor: 'white',
                                        '& .MuiOutlinedInput-root': {
                                            '&.Mui-focused fieldset': {
                                                borderColor: "black",
                                            },
                                        },
                                        '& .MuiInputBase-input': {
                                            height: '20px', 
                                            padding: '8px',
                                                                        
                                        },

                                        "@media (max-width: 950px)" : {
                                            width: "100%",
                                        }
                                    }}
                                    inputRef={usernameRef}
                                />
                            ) : (
                                <Typography
                                    sx={{
                                        fontSize: "16px",
                                        fontWeight: "400",
                                        color: "#1D0707",
                                    }}
                                >
                                    {user.username}
                                </Typography>

                            )}

                            
                        </Box>

                        <Box
                            sx={{
                                marginTop: "16px",

                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize: "16px",
                                    fontWeight: "400",
                                    color: "#A8A8A8",
                                }}
                            >
                                Position
                            </Typography>
                            <Typography
                                sx={{
                                    fontSize: "16px",
                                    fontWeight: "400",
                                    color: "#1D0707",
                                }}
                            >
                                {user.position}
                            </Typography>
                        </Box>

                        <Box
                            sx={{
                                marginTop: "16px",

                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize: "16px",
                                    fontWeight: "400",
                                    color: "#A8A8A8",
                                }}
                            >
                                Department
                            </Typography>
                            <Typography
                                sx={{
                                    fontSize: "16px",
                                    fontWeight: "400",
                                    color: "#1D0707",
                                }}
                            >
                                {user.department?.name}
                            </Typography>
                        </Box>

                    </Box>
                </Box>
            </Box>
        </Modal>
    )
}