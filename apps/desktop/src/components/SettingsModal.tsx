import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useUserConfig } from "@/ui/hooks/useUserConfig";
import type { Column, Column as UserColumn } from "@/ui/types";
import { getVersion } from "@tauri-apps/api/app";
import {
  SectionNavButton,
  AppearanceSection,
  ColumnsSection,
  BehaviorSection,
  AdvancedSection,
} from "./settings";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  onSettingsPreview?: (draft: SettingsDraft) => void;
}

interface SettingsDraft {
  theme: "light" | "dark";
  density: "compact" | "default" | "comfort";
  columns: Column[];
  behavior: Record<string, boolean>;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstFocusableRef = useRef<HTMLButtonElement | null>(null);
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);
  const [closing, setClosing] = useState(false);
  const [appVersion, setAppVersion] = useState<string>("");

  const [activeSection, setActiveSection] = useState<
    "appearance" | "columns" | "behavior" | "advanced"
  >("appearance");

  const {
    config,
    setTheme,
    setColumns,
    allColumns,
    setDensity: persistDensity,
  } = useUserConfig();

  const columnMetaById = useMemo(() => {
    const map: Record<string, UserColumn> = {};
    for (const c of config.columns) map[c.value] = c;
    return map;
  }, [config.columns]);
  const [behavior, setBehavior] = useState<Record<string, boolean>>({
    autoSave: true,
    confirmDestructive: true,
    advancedTags: false,
    showHiddenFrames: false,
  });

  useEffect(() => {
    if (!open) return;
    let root = document.getElementById("modal-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "modal-root";
      document.body.appendChild(root);
    }
    setPortalNode(root);

    getVersion()
      .then(setAppVersion)
      .catch(() => setAppVersion("Unknown"));
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
    document.documentElement.setAttribute("data-density", config.density);
    return () => document.documentElement.removeAttribute("data-density");
  }, [config.density, open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (document.activeElement) {
        const tagName = document.activeElement.tagName.toLowerCase();
        if (
          tagName === "input" ||
          tagName === "textarea" ||
          document.activeElement?.getAttribute("contenteditable") === "true"
        ) {
          return;
        }
      }
      if (e.key === "Escape") handleClose();
      if (e.key.toLowerCase() === "1") setActiveSection("appearance");
      if (e.key.toLowerCase() === "2") setActiveSection("columns");
      if (e.key.toLowerCase() === "3") setActiveSection("behavior");
      if (e.key.toLowerCase() === "4") setActiveSection("advanced");
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

  useEffect(() => {
    if (!open) return;
    const live = document.getElementById("settings-modal-live");
    if (live) live.textContent = "Settings opened";
    return () => {
      if (live) live.textContent = "Settings closed";
    };
  }, [open]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 160);
  }, [onClose]);

  const handleBehaviorChange = useCallback((key: string, value: boolean) => {
    setBehavior((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  if (!open || !portalNode) return null;

  return createPortal(
    <div
      aria-modal="true"
      role="dialog"
      aria-labelledby="settings-modal-title"
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
        <div className="flex items-center gap-4 px-6 h-14 border-b border-border/60 bg-background/70 backdrop-blur-sm">
          <h2
            id="settings-modal-title"
            className="text-sm font-semibold tracking-wide uppercase text-foreground/70"
          >
            Settings
          </h2>
          <span className="text-[11px] text-foreground/50 font-medium">
            Changes apply immediately
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              ref={firstFocusableRef}
              onClick={handleClose}
              className="group h-8 w-8 rounded-md border border-border/60 bg-background/40 hover:bg-destructive/10 hover:border-destructive/50 transition-all duration-200 flex items-center justify-center"
              aria-label="Close settings"
            >
              <span className="text-foreground/60 group-hover:text-destructive text-lg leading-none transition-colors">
                ×
              </span>
            </button>
          </div>
        </div>
        <div className="flex h-full max-h-[66vh]">
          <nav className="hidden sm:flex flex-col w-40 p-3 border-r border-border/60 bg-background/40 gap-2 overflow-y-auto">
            <SectionNavButton
              label="General"
              isActive={activeSection === "appearance"}
              onClick={() => setActiveSection("appearance")}
            />
            <SectionNavButton
              label="Columns"
              isActive={activeSection === "columns"}
              onClick={() => setActiveSection("columns")}
            />
            <SectionNavButton
              label="Behavior"
              isActive={activeSection === "behavior"}
              onClick={() => setActiveSection("behavior")}
            />
            <SectionNavButton
              label="Advanced"
              isActive={activeSection === "advanced"}
              onClick={() => setActiveSection("advanced")}
            />
            <div className="mt-auto pt-4 space-y-2">
              <div className="text-[10px] text-foreground/40 leading-relaxed">
                1-4 to switch sections. Esc to close.
              </div>
              {appVersion && (
                <div className="text-[10px] text-foreground/30 font-mono">
                  v{appVersion}
                </div>
              )}
            </div>
          </nav>

          <div className="flex-1 overflow-auto p-6 space-y-6 custom-scrollbar">
            {activeSection === "appearance" && (
              <AppearanceSection
                theme={config.theme}
                density={config.density}
                onThemeChange={setTheme}
                onDensityChange={persistDensity}
              />
            )}
            {activeSection === "columns" && (
              <ColumnsSection
                columns={config.columns}
                allColumns={allColumns}
                columnMetaById={columnMetaById}
                setColumns={setColumns}
              />
            )}
            {activeSection === "behavior" && (
              <BehaviorSection
                behavior={behavior}
                onBehaviorChange={handleBehaviorChange}
              />
            )}
            {activeSection === "advanced" && <AdvancedSection />}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 h-14 border-t border-border/60 bg-background/70 backdrop-blur-sm">
          <div className="mr-auto text-[10px] text-foreground/40 uppercase tracking-wide">
            Cmd+, to reopen • Esc to close
          </div>
          <button
            onClick={handleClose}
            className="text-xs px-3 py-1.5 rounded-md border border-border bg-muted/30 hover:bg-primary/10 hover:border-primary/50 transition-colors"
          >
            Close
          </button>
          <button
            disabled
            className="text-xs px-3 py-1.5 rounded-md border border-border/70 bg-primary/25 text-foreground/60 cursor-not-allowed"
          >
            Save (disabled)
          </button>
        </div>
      </div>
      <span tabIndex={0} aria-hidden="true" />
      <div id="settings-modal-live" aria-live="polite" className="sr-only" />
    </div>,
    portalNode
  );
}
