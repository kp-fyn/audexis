import { useEffect, useState, useCallback, useRef } from "react";
import { useUserConfig } from "@/ui/hooks/useUserConfig";
import { SectionNavButton } from "../settings";
import {
  WelcomeSection,
  ThemeSection,
  ViewSection,
  ColumnsPresetSection,
  FinishSection,
} from "../onboarding";
import { invoke } from "@tauri-apps/api/core";
import { Modal, useAnimatedModalClose } from "./Modal";

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

type SectionId = "welcome" | "theme" | "view" | "columns" | "finish";

export function OnboardingModal({ open, onClose }: OnboardingModalProps) {
  const { setTheme, setView } = useUserConfig();
  const [activeSection, setActiveSection] = useState<SectionId>("welcome");
  const [themeChoice, setThemeChoice] = useState<"light" | "dark">("light");
  const [viewChoice, setViewChoice] = useState<"folder" | "simple">("folder");
  const [columnPreset, setColumnPreset] = useState<"basic" | "detailed">(
    "basic",
  );
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstFocusableRef = useRef<HTMLButtonElement | null>(null);

  const { closing, requestClose } = useAnimatedModalClose(() => {
    invoke("update_user_config", {
      patch: {
        onboarding: false,
      },
    });
    onClose();
  }, 160);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
      }
      if (e.key === "1") setActiveSection("welcome");
      if (e.key === "2") setActiveSection("theme");
      if (e.key === "3") setActiveSection("view");
      if (e.key === "4") setActiveSection("columns");
      if (e.key === "5") setActiveSection("finish");
    };
    document.addEventListener("keydown", handleKey);
    setTimeout(() => firstFocusableRef.current?.focus(), 30);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, requestClose]);

  useEffect(() => {
    if (!open) return;
    setTheme(themeChoice);
  }, [themeChoice, open]);
  useEffect(() => {
    if (!open) return;
    setView(viewChoice === "folder" ? "folder" : "simple");
  }, [viewChoice, open]);

  const finish = useCallback(() => {
    setTheme(themeChoice);
    setView(viewChoice === "folder" ? "folder" : "simple");
    requestClose();
  }, [themeChoice, viewChoice, requestClose, setTheme, setView]);

  return (
    <Modal
      ref={dialogRef}
      open={open}
      onClose={requestClose}
      closing={closing}
      closeOnEsc={false}
      bodyClassName="p-0"
      header={
        <div className="flex items-center gap-4 px-6 h-14 border-b border-border/60 bg-background/70 backdrop-blur-sm">
          <h2
            id="onboarding-modal-title"
            className="text-sm font-semibold tracking-wide uppercase text-foreground/70"
          >
            Welcome Setup
          </h2>
          <span className="text-[11px] text-foreground/50 font-medium">
            Configure your preferences
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              ref={firstFocusableRef}
              onClick={requestClose}
              className="group h-8 w-8 rounded-md border border-border/60 bg-background/40 hover:bg-destructive/10 hover:border-destructive/50 transition-all duration-200 flex items-center justify-center"
              aria-label="Skip onboarding"
            >
              <span className="text-foreground/60 group-hover:text-destructive text-lg leading-none transition-colors">
                ×
              </span>
            </button>
          </div>
        </div>
      }
      footer={
        <>
          <div className="mr-auto text-[10px] text-foreground/40 uppercase tracking-wide">
            1-5 to navigate • Esc to skip
          </div>
          <button
            onClick={requestClose}
            className="text-xs px-3 py-1.5 rounded-md border border-border bg-muted/30 hover:bg-primary/10 hover:border-primary/50 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={finish}
            className="text-xs px-3 py-1.5 rounded-md border border-primary/50 bg-primary/25 text-foreground hover:bg-primary/35 transition-colors"
          >
            Finish Setup
          </button>
        </>
      }
    >
      <div className="flex h-full max-h-[66vh]">
        <nav className="hidden sm:flex flex-col w-40 p-3 border-r border-border/60 bg-background/40 gap-2 overflow-y-auto">
          <SectionNavButton
            label="Welcome"
            isActive={activeSection === "welcome"}
            onClick={() => setActiveSection("welcome")}
          />
          <SectionNavButton
            label="Theme"
            isActive={activeSection === "theme"}
            onClick={() => setActiveSection("theme")}
          />
          <SectionNavButton
            label="View"
            isActive={activeSection === "view"}
            onClick={() => setActiveSection("view")}
          />
          <SectionNavButton
            label="Columns"
            isActive={activeSection === "columns"}
            onClick={() => setActiveSection("columns")}
          />
          <SectionNavButton
            label="Finish"
            isActive={activeSection === "finish"}
            onClick={() => setActiveSection("finish")}
          />
          <div className="mt-auto pt-4 text-[10px] text-foreground/40 leading-relaxed">
            1-5 to switch sections. Esc to skip.
          </div>
        </nav>

        <div className="flex-1 overflow-auto p-6 space-y-6 custom-scrollbar">
          {activeSection === "welcome" && <WelcomeSection />}
          {activeSection === "theme" && (
            <ThemeSection theme={themeChoice} onThemeChange={setThemeChoice} />
          )}
          {activeSection === "view" && (
            <ViewSection view={viewChoice} onViewChange={setViewChoice} />
          )}
          {activeSection === "columns" && (
            <ColumnsPresetSection
              preset={columnPreset}
              onPresetChange={setColumnPreset}
            />
          )}
          {activeSection === "finish" && (
            <FinishSection
              theme={themeChoice}
              view={viewChoice}
              preset={columnPreset}
            />
          )}
        </div>
      </div>
      <div id="onboarding-modal-live" aria-live="polite" className="sr-only" />
    </Modal>
  );
}
