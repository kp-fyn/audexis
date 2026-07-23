import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import ErrorPage from "./error";
import { ErrorBoundary } from "react-error-boundary";

import "./assets/main.css";
import Titlebar from "@/ui/components/Titlebar";
import queryString from "query-string";
import { UserConfigProvider } from "@/ui/hooks/useUserConfig";
import { SidebarWidthProvider } from "@/ui/hooks/useSidebarWidth";
import { ChangesProvider } from "@/ui/hooks/useChanges";
import { OnboardingModal } from "@/ui/components/modals/OnboardingModal";
import { Toaster } from "react-hot-toast";
import { AutoUpdaterProvider } from "@/ui/hooks/useAutoUpdater";

import SaveBar from "@/ui/components/SaveBar";
import { RenameProvider, useRename } from "@/ui/hooks/useRename";
import RenameModal from "@/ui/components/RenameModal";
import { FindReplaceProvider } from "@/ui/hooks/useFindReplace";
import FindReplaceBar from "@/ui/components/FindReplaceBar";
import { CleanupModal } from "@/ui/components/modals/CleanupModal";
import { TagEditorError } from "@/ui/components/modals/TagEditorError";
import { CleanupProvider } from "./hooks/useCleanup";
import { TagEditorErrorsProvider } from "./hooks/useTagEditorErrors";
import { BottombarHeightProvider } from "./hooks/useBottombarHeight";

const query = queryString.parse(window.location.search);
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

let theme = localStorage.getItem("theme") || query.theme || "light";
theme = theme.toString().toLowerCase();
if (theme !== "light" && theme !== "dark") theme = "light";
document.documentElement.setAttribute("data-theme", theme);

const params = new URLSearchParams(window.location.href);

const viewMode = params.get("view") ?? "simple";

if (params.get("theme") !== theme) {
  params.set("theme", theme);
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", newUrl);
}

function Root() {
  const [showOnboarding, setShowOnboarding] = React.useState(
    query.onboarding === "true",
  );

  const { open: renameOpen } = useRename();
  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    const params = new URLSearchParams(window.location.search);
    if (params.get("onboarding")) {
      params.delete("onboarding");
      const newUrl = `${window.location.pathname}?${params.toString()}`.replace(
        /\?$/,
        "",
      );
      window.history.replaceState({}, "", newUrl);
    }
  };

  return (
    <div
      className="h-screen overflow-hidden"
      onContextMenu={(e) => {
        e.preventDefault();
      }}
    >
      <Titlebar />
      <div
        // style={{ marginTop: 48, height: "calc(100vh - 48px)" }}
        className="flex flex-col h-full w-full flex-1 min-h-0 overflow-y-hidden overflow-x-hidden absolute"
      >
        <App />
        <TagEditorError />
        <FindReplaceBar />
        <SaveBar />
        {renameOpen && <RenameModal />}
        <CleanupModal />
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
    <ErrorBoundary FallbackComponent={ErrorPage}>
      <UserConfigProvider initialView={viewMode} initialTheme={theme}>
        <TagEditorErrorsProvider>
          <ChangesProvider>
            <AutoUpdaterProvider>
              <CleanupProvider>
                <RenameProvider>
                  <FindReplaceProvider>
                    <BottombarHeightProvider>
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
                    </BottombarHeightProvider>
                  </FindReplaceProvider>
                </RenameProvider>
              </CleanupProvider>
            </AutoUpdaterProvider>
          </ChangesProvider>
        </TagEditorErrorsProvider>
      </UserConfigProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
