import { useState,useEffect,lazy,Suspense } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  LinearProgress,
  Box,
  IconButton,
  Divider,
  useMediaQuery,
      Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DoneIcon from "@mui/icons-material/Done";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { useAuth } from "../providers/AuthProvider";

const PollVoter = lazy(() => import("./PollVoter"));


export default function PollDemo({ pollData, chatId=null, isParticipant }) {
  const [poll, setPoll] = useState([]);
    const isMobileOrTablet = useMediaQuery("(max-width: 950px)");
    const { authUser } = useAuth();
    const [ closePollOpen, setClosePollOpen ] = useState(false);
    

    const api = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('token');

  

  const [open, setOpen] = useState(false);
  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(false);


     const handleDialogClose = () => {
        setClosePollOpen(false);
        
    };


  useEffect(() => {
    setPoll(pollData);
  }, [pollData]);


  

  const totalVotes = poll?.PollOptions?.reduce((sum, o) => sum + o.votes_count, 0);



  const handleClosePoll = async() => {

     try {
      const res = await fetch(`${api}/api/polls/${poll.id}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',

          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({chat_id: chatId})
      });
      const data = await res.json();
      if(data.status == 1) {
        setPoll((prev) => ({ ...prev, is_closed: true }));

      }
      
      
    } catch (err) {
      console.error(err);
    }

  };

const handleVote = async (id) => {
  if (poll.isClosed) return;

  try {
    const res = await fetch(`${api}/api/messages/${poll.id}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ option_id: id, chat_id: chatId }),
      credentials: "include", 
    });

    const data = await res.json();

    if (data.status === 1) {
      // setPoll((prev) => {
       
      //   const previouslyVoted = prev.PollOptions.find(opt =>
      //     opt.votes.some(v => v.user_id === authUser.user_code)
      //   );

      //   const updatedOptions = prev.PollOptions.map((opt) => {
         
      //     if (data.action === "unvoted" && opt.id === id) {
      //       return {
      //         ...opt,
      //         votes_count: opt.votes_count - 1,
      //         votes: opt.votes.filter(v => v.user_id !== authUser.user_code)
      //       };
      //     }

         
      //     if (data.action === "changed") {
           
      //       if (opt.id === id) {
      //         return {
      //           ...opt,
      //           votes_count: opt.votes_count + 1,
      //           votes: [...opt.votes, { user_id: authUser.user_code }]
      //         };
      //       }
          
      //       if (previouslyVoted && opt.id === previouslyVoted.id) {
      //         return {
      //           ...opt,
      //           votes_count: opt.votes_count - 1,
      //           votes: opt.votes.filter(v => v.user_id !== authUser.user_code)
      //         };
      //       }
      //     }

         
      //     if (data.action === "voted" && opt.id === id) {
      //       return {
      //         ...opt,
      //         votes_count: opt.votes_count + 1,
      //         votes: [...opt.votes, { user_id: authUser.user_code }]
      //       };
      //     }

      //     return opt;
      //   });

      //   return {
      //     ...prev,
      //     PollOptions: updatedOptions
      //   };
      // });
    }
  } catch (err) {
    console.error("Vote error:", err);
  }
};

 const handleShowVoters = async (optionId) => {
    setOpen(true);
    setLoading(true);
    try {
      const res = await fetch(`${api}/api/polls/options/${optionId}/votes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      
      setVoters(data.users || []);
      console.log("Voters", data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };




  return (
    <Box sx={{ width: isMobileOrTablet ? 200 : "100%", padding: "10px" }}>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
        {poll?.question}
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {poll?.PollOptions
  ?.slice() 
  .sort((a, b) => a.id - b.id) 
  .map((option) => {
    const percentage = totalVotes === 0 ? 0 : ((option.votes_count / totalVotes) * 100).toFixed(0);
    const isVoted = option.votes?.some(v => v.user_id === authUser.user_code);

    return (
       <Box key={option.id} sx={{ mb: 2, cursor: "pointer", }} onClick={() => handleShowVoters(option.id)}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography >{option.text}</Typography>
              {isParticipant && (
                <IconButton size="small" onClick={(e) => {handleVote(option.id); e.stopPropagation();}} disabled={poll.is_closed}>
                  {isVoted ? <FavoriteIcon sx={{ color: "#7f5cff" }} /> : <FavoriteBorderIcon sx={{ color: "#7f5cff" }} />}
                </IconButton>
              )}
            </Box>

            <LinearProgress
              variant="determinate"
              value={parseInt(percentage)}
              sx={{
                height: 6,
                borderRadius: 3,
                mt: 1,
                backgroundColor: "#e0d9ff",
                "& .MuiLinearProgress-bar": { backgroundColor: "#7f5cff" },
              }}
            />

            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
              <Typography variant="caption">{percentage}%</Typography>
              <Typography variant="caption">{option.votes_count}</Typography>
            </Box>
          </Box>
    );
  })}

         
      {(!poll?.is_closed && poll?.owner === authUser.user_code) ? (
        <Box>
          <Button size="small" variant="contained" color="error" onClick={handleClosePoll}>
            Close Poll
          </Button>
          {/* <Dialog 
            open={closePollOpen} 
            onClose={handleDialogClose}
            scroll="paper"
            disableScrollLock
          
          >
              <DialogTitle>{"Close Poll?"}</DialogTitle>

              <DialogContent>
                <DialogContentText>
                  Do you really want to close the poll so that other participants cannot vote anymore?
                </DialogContentText>
              </DialogContent>

              <DialogActions>
                <Button onClick={handleDialogClose} sx={{ color: "#000"}}>
                  Cancel
                </Button>

                <Button onClick={handleClosePoll} autoFocus sx={{ color: "#121660"}}>
                  Yes
                </Button>
                                
            </DialogActions>

          </Dialog> */}

        </Box>
      ) : poll.owner !== authUser.user_code && !poll.is_closed ? (
          <Box></Box>
      ) : (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <DoneIcon color="success" fontSize="small" />
          <Typography sx={{ ml: 1 }}>Poll Closed</Typography>
        </Box>
      )}

      <Suspense fallback={<div>Loading voters...</div>}>
        <PollVoter open={open} setOpen={setOpen} voters={voters} loading={loading} /> 
      </Suspense>
    </Box>
  );
}

