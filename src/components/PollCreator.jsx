import { useState } from "react";
import {
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  TextField, Switch, FormControlLabel, Button, Box
} from "@mui/material";
import PollIcon from "@mui/icons-material/Poll";

export default function PollCreator({ chat, recipient }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [quizMode, setQuizMode] = useState(false);
  const api = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('token');

  const handleAddOption = () => setOptions([...options, ""]);

  const handleOptionChange = (i, val) => {
    const copy = [...options];
    copy[i] = val;
    setOptions(copy);
  };

const handleSubmit = async () => {
    if (!question.trim() || options.filter(o => o.trim()).length < 2) return;



    try {
      const payload = {
        chat_id: chat.id,
        isGroupChat: chat.is_group_chat,
        question,
        options: options.filter(o => o.trim()), // only send non-empty
        ...(chat.is_group_chat ? {} : { recipient_id: recipient.user_code }), // only include when not group
        };

        console.log("payload1", payload);

      const response = await fetch(`${api}/api/messages/createPollMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
                withCredentials: true,

        });


  
    const data = await response.json();

      if (data?.status === 1) {
        // onCreate?.(data.newMessage); 
        console.log("Poll created:");
      }
    } catch (err) {
      console.error("Error creating poll:", err);
    }

    setOpen(false);
    setQuestion("");
    setOptions(["", ""]);
    setQuizMode(false);
  };


  return (
    <>
      <Tooltip title="Create Poll">
        <IconButton
          aria-label="create poll"
          onClick={() => setOpen(true)}
          sx={{ "&:hover": { background: "transparent" } }}
        >
          <PollIcon sx={{ color: "#121660"}}/>
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create a poll</DialogTitle>
        <DialogContent>
         

          <TextField
            label="Ask a question"
            fullWidth
            margin="dense"
            value={question}
            onChange={e => setQuestion(e.target.value)}
          />

          {options.map((opt, i) => (
            <TextField
              key={i}
              label={`Option ${i + 1}`}
              fullWidth
              margin="dense"
              value={opt}
              onChange={e => handleOptionChange(i, e.target.value)}
            />
          ))}

          <Button onClick={handleAddOption} sx={{ mt: 1 }}>
            + Add option
          </Button>

          <Box textAlign="right" mt={2}>
            <Button onClick={() => setOpen(false)} sx={{ mr: 1 }}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmit}>
              Create
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
