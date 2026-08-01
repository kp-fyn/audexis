import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Titlebar from "./components/Titlebar";
import { StoreProvider } from "./hooks/useStore";
import { Toaster } from "react-hot-toast";
import "./styles/main.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Toaster
      position="top-right"
      containerStyle={{
        marginTop: "64px",
      }}
      toastOptions={{
        className: "!bg-background !text-foreground !border !border-border",
        style: {
          background: "var(--background)",
          color: "var(--foreground)",
          border: "1px solid var(--border)",
        },
      }}
    />
    <StoreProvider>
      <Titlebar></Titlebar>

      <App />
    </StoreProvider>
  </React.StrictMode>,
);
