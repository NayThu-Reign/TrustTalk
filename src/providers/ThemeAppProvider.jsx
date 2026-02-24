import { createContext, useState, useContext, useMemo, useEffect } from "react";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";

const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeAppProvider({ children }) {
  const [mode, setMode] = useState(() => {
    const stored = localStorage.getItem("themeMode");
    return stored ? stored : "light";
  });

  useEffect(() => {
    localStorage.setItem("themeMode", mode);
  }, [mode]);

  const theme = useMemo(() => {
    return createTheme({
      palette: { mode },
    });
  }, [mode]);

  return (
    <ThemeProvider theme={theme}>
      <ThemeContext.Provider value={{ mode, setMode }}>
        <CssBaseline />
        {children}
      </ThemeContext.Provider>
    </ThemeProvider>
  );
}
