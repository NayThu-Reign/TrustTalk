import { Avatar, Box, Button, Checkbox, IconButton, List, ListItem, Modal, Tab, Tabs, TextField, Typography, useMediaQuery } from "@mui/material";
import {
    ArrowBackIos as ArrowBackIosIcon,
    RadioButtonChecked as RadioButtonCheckedIcon,
    RadioButtonUnchecked as RadioButtonUncheckedIcon,
    EmojiEmotionsOutlined as EmojiEmotionsOutlinedIcon,
    ThumbUp as LikeIcon,
    Favorite as LoveIcon,
    SentimentVerySatisfied as HahaIcon,
    SentimentDissatisfied as SadIcon,
    SentimentVeryDissatisfied as AngryIcon
} from "@mui/icons-material"
import { useEffect, useState } from "react";
import { useAuth } from "../providers/AuthProvider";



export default function ReactionsDrawer({ openReactionDrawer, closeReactionDrawer, selectedMessageId, handleMenuClose }) {


    const reactionIcons = {
        like: "👍",
        love: "❤️",
        haha: "😂",
        wow: "😮",
        sad: "😢",
        angry: "😡",
      };

    const [searchTerm, setSearchTerm] = useState('');
    const [ chats, setChats ] = useState([]);
    const [ selectedChats, setSelectedChats ] = useState([]);

    const [filteredChats, setFilteredChats] = useState([]);
    const { authUser } = useAuth();
    const api = import.meta.env.VITE_API_URL;
    const isMobileOrTablet = useMediaQuery("(max-width: 950px)");
    const token = localStorage.getItem(`token`);
    // const token = Cookies.get('auth_tokens')

    const [ reactions, setReactions ] = useState([]);
    const [groupedReactions, setGroupedReactions] = useState({});
  const [activeTab, setActiveTab] = useState("like"); // Default to the first tab



    useEffect(() => {
        const fetchReactions = async () => {
          try {
            const api = import.meta.env.VITE_API_URL;
            const result = await fetch(`${api}/api/reactions/${selectedMessageId}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            });
    
            const data = await result.json();

            console.log("Fetched Reactions Data:", data);
            setReactions(data.reactions);
    
            // Group reactions by type
            // const grouped = data.reactions.reduce((acc, reaction) => {
            //   const { reaction_type, user_name } = reaction;
            //   if (!acc[reaction_type]) {
            //     acc[reaction_type] = [];
            //   }
            //   acc[reaction_type].push(user_name);
            //   return acc;
            // }, {});

            const grouped = data.reactions.reduce((acc, reaction) => {
               const user = {
                  user_id: reaction?.user_id,
                  user_name: reaction?.user_name,
               }
              if (!acc[reaction?.reaction_type]) {
                acc[reaction?.reaction_type] = [];
              }
              acc[reaction?.reaction_type].push(user); // push entire user object
              return acc;
            }, {});
setGroupedReactions(grouped);


            console.log("Grouped Reactions:", grouped);

            // setGroupedReactions(grouped);
          } catch (error) {
            console.error("Error fetching reactions:", error);
          }
        };
    
        fetchReactions();
      }, [selectedMessageId, token]);

      const handleTabChange = (event, newTab) => {
        setActiveTab(newTab);
      };

    // Safely handle reactionCounts
    // const safeReactions = Array.isArray(reactions) ? reactions : [];

    // // Safely handle reactionCounts
    // const reactionCounts = Object.keys(reactionIcons).reduce((acc, type) => {
    //     acc[type] = safeReactions.filter((reaction) => reaction.reaction_type == type).length;
    //     return acc;
    //   }, {});
      
    //   // Safely handle usernamesByReaction
    //   const usernamesByReaction = Object.keys(reactionIcons).reduce((acc, type) => {
    //     acc[type] = safeReactions
    //       .filter((reaction) => reaction.reaction_type == type)
    //       .map((reaction) => reaction.user_name); // Changed from reaction.username to reaction.user_name
    //     return acc;
    //   }, {});
      
      // Check if reactions data is available

      console.log("groupedReactions", groupedReactions)
      if (!reactions) {
        return <Typography>Loading...</Typography>;
      }
      

   

    

    return (
        <Modal
        open={openReactionDrawer}
        onClose={closeReactionDrawer}
        sx={{
            background: 'white', // Adds a translucent overlay for the modal
        }}
    >
        <Box
             sx={{
                width: isMobileOrTablet ? "100%" : "800px",
                // paddingLeft: "32px",
                // paddingRight: "32px",
                // paddingTop: "24px",
                height: "400px",
                overflowY: "auto",
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
                    gap: "8px",
                    // marginBottom: "40px",
                }}
            >
                <IconButton
                    onClick={closeReactionDrawer}
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
                    Reactions
                </Typography>

            </Box>

            <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="reaction tabs"
      >
        {Object.keys(reactionIcons).map((type) => (
          <Tab
            key={type}
            value={type}
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {reactionIcons[type]}
                <Typography>{type}</Typography>
                <Typography>({groupedReactions[type]?.length || 0})</Typography>
              </Box>
            }
          />
        ))}
      </Tabs>

      {/* Users List */}
      <Box sx={{ mt: 3 }}>
        <List>
          {groupedReactions[activeTab]?.length > 0 ? (
            groupedReactions[activeTab].map((user, index) => (
              <ListItem
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  py: 0,
                }}
              >
                 <Avatar
                  src={user?.user_name?.user_photo ? `${api}/${user?.user_name?.user_photo}` : undefined}
                  alt={user?.user_name?.username}
                  sx={{ 
                    mr: 2,
                    width: "30px",
                    height: "30px",
                    fontSize: "18px",
                  }}
                 
                >
                  {user?.user_name?.user_name[0]}
                </Avatar>
                <Typography>{user?.user_name?.user_name}</Typography>
              </ListItem>
            ))
          ) : (
            <Typography variant="body2" sx={{ color: "gray", paddingLeft: "20px" }}>
              No reactions yet.
            </Typography>
          )}
        </List>
      </Box>

          
           

           

        </Box>
    </Modal>
    )
}