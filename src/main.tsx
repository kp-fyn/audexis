import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SidebarWidthProvider } from "@/contexts/Sidbear";
import "./index.css";
import { ChangesProvider } from "@/contexts/Changes";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChangesProvider>
      <SidebarWidthProvider>
        <App />
      </SidebarWidthProvider>
    </ChangesProvider>
  </React.StrictMode>,
);

// Use contextBridge
window.ipcRenderer.on("main-process-message", (_event, message) => {
  console.log(message);
});
