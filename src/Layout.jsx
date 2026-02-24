import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

import {
  Box,
  GlobalStyles,
  CssBaseline,
  Typography,
} from "@mui/material";
import { useAuth } from "./providers/AuthProvider";
import NotificationHandler from "./components/NotificationHandler";
import { Helmet } from "react-helmet-async";
import SideBar from "./components/SideBar";
import astronutImage from "./assets/astronut.webp";
// import womanchatting from "/womanchatting.webp";


export default function Layout() {
  const { authUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to login if not authenticated
  // useEffect(() => {
  //   if (!authUser) {
  //     navigate("/");
  //   }
  // }, [authUser, navigate]);

  return (
    <Box>
      <Helmet>
        {/* <link rel="icon" type="image/png" href="/splash_logo_tl 2.png" /> */}
        <title>TrustTalk</title>
      </Helmet>
      {authUser && <NotificationHandler />}
      <CssBaseline />
      <GlobalStyles styles={{ body: { overflowX: "hidden", overflowY: "hidden" } }} />
     {(authUser && location.pathname !== "/") ? (
        <Box
          sx={{
            display: "flex",
            height: "100vh", 
          }}
        >
          <SideBar /> 
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Outlet />
          </Box>
        </Box>
      ) : authUser && location.pathname === "/" ? (
          <Box
          sx={{
            display: "flex",
            height: "100vh", 
          }}
        >
          <SideBar /> 
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              // justifyContent: "center",
              paddingTop: "40px",
              // backgroundColor: "#f5f5f5", 
            }}
          >
            
            <img src={astronutImage} alt="chatting photo" height={400}/>
           
            <Typography textAlign="center" sx={{ fontSize: "25px", fontWeight: "bold"}}>
              Start a conversation today
            </Typography>
          </Box>
        </Box>
          
      ) : (
        <Outlet />
      )}
    </Box>
  );
}