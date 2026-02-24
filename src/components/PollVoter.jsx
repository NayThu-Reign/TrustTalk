import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
} from "@mui/material";

export default function PollVoter({ open, setOpen, voters, loading }) {
  const api = import.meta.env.VITE_API_URL;
  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
      <DialogTitle>Voted by</DialogTitle>
      <DialogContent>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : (
          <List>
            {voters?.length === 0 && <Typography>No voters yet</Typography>}
            {voters.map((user) => (
              <ListItem key={user.user_code}>
                <ListItemAvatar>
                  <Avatar src={`${api}/${user?.user_photo}`} alt={user?.user_name}>
                     {!user?.user_photo &&
                        user?.username
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                      }
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={user.username} />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}
