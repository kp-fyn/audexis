// TODO: rallow for removal of selected roots
import { useState, useRef } from "react";

import { invoke } from "@tauri-apps/api/core";
import { Modal } from "../components/Modal";

import { Select } from "../components/Select";
import { useStore } from "../hooks/useStore";
import toast from "react-hot-toast";

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

export function OnboardingModal({ open, onClose }: OnboardingModalProps) {
  const { currentTheme, store } = useStore();
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const [importRoots, setImportRoots] = useState<string[]>([]);

  return (
    <Modal
      ref={dialogRef}
      open={open}
      onClose={onClose}
      sizeMax
      closeOnEsc={false}
      bodyClassName="p-0"
      header={
        <div className="flex items-center gap-4 px-6 h-14 border-b border-border/60 bg-background/70 backdrop-blur-sm">
          <h2
            id="onboarding-modal-title"
            className="text-sm font-semibold tracking-wide uppercase text-foreground"
          >
            Welcome Setup
          </h2>
          <span className="text-[11px] text-foreground/50 font-medium">
            Configure your preferences
          </span>
        </div>
      }
      footer={
        <>
          <button
            onClick={() => {
              if (importRoots.length === 0)
                return toast.error(
                  "TYou need to select at least one folder for library roots!",
                );
              toast.promise(
                invoke("set_library_roots", { folders: importRoots }),
                {
                  loading: "Saving...",
                  success: <b>Settings saved!</b>,
                  error: <b>Could not save.</b>,
                },
              );

              onClose();
            }}
            className="text-xs px-3 py-1.5 rounded-md border border-primary/50 bg-primary/25 text-foreground hover:bg-primary/35 transition-colors"
          >
            Finish Setup
          </button>
        </>
      }
    >
      <div className="flex flex-col h-full w-full gap-2 mt-2">
        <div className="flex h-max w-full px-4 py-2 border-border border-b ">
          <div className="flex flex-col px-12 ">
            <span>1. Theme</span>
            <span className="my-auto text-sm text-muted-foreground">
              Dark mode or light Mode?
            </span>
          </div>

          <div className="ml-auto flex items-center">
            <Select
              value={currentTheme}
              options={[
                { value: "dark", label: "Dark" },
                { value: "light", label: "Light" },
              ]}
              onChange={(val) => {
                store.set("theme", val).then(() => {
                  store.save();
                });
              }}
            />
          </div>
        </div>
        <div className="flex h-max w-full px-4 py-2 border-border border-b ">
          <div className="flex flex-col px-12 ">
            <span>2. Library roots</span>
            <span className="my-auto text-sm text-muted-foreground">
              Where do you store all your music? Please import the root
              eg(/users/kp/music) NOT (/users/kp/music/Micheal_Jackson)
            </span>
            <div className="roots mt-2 flex flex-col">
              {importRoots.map((folder) => (
                <div>{folder}</div>
              ))}
            </div>
          </div>

          <div className="ml-auto flex flex-col justify-center">
            <button
              onClick={() => {
                invoke<string[]>("import_roots").then((folders) => {
                  setImportRoots((oldImportRoots) => {
                    return [...new Set([...oldImportRoots, ...folders])];
                  });
                });
              }}
              className="text-xs px-5 py-2 rounded-md border border-primary/50 bg-transparent text-foreground hover:bg-primary/35 transition-colors"
            >
              Import
            </button>
          </div>
        </div>
      </div>
      <div id="onboarding-modal-live" aria-live="polite" className="sr-only" />
    </Modal>
  );
}
