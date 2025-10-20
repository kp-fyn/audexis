import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useUserConfig } from "@/ui/hooks/useUserConfig";
import { SectionNavButton } from "./settings";
import {
  WelcomeSection,
  ThemeSection,
  ViewSection,
  ColumnsPresetSection,
  FinishSection,
} from "./onboarding";
import { invoke } from "@tauri-apps/api/core";

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

type SectionId = "welcome" | "theme" | "view" | "columns" | "finish";

export function OnboardingModal({ open, onClose }: OnboardingModalProps) {
  const { setTheme, setView } = useUserConfig();
  const [activeSection, setActiveSection] = useState<SectionId>("welcome");
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);
  const [closing, setClosing] = useState(false);
  const [themeChoice, setThemeChoice] = useState<"light" | "dark">("light");
  const [viewChoice, setViewChoice] = useState<"folder" | "simple">("folder");
  const [columnPreset, setColumnPreset] = useState<"basic" | "detailed">(
    "basic"
  );
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstFocusableRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    let root = document.getElementById("modal-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "modal-root";
      document.body.appendChild(root);
    }
    setPortalNode(root);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
      if (e.key === "1") setActiveSection("welcome");
      if (e.key === "2") setActiveSection("theme");
      if (e.key === "3") setActiveSection("view");
      if (e.key === "4") setActiveSection("columns");
      if (e.key === "5") setActiveSection("finish");
      if (e.key === "Tab") {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    setTimeout(() => firstFocusableRef.current?.focus(), 30);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const handleClose = useCallback(() => {
    invoke("update_user_config", {
      patch: {
        onboarding: false,
      },
    });
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 160);
  }, [onClose]);

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
    invoke("update_user_config", {
      patch: {
        onboarding: false,
      },
    });
    handleClose();
  }, [themeChoice, viewChoice, handleClose, setTheme, setView]);

  if (!open || !portalNode) return null;

  return createPortal(
    <div
      aria-modal="true"
      role="dialog"
      aria-labelledby="onboarding-modal-title"
      className="fixed inset-0 z-[1200] flex items-center justify-center p-4 md:p-8"
    >
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm border-t border-border animate-in fade-in"
        onClick={handleClose}
      />
      <span tabIndex={0} aria-hidden="true" />
      <div
        ref={dialogRef}
        className={`relative w-full max-w-5xl rounded-lg border border-border bg-gradient-to-b from-background/95 to-background/80 shadow-xl ring-1 ring-border/50 overflow-hidden animate-in ${
          closing ? "animate-out fade-out zoom-out-95" : "zoom-in-90"
        } duration-150`}
      >
        {/* Header */}
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
              onClick={handleClose}
              className="group h-8 w-8 rounded-md border border-border/60 bg-background/40 hover:bg-destructive/10 hover:border-destructive/50 transition-all duration-200 flex items-center justify-center"
              aria-label="Skip onboarding"
            >
              <span className="text-foreground/60 group-hover:text-destructive text-lg leading-none transition-colors">
                ×
              </span>
            </button>
          </div>
        </div>

        <div className="flex h-full max-h-[66vh]">
          {/* Left Nav */}
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

          {/* Content */}
          <div className="flex-1 overflow-auto p-6 space-y-6 custom-scrollbar">
            {activeSection === "welcome" && <WelcomeSection />}
            {activeSection === "theme" && (
              <ThemeSection
                theme={themeChoice}
                onThemeChange={setThemeChoice}
              />
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

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 h-14 border-t border-border/60 bg-background/70 backdrop-blur-sm">
          <div className="mr-auto text-[10px] text-foreground/40 uppercase tracking-wide">
            1-5 to navigate • Esc to skip
          </div>
          <button
            onClick={handleClose}
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
        </div>
      </div>
      <span tabIndex={0} aria-hidden="true" />
      <div id="onboarding-modal-live" aria-live="polite" className="sr-only" />
    </div>,
    portalNode
  );
}
