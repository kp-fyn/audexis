import { createRoot } from "react-dom/client";
import React from "react";
import "./styles/index.css";
import { SidebarWidthProvider } from "@/ui/hooks/useSidebarWidth";

import Header from "@/ui/components/Header";
import App from "./App";
import { ChangesProvider } from "./hooks/useChanges";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");
const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ChangesProvider>
      <SidebarWidthProvider>
        <Header />
        <div className="mt-12 h-full">
          <App />
        </div>
      </SidebarWidthProvider>
    </ChangesProvider>
  </React.StrictMode>
);
