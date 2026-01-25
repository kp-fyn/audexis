import { getCurrentWindow } from "@tauri-apps/api/window";
import { platform } from "@tauri-apps/plugin-os";
import { useEffect, useState } from "react";
import { Button } from "./Button";
import { Settings } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { SettingsModal } from "@/ui/components/modals/SettingsModal";
import useShortcuts from "@/ui/hooks/useShortcuts";
import toast from "react-hot-toast";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/components/Dropdown";
import { MaximizeIcon } from "./icons/maximize";
import { MinimizeIcon } from "./icons/minimize";
import { CloseIcon } from "./icons/close";
import { parseShortcut } from "../lib/utils";

export default function Titlebar() {
  const [hover, setHover] = useState<boolean>(false);
  const [isWindowFocused, setIsWindowFocused] = useState<boolean>(true);
  const [isWindowFullscreen, setIsWindowFullscreen] = useState<boolean>(false);
  const window = getCurrentWindow();
  const os = platform();
  const shortcuts = useShortcuts();
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const remove = shortcuts.register([
      { combo: "mod+,", handler: () => setSettingsOpen((prev) => !prev) },
    ]);
    return () => remove();
  }, [shortcuts]);
  useEffect(() => {
    window.onFocusChanged(({ payload: focused }) => {
      setIsWindowFocused(focused);
    });
    window.onResized(async () => {
      if (await window.isFullscreen()) {
        setIsWindowFullscreen(true);
      } else {
        setIsWindowFullscreen(false);
      }
    });
  }, []);

  async function maximizeWindow() {
    if (os === "macos") {
      if (await window.isFullscreen()) {
        await window.setFullscreen(false);
      } else {
        await window.setFullscreen(true);
      }
    } else {
      if (await window.isMaximized()) {
        await window.unmaximize();
      } else {
        if (await window.isMaximizable()) await window.maximize();
      }
    }
  }

  async function minimizeWindow() {
    if (!(await window.isMinimized())) {
      await window.minimize();
    }
  }

  async function closeWindow() {
    await window.close();
  }

  return (
    <div
      data-tauri-drag-region={true}
      className={`header items-start flex ${
        os !== "macos" && "flex-row-reverse"
      } bg-background border-b w-full z-9999999  border-border fixed h-12 top-0`}
    >
      {os === "macos" && !isWindowFullscreen && (
        <div data-tauri-drag-region={true} className="h-full items-center flex">
          <div
            onMouseOver={() => setHover(true)}
            onMouseOut={() => setHover(false)}
            className="flex items-center space-x-2 h-max   ml-2 text-black"
          >
            <button
              aria-label="Close"
              onClick={closeWindow}
              className={`relative w-3 h-3 rounded-full ${
                isWindowFocused || hover ? "bg-[#FF5F57]" : "bg-[#595959]"
              } hover:brightness-110 active:scale-90`}
            >
              {hover && isWindowFocused && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-black leading-none">
                  ×
                </span>
              )}
            </button>

            <button
              aria-label="Minimize"
              onClick={minimizeWindow}
              className={`relative w-3 h-3 rounded-full ${
                isWindowFocused || hover ? "bg-[#FFBD2E]" : "bg-[#595959]"
              } hover:brightness-110 active:scale-90`}
            >
              {hover && isWindowFocused && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-black leading-none">
                  –
                </span>
              )}
            </button>

            <button
              onClick={maximizeWindow}
              aria-label="Maximize"
              className={`relative w-3 h-3 rounded-full ${
                isWindowFocused || hover ? "bg-[#28C840]" : "bg-[#595959]"
              } hover:brightness-110 active:scale-90`}
            >
              {hover && isWindowFocused && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-black leading-none">
                  ⤢
                </span>
              )}
            </button>
          </div>
        </div>
      )}
      {os !== "macos" && !isWindowFullscreen && (
        <div
          data-tauri-drag-region={true}
          className="h-full items-center flex flex-1"
        >
          <div className="flex ml-auto">
            <button
              onClick={minimizeWindow}
              aria-label="Minimize"
              className="hover:bg-hover px-3 py-4 h-full"
            >
              <MinimizeIcon className="w-4 h-4"></MinimizeIcon>
            </button>
            <button
              onClick={maximizeWindow}
              aria-label="Maximize"
              className="hover:bg-hover px-3 py-4 h-full"
            >
              <MaximizeIcon className="w-4 h-4"></MaximizeIcon>
            </button>
            <button
              onClick={closeWindow}
              aria-label="Close"
              className="hover:bg-red-600 px-3 py-4 h-full"
            >
              <CloseIcon className="w-4 h-4"></CloseIcon>
            </button>
          </div>
        </div>
      )}
      {window.label === "main" && (
        <div
          data-tauri-drag-region={true}
          className={`z-999999 ${
            os === "macos" && "ml-auto"
          }  justify-center px-2 gap-2 flex items-center h-full`}
        >
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>Import...</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => {
                    invoke("import_files", { fileType: "file" }).catch((err) =>
                      toast.error(`Failed to import files: ${err}`),
                    );
                  }}
                >
                  Import Files
                </DropdownMenuItem>
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
      )}
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
