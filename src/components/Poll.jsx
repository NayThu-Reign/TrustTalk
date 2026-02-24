import { Card, CardContent, Typography, LinearProgress, Button } from "@mui/material";

export default function Poll({ poll, onVote }) {
  const totalVotes = poll.options.reduce((a, o) => a + o.votes.length, 0);

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6">{poll.question}</Typography>
        {poll.options.map(opt => {
          const count = opt.votes.length;
          const percent = totalVotes ? (count / totalVotes) * 100 : 0;
          return (
            <div key={opt.id} style={{ marginTop: 10 }}>
              <Typography>{opt.option_text}</Typography>
              <LinearProgress variant="determinate" value={percent} />
              <Typography variant="caption">{count} votes</Typography>
              <Button size="small" onClick={() => onVote(opt.id)}>Vote</Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
