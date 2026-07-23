import { platform } from "@tauri-apps/plugin-os";
import { useEffect, useState } from "react";

import { SettingsModal } from "@/ui/components/modals/SettingsModal";
import useShortcuts from "@/ui/hooks/useShortcuts";

export default function Titlebar() {
  const shortcuts = useShortcuts();
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const remove = shortcuts.register([
      { combo: "mod+,", handler: () => setSettingsOpen((prev) => !prev) },
    ]);
    return () => remove();
  }, [shortcuts]);
  // useEffect(() => {
  //   window.onFocusChanged(({ payload: focused }) => {
  //     setIsWindowFocused(focused);
  //   });
  //   window.onResized(async () => {
  //     if (await window.isFullscreen()) {
  //       setIsWindowFullscreen(true);
  //     } else {
  //       setIsWindowFullscreen(false);
  //     }
  //   });
  // }, []);

  // async function maximizeWindow() {
  //   if (os === "macos") {
  //     if (await window.isFullscreen()) {
  //       await window.setFullscreen(false);
  //     } else {
  //       await window.setFullscreen(true);
  //     }
  //   } else {
  //     if (await window.isMaximized()) {
  //       await window.unmaximize();
  //     } else {
  //       if (await window.isMaximizable()) await window.maximize();
  //     }
  //   }
  // }

  // async function minimizeWindow() {
  //   if (!(await window.isMinimized())) {
  //     await window.minimize();
  //   }
  // }

  // async function closeWindow() {
  //   await window.close();
  // }

  return (
    <div
      data-tauri-drag-region={true}
      className={`header fixed items-start flex  bg-transparent   w-full z-9999999  border-border  h-14 top-0`}
    >
      {/* {window.label === "main" && (
        <div
          data-tauri-drag-region={true}
          className={`z-999999 ${
            os === "macos" && "ml-auto"
          }  justify-center px-2 gap-2 flex items-center h-full`}
        >
          <>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button>Import...</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {config.view !== "folder" && (
                  <DropdownMenuItem
                    onClick={() => {
                      invoke("import_files", { fileType: "file" }).catch(
                        (err) => toast.error(`Failed to import files: ${err}`),
                      );
                    }}
                  >
                    Import Files
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => {
                    invoke("import_files", { fileType: "folder" }).catch(
                      (err) => toast.error(`Failed to import folder: ${err}`),
                    );
                  }}
                >
                  Import Folder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="relative group">
              <button
                aria-label="Open Settings"
                onClick={() => setSettingsOpen(true)}
                className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background transition-colors active:scale-95"
              >
                <Settings className="h-4 w-4" />
              </button>
              <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute -top-9 right-0 px-2 py-1 rounded-md bg-background/90 border border-border shadow text-[10px] tracking-wide text-foreground/70">
                Settings {parseShortcut("mod+,")}
              </div>
            </div>
          </>
        </div>
      )} */}
      {settingsOpen && (
        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onSettingsPreview={() => {}}
        />
      )}
    </div>
  );
}
