import "./assets/main.css";

import React, { ReactNode } from "react";
import ReactDOM from "react-dom/client";
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
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Header />
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
      <ChangesProvider>
        <SidebarWidthProvider>
          <App />
        </SidebarWidthProvider>
      </ChangesProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
// eslint-disable-next-line react-refresh/only-export-components
function ErrorFallback({
  error,
  resetErrorBoundary
}: {
  error: Error;
  resetErrorBoundary: () => void;
}): ReactNode {
  return (
    <div className="mt-12 h-full">
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <Button onClick={resetErrorBoundary}>Try Again</Button>
    </div>
  );
}
