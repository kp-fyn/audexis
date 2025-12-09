import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./assets/main.css";
import Titlebar from "./components/Titlebar";
import queryString from "query-string";
import { UserConfigProvider } from "@/ui/hooks/useUserConfig";
import { SidebarWidthProvider } from "@/ui/hooks/useSidebarWidth";
import { ChangesProvider } from "@/ui/hooks/useChanges";
import { OnboardingModal } from "@/ui/components/OnboardingModal";
import { Toaster } from "react-hot-toast";
import { useAutoUpdater } from "@/ui/hooks/useAutoUpdater";
import { invoke } from "@tauri-apps/api/core";
import { ContextMenuArea, ContextMenuProvider } from "./components/ContextMenu";
import { useHotkeys } from "@/ui/hooks/useHotkeys";
import SaveBar from "@/ui/components/SaveBar";
import { RenameProvider } from "@/ui/hooks/useRename";
import RenameModal from "@/ui/components/RenameModal";
import { FindReplaceProvider } from "@/ui/hooks/useFindReplace";
import FindReplaceBar from "@/ui/components/FindReplaceBar";
import { useChanges } from "@/ui/hooks/useChanges";
import { CleanupModal } from "./components/CleanupModal";
import { CleanupProvider } from "./hooks/useCleanup";
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
  const { undo, redo, canUndo, canRedo } = useChanges();

  useAutoUpdater();

  useHotkeys(
    [
      {
        combo: "mod+i",
        handler: () => invoke("import_files", { fileType: "file" }),
      },
      {
        combo: "mod+shift+i",
        handler: () => invoke("import_files", { fileType: "folder" }),
      },
      {
        combo: "mod+r",
        handler: () => window.location.reload(),
      },
      {
        combo: ["mod+f"],
        handler: () => {
          window.dispatchEvent(
            new CustomEvent("audexis:find-open", { detail: { mode: "find" } })
          );
        },
        allowInInputs: true,
      },
      {
        combo: ["mod+shift+f"],
        handler: () => {
          window.dispatchEvent(
            new CustomEvent("audexis:find-open", {
              detail: { mode: "replace" },
            })
          );
        },
        allowInInputs: true,
      },
      {
        combo: ["mod+g"],
        handler: () => window.dispatchEvent(new Event("audexis:find-next")),
        allowInInputs: true,
      },
      {
        combo: ["mod+shift+g"],
        handler: () => window.dispatchEvent(new Event("audexis:find-prev")),
        allowInInputs: true,
      },
      {
        combo: ["mod+enter"],
        handler: () => window.dispatchEvent(new Event("audexis:replace-one")),
        allowInInputs: true,
      },
      {
        combo: ["mod+shift+enter"],
        handler: () => window.dispatchEvent(new Event("audexis:replace-all")),
        allowInInputs: true,
      },
    ],
    []
  );

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
    <ContextMenuArea
      className="flex flex-col h-screen overflow-hidden"
      asChild
      items={[
        {
          type: "item",
          label: "Undo",
          shortcut: "mod+Z",
          disabled: !canUndo,
          onSelect: () => undo(),
        },
        {
          type: "item",
          label: "Redo",
          shortcut: "mod+shift+Z",
          disabled: !canRedo,
          onSelect: () => redo(),
        },
        { type: "separator" },
        {
          type: "item",
          label: "Import Files…",
          shortcut: "mod+I",
          onSelect: () => invoke("import_files", { fileType: "file" }),
        },
        {
          type: "item",
          label: "Import Folder…",
          shortcut: "mod+shift+I",
          onSelect: () => invoke("import_files", { fileType: "folder" }),
        },
        { type: "separator" },
        {
          type: "item",
          label: "Refresh",
          shortcut: "mod+R",
          onSelect: () => window.location.reload(),
        },
      ]}
    >
      <div className="flex flex-col h-screen overflow-hidden">
        <Titlebar />
        <div
          style={{ marginTop: 48, height: "calc(100vh - 48px)" }}
          className="flex flex-col flex-1 min-h-0 overflow-y-hidden overflow-x-hidden"
        >
          <App />
          <FindReplaceBar />
          <SaveBar />
          <RenameModal />
          <CleanupModal />
        </div>
        {showOnboarding && (
          <OnboardingModal
            open={showOnboarding}
            onClose={handleCloseOnboarding}
          />
        )}
      </div>
    </ContextMenuArea>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ContextMenuProvider>
      <UserConfigProvider initialTheme={theme}>
        <ChangesProvider>
          <CleanupProvider>
            <RenameProvider>
              <FindReplaceProvider>
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
              </FindReplaceProvider>
            </RenameProvider>
          </CleanupProvider>
        </ChangesProvider>
      </UserConfigProvider>
    </ContextMenuProvider>
  </React.StrictMode>
);
