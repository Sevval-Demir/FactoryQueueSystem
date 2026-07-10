import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { trTR as dataGridTrTR } from "@mui/x-data-grid/locales";
import App from "./App";
import "./index.css";

const theme = createTheme(
  {
    palette: {
      primary: { main: "#1e5d8f" },
      secondary: { main: "#607d8b" },
      background: { default: "#f4f7fa" },
    },
    shape: { borderRadius: 8 },
    typography: { fontFamily: "Inter, Roboto, Arial, sans-serif" },
  },
  dataGridTrTR,
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
