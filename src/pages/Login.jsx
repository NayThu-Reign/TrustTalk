import { useState, useRef } from "react";
import {
  Box,
  Button,
  Card,
  Checkbox,
  Divider,
  IconButton,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import {
  Facebook,
  Google,
  Twitter,
  Apple,
} from "@mui/icons-material";
import { useAuth } from "../providers/AuthProvider";
import { useLocation, useNavigate } from "react-router-dom";

import loginImage from "../assets/TrustTalk-Logo.png"

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberPassword, setRememberPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

    const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

   const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login({ email, password });

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error);
    }
  };

  
  return (
    <Box
  sx={{
    height: "97vh",
    backgroundColor: "#f4fbfb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    px: 4,
    boxSizing: "border-box",
  }}
>
  <Box
    sx={{
      width: "100%",
      maxWidth: 1200,
      display: "grid",
      gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
      gap: 6,
      alignItems: "center",
      overflow: "hidden",
    }}
  >
    {/* LEFT – LOGIN CARD */}
    <Card
      component="form"
      onSubmit={handleSubmit}
      elevation={0}
      sx={{
        p: 5,
        borderRadius: 4,
        border: "1px solid #e0f2f1",
      }}
    >
      <Typography variant="h5" fontWeight={600} mb={3} sx={{textAlign: "center"}}>
        Login
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Email"
        placeholder="swd@trustlinkmm.com"
        margin="normal"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
      />

      <TextField
        fullWidth
        label="Password"
        type="password"
        margin="normal"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
      />

      <Button
        fullWidth
        size="large"
        variant="contained"
        type="submit"
        // onClick={handleSubmit}
        disabled={loading}
        sx={{
          mt: 3,
          py: 1.4,
          borderRadius: 3,
          background: "linear-gradient(90deg, #0b1c3f 0%, #102a6a 100%)",
        }}
      >
        {loading ? "Logging in..." : "Login"}
      </Button>
    </Card>

    {/* RIGHT – ILLUSTRATION */}
    <Box
      sx={{
        display: { xs: "none", md: "flex" },
        justifyContent: "center",
        alignItems: "center",
        height: "100%", // ✅ make column use available height
        overflow: "hidden",
      }}
    >
      <Box
        component="img"
        src={loginImage}
        alt="Login Illustration"
        sx={{
          width: "100%",
          maxWidth: 500,      // ✅ avoid too wide
          maxHeight: "80vh",  // ✅ never exceed screen height
          height: "auto",     // ✅ keep ratio
          objectFit: "contain",
        }}
      />
    </Box>
  </Box>
</Box>

  );
}
