import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useUserConfig } from "@/ui/hooks/useUserConfig";
import type { Column, SidebarItem, Column as UserColumn } from "@/ui/types";
import { getVersion } from "@tauri-apps/api/app";
import {
  SectionNavButton,
  AppearanceSection,
  ColumnsSection,
  BehaviorSection,
  AdvancedSection,
} from "../settings";
import { SidebarItemsSection } from "../settings/SidebarItemsSection";
import { Modal, useAnimatedModalClose } from "./Modal";
import { parseShortcut } from "@/ui/lib/utils";

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
  const [appVersion, setAppVersion] = useState<string>("");
  const [activeNum, setActiveNum] = useState(0);

  const { closing, requestClose } = useAnimatedModalClose(onClose, 160);

  const {
    config,
    setTheme,
    setColumns,
    allSidebarItems,
    allColumns,
    setSidebarItems,
    setDensity: persistDensity,
    setShowDiffModal,
  } = useUserConfig();

  const columnMetaById = useMemo(() => {
    const map: Record<string, UserColumn> = {};
    for (const c of config.columns) map[c.value] = c;
    return map;
  }, [config.columns]);

  const sidebarItemMetaById = useMemo(() => {
    const map: Record<string, SidebarItem> = {};
    for (const item of config.sidebar_items) map[item.value] = item;
    return map;
  }, [config.sidebar_items]);

  const [behavior, setBehavior] = useState<Record<string, boolean>>({
    showDiffModal: false,
  });

  useEffect(() => {
    setBehavior({
      showDiffModal: config.show_diff_modal ?? false,
    });
  }, [config.show_diff_modal]);

  useEffect(() => {
    if (!open) return;
    getVersion()
      .then(setAppVersion)
      .catch(() => setAppVersion("Unknown"));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.documentElement.setAttribute("data-density", config.density);
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
      if (e.key === "Escape") requestClose();

      if (e.key === "ArrowUp") {
        setActiveNum((prev) => Math.max(0, prev - 1));
      }
      if (e.key === "ArrowDown") {
        const max = 4;
        setActiveNum((prev) => Math.min(max, prev + 1));
      }
    };
    document.addEventListener("keydown", handleKey);
    setTimeout(() => firstFocusableRef.current?.focus(), 30);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, requestClose]);

  useEffect(() => {
    if (!open) return;
    const live = document.getElementById("settings-modal-live");
    if (live) live.textContent = "Settings opened";
    return () => {
      if (live) live.textContent = "Settings closed";
    };
  }, [open]);

  const handleBehaviorChange = useCallback(
    (key: string, value: boolean) => {
      setBehavior((prev) => ({
        ...prev,
        [key]: value,
      }));

      if (key === "showDiffModal") {
        setShowDiffModal(value);
      }
    },
    [setShowDiffModal],
  );

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
              onClick={requestClose}
              className="group h-8 w-8 rounded-md border border-border/60 bg-background/40 hover:bg-destructive/10 hover:border-destructive/50 transition-all duration-200 flex items-center justify-center"
              aria-label="Close settings"
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
            {parseShortcut("mod+,")} to reopen • Esc to close
          </div>
          <button
            onClick={requestClose}
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
        </>
      }
    >
      <div className="flex max-h-[66vh] h-[66vh]">
        <nav className="hidden sm:flex flex-col w-40 p-3 border-r border-border/60 bg-background/40 gap-2 overflow-y-auto">
          <SectionNavButton
            label="General"
            isActive={activeNum === 0}
            onClick={() => setActiveNum(0)}
          />
          <SectionNavButton
            label="Sidebar Items"
            isActive={activeNum === 1}
            onClick={() => setActiveNum(1)}
          />
          <SectionNavButton
            label="Columns"
            isActive={activeNum === 2}
            onClick={() => setActiveNum(2)}
          />

          <SectionNavButton
            label="Behavior"
            isActive={activeNum === 3}
            onClick={() => setActiveNum(3)}
          />
          <SectionNavButton
            label="Advanced"
            isActive={activeNum === 4}
            onClick={() => setActiveNum(4)}
          />
          <div className="mt-auto pt-4 space-y-2">
            <div className="text-[10px] text-foreground/40 leading-relaxed">
              Use up and down arrow keys to navigate
            </div>
            {appVersion && (
              <div className="text-[10px] text-foreground/30 font-mono">
                v{appVersion}
              </div>
            )}
          </div>
        </nav>

        <div className="flex-1 overflow-auto p-6 space-y-6 custom-scrollbar">
          {activeNum === 0 && (
            <AppearanceSection
              theme={config.theme}
              density={config.density}
              onThemeChange={setTheme}
              onDensityChange={persistDensity}
            />
          )}
          {activeNum === 1 && (
            <SidebarItemsSection
              sidebarItems={config.sidebar_items}
              sidebarItemMetaById={sidebarItemMetaById}
              setSidebarItems={setSidebarItems}
              allSidebarItems={allSidebarItems}
            />
          )}
          {activeNum === 2 && (
            <ColumnsSection
              columns={config.columns}
              allColumns={allColumns}
              columnMetaById={columnMetaById}
              setColumns={setColumns}
            />
          )}
          {activeNum === 3 && (
            <BehaviorSection
              behavior={behavior}
              onBehaviorChange={handleBehaviorChange}
            />
          )}
          {activeNum === 4 && <AdvancedSection />}
        </div>
      </div>
      <div id="settings-modal-live" aria-live="polite" className="sr-only" />
    </Modal>
  );
}
