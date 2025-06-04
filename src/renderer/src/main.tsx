import "./assets/main.css";

import React, { ReactNode } from "react";
import ReactDOM from "react-dom/client";
import { SidebarWidthProvider } from "@/ui/hooks/useSidebarWidth";
import { ErrorBoundary } from "react-error-boundary";
import Settings from "./Settings";

import Header from "@/ui/components/Header";
import App from "./App";
import { ChangesProvider } from "./hooks/useChanges";
import { Button } from "./components/button";
import queryString from "query-string";
import { UserConfigProvider } from "./hooks/useUserConfig";
import Onboarding from "./Onboarding";
import { BottomHeightProvider } from "./hooks/useBottombarHeight";
import { Toaster } from "react-hot-toast";

window.app.onOpenDialog(() => {
  window.app.openDialog();
});

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");
const query = queryString.parse(window.location.search);
let page: string = query.query as string;
const theme = query.theme;
let content: ReactNode;
if (!page || typeof page !== "string") {
  page = "app";
}

if (theme) document.documentElement.setAttribute("class", theme as string);
let headerShown = true;
const url = new URL(window.location.href);
url.search = `?query=${page}`;
window.history.pushState({}, "", url);

switch (page.toLowerCase()) {
  case "app":
    content = <App />;
    break;
  case "settings":
    content = <Settings />;
    break;
  case "onboarding":
    headerShown = false;
    content = <Onboarding />;
    break;
  default:
    content = <App />;
    page = "app";
    break;
}
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <UserConfigProvider initialTheme={theme as string}>
      <ChangesProvider>
        <Header headerShown={headerShown} windowName={page} />
        <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
          <BottomHeightProvider>
            <SidebarWidthProvider>
              {content}
              <Toaster
                toastOptions={{
                  className:
                    "!bg-background !text-foreground !border-border !text-foreground !rounded !shadow-md !border",
                }}
                position="top-right"
                containerClassName="!top-[64px]"
              />
            </SidebarWidthProvider>
          </BottomHeightProvider>
        </ErrorBoundary>
      </ChangesProvider>
    </UserConfigProvider>
  </React.StrictMode>
);
// eslint-disable-next-line react-refresh/only-export-components
function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}): ReactNode {
  console.error("ErrorBoundary caught an error:", error);
  return (
    <div className="mt-12 h-full">
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <Button onClick={resetErrorBoundary}>Try Again</Button>
    </div>
  );
}
