import { Box, Button, Typography } from "@mui/material";
import RobotImg from "../assets/sadAstronut.png";

export default function ErrorPage({
  title,
  subtitle,
  message,
  showBack = true,
}) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#c2e6fc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 3,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          maxWidth: 900,
          flexWrap: "wrap",
        }}
      >
        <Box
          component="img"
          src={RobotImg}
          alt="Error illustration"
          sx={{ width: { xs: 220, md: 300 } }}
        />

        <Box sx={{ color: "#fff", textAlign: { xs: "center", md: "left" } }}>
          <Typography variant="h2" fontWeight="bold" gutterBottom>
            {title}
          </Typography>

          <Typography variant="h5" gutterBottom>
            {subtitle}
          </Typography>

          <Typography sx={{ opacity: 0.9, mb: 3 }}>
            {message}
          </Typography>

          {showBack && (
            <Button
              variant="contained"
              sx={{
                bgcolor: "#fff",
                color: "#5f88b6",
                fontWeight: "bold",
              }}
              onClick={() => window.location.href = "/"}
            >
              Go Home
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
