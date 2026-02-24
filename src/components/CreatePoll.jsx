import { Dialog, DialogTitle, TextField, Button, Box } from "@mui/material";
import { useState } from "react";

export default function CreatePoll({ open, onClose, onCreate }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const handleAddOption = () => setOptions([...options, ""]);
  const handleChangeOption = (i, val) => {
    const copy = [...options];
    copy[i] = val;
    setOptions(copy);
  };

  const handleSubmit = () => {
    onCreate({ question, options });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Create Poll</DialogTitle>
      <Box p={2}>
        <TextField
          fullWidth
          label="Question"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          margin="dense"
        />
        {options.map((opt, i) => (
          <TextField
            key={i}
            fullWidth
            label={`Option ${i + 1}`}
            value={opt}
            onChange={e => handleChangeOption(i, e.target.value)}
            margin="dense"
          />
        ))}
        <Button onClick={handleAddOption}>+ Add Option</Button>
        <Button variant="contained" onClick={handleSubmit} sx={{ mt: 2 }}>
          Create
        </Button>
      </Box>
    </Dialog>
  );
}
