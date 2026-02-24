import { Outlet } from "react-router-dom"

import {
    Box,
    GlobalStyles,
    CssBaseline,
} from "@mui/material"
import { useAuth } from "./providers/AuthProvider";
import NotificationHandler from "./components/NotificationHandler";

export default function MobileLayout() {

    const { authUser } = useAuth();

    console.log("mobile layout View");
   
      return (
        <Box>
            {authUser && <NotificationHandler />}
            <CssBaseline />
            <GlobalStyles styles={{ body: { overflowX: "hidden" } }} />
            <Outlet />
            
        </Box>
      );
}