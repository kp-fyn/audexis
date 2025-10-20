import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./assets/main.css";
import Titlebar from "./components/Titlebar";
import queryString from "query-string";
import { UserConfigProvider } from "@/ui/hooks/useUserConfig.tsx";
import { SidebarWidthProvider } from "@/ui/hooks/useSidebarWidth.tsx";
import { ChangesProvider } from "@/ui/hooks/useChanges.tsx";
import { OnboardingModal } from "@/ui/components/OnboardingModal";
import { Toaster } from "react-hot-toast";
import { useAutoUpdater } from "@/ui/hooks/useAutoUpdater";

const query = queryString.parse(window.location.search);
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

let theme = localStorage.getItem("theme") || query.theme || "light";
theme = theme.toString().toLowerCase();
if (theme !== "light" && theme !== "dark") theme = "light";
document.documentElement.setAttribute("data-theme", theme);

const params = new URLSearchParams(window.location.search);
if (params.get("theme") !== theme) {
  params.set("theme", theme);
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", newUrl);
}

function Root() {
  const [showOnboarding, setShowOnboarding] = React.useState(
    query.onboarding === "true"
  );

  // Check for updates
  useAutoUpdater();

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    const params = new URLSearchParams(window.location.search);
    if (params.get("onboarding")) {
      params.delete("onboarding");
      const newUrl = `${window.location.pathname}?${params.toString()}`.replace(
        /\?$/,
        ""
      );
      window.history.replaceState({}, "", newUrl);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Titlebar />
      <div
        style={{ marginTop: 48, height: "calc(100vh - 48px)" }}
        className="flex flex-col flex-1 min-h-0 overflow-y-hidden overflow-x-hidden"
      >
        <App />
      </div>
      {showOnboarding && (
        <OnboardingModal
          open={showOnboarding}
          onClose={handleCloseOnboarding}
        />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <UserConfigProvider initialTheme={theme}>
      <ChangesProvider>
        <SidebarWidthProvider>
          <Root />
          <Toaster
            position="top-right"
            containerStyle={{
              marginTop: "64px",
            }}
            toastOptions={{
              className:
                "!bg-background !text-foreground !border !border-border",
              style: {
                background: "var(--background)",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
              },
            }}
          />
        </SidebarWidthProvider>
      </ChangesProvider>
    </UserConfigProvider>
  </React.StrictMode>
);
