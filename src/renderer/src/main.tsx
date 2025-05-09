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
window.app.onOpenDialog(() => {
  window.app.openDialog();
});

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");
const query = queryString.parse(window.location.search);
let page = query.query;
const theme = query.theme;
let content: ReactNode;

document.documentElement.classList.remove("dark");
document.documentElement.classList.remove("light");
document.documentElement.classList.add(theme as string);
let headerShown = true;
const url = new URL(window.location.href);
url.search = `?query=${page}`;
window.history.pushState({}, "", url);

switch (page) {
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
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
      <UserConfigProvider initialTheme={theme as string}>
        <Header headerShown={headerShown} windowName={page} />

        <ChangesProvider>
          <BottomHeightProvider>
            <SidebarWidthProvider>{content}</SidebarWidthProvider>
          </BottomHeightProvider>
        </ChangesProvider>
      </UserConfigProvider>
    </ErrorBoundary>
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
  return (
    <div className="mt-12 h-full">
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <Button onClick={resetErrorBoundary}>Try Again</Button>
    </div>
  );
}
