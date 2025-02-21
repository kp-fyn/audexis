import { createRoot } from "react-dom/client";
import React from "react";
import "./styles/index.css";
import { SidebarWidthProvider } from "@/ui/hooks/useSidebarWidth";
import { ErrorBoundary } from "react-error-boundary";

import Header from "@/ui/components/Header";
import App from "./App";
import { ChangesProvider } from "./hooks/useChanges";
import { Button } from "./components/button";
window.app.onOpenDialog(() => {
  window.app.openDialog();
});
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");
const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Header />
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      <ChangesProvider>
        <SidebarWidthProvider>
          <div className="mt-12 h-full">
            <App />
          </div>
        </SidebarWidthProvider>
      </ChangesProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="mt-12 h-full">
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <Button onClick={resetErrorBoundary}>Try Again</Button>
    </div>
  );
}
