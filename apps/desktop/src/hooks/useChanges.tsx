/* eslint-disable react-refresh/only-export-components */
// TODO: Make better undo/redo system
"use client";
import {
  createContext,
  useContext,
  useState,
  Dispatch,
  SetStateAction,
  ReactNode,
  useEffect,
} from "react";
import toast from "react-hot-toast";
import { listen, Event } from "@tauri-apps/api/event";
import { FileNode, Tags, File, SerializableTagFrameValue } from "@/ui/types";
import { invoke } from "@tauri-apps/api/core";

type FileIdentifier = {
  hash: string;
  path: string;
};

interface ChangesContext {
  changes: Record<string, SerializableTagFrameValue[]>;
  setChanges: Dispatch<
    SetStateAction<Record<string, SerializableTagFrameValue[]>>
  >;

  setSelected: Dispatch<SetStateAction<string[]>>;
  setFileTreeFolderSelected: Dispatch<SetStateAction<string[]>>;
  fileTreeFolderSelected: string[];
  setFilesToShow: Dispatch<SetStateAction<FileIdentifier[]>>;
  setFileTree: Dispatch<SetStateAction<FileNode[]>>;
  filesToShow: FileIdentifier[];
  selected: string[];
  fileTree: FileNode[];

  saveChanges: () => void;

  clearChanges: () => void;
  files: File[];
  setFiles: Dispatch<SetStateAction<File[]>>;

  canUndo: boolean;
  canRedo: boolean;
  hasUnsavedChanges: boolean;
  nudgeSaveBar: () => void;
  saveBarNudge: number;
}

const ChangesContext = createContext<ChangesContext>({
  changes: {},
  canRedo: false,
  canUndo: false,

  setFileTreeFolderSelected: () => {
    throw new Error("setFileTreeFolderSelected function must be overridden");
  },
  fileTreeFolderSelected: [],
  setFilesToShow: () => {
    throw new Error("setFilesToShow function must be overridden");
  },

  clearChanges: () => {
    throw new Error("clearChanges function must be overridden");
  },
  setFileTree: () => {
    throw new Error("clearChanges function must be overridden");
  },
  filesToShow: [],

  fileTree: [],
  setChanges: () => {
    throw new Error("setChanges function must be overridden");
  },

  saveChanges: () => {
    throw new Error("saveChanges function must be overridden");
  },
  setSelected: () => {
    throw new Error("setIndex function must be overridden");
  },
  selected: [],
  files: [],
  setFiles: () => {
    throw new Error("setFiles function must be overridden");
  },
  hasUnsavedChanges: false,
  nudgeSaveBar: () => {
    throw new Error("nudgeSaveBar function must be overridden");
  },
  saveBarNudge: 0,
});

export function useChanges(): ChangesContext {
  const context = useContext(ChangesContext);

  if (!context) {
    throw new Error("useChanges must be used within a Changes Provided");
  }
  return context;
}

export function ChangesProvider({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  const [changes, setChanges] = useState<
    Record<string, SerializableTagFrameValue[]>
  >({});

  const [files, setFiles] = useState<File[]>([]);
  const [filesToShow, setFilesToShow] = useState<FileIdentifier[]>([]);

  const [fileTreeFolderSelected, setFileTreeFolderSelected] = useState<
    string[]
  >([]);
  const [historyState, setHistoryState] = useState<HistoryPayload>({
    canRedo: false,
    canUndo: false,
  });
  const [selected, setSelected] = useState<string[]>([]);

  const [fileTree, setFileTree] = useState<FileNode[]>([]);

  const [saveBarNudge, setSaveBarNudge] = useState(0);
  const nudgeSaveBar = () => setSaveBarNudge((n) => n + 1);

  const hasUnsavedChanges =
    Object.keys(changes || {}).length > 0 && selected.length > 0;

  useEffect(() => {
    if (files.length === 0) {
      setSelected([]);
      return;
    }

    const validPaths = new Set(files.map((f) => f.path));

    setSelected((prevSelected) => {
      const stillValid = prevSelected.filter((path) => validPaths.has(path));

      if (stillValid.length !== prevSelected.length) {
        return stillValid;
      }

      return prevSelected;
    });
  }, [files]);

  useEffect(() => {
    const handleClick = (event: MouseEvent): void => {
      const targets = ["App", "table"];
      if (!event.target) {
        if (hasUnsavedChanges) {
          nudgeSaveBar();
          return;
        }
        setSelected([]);
      }
      if (event.target instanceof HTMLElement) {
        if (targets.includes(event.target.id)) {
          if (hasUnsavedChanges) {
            nudgeSaveBar();
            return;
          }
          setSelected([]);
        }
      }
    };

    document.addEventListener("click", handleClick);
    return (): void => document.removeEventListener("click", handleClick);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const unlisten = listen(
      "history_update",
      (event: Event<HistoryPayload>) => {
        const config = event.payload;
        setHistoryState(config);
      },
    );

    return () => {
      unlisten.then((f) => f());
    };
  }, []);
  useEffect(() => {
    const isEditable = (el: Element | null): boolean =>
      el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        if (isEditable(document.activeElement)) return;
        event.preventDefault();
        if (event.shiftKey) {
          // redo();
        } else {
          // undo();
        }
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a") {
        if (!document.activeElement) return;
        if (isEditable(document.activeElement)) {
          const el = document.activeElement as HTMLInputElement;
          el.select();
        } else {
          if (document.activeElement.id !== "App") return;

          event.preventDefault();
          if (hasUnsavedChanges) {
            nudgeSaveBar();
            return;
          }
          if (selected.length >= files.length) {
            setSelected([]);
          } else {
            setSelected(files.map((file) => file.path));
          }
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return (): void => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selected, files, hasUnsavedChanges]);

  const clearAllChanges = () => {
    setChanges({});
  };

  return (
    <ChangesContext.Provider
      value={{
        changes: changes,

        setChanges,

        saveChanges,
        clearChanges: clearAllChanges,
        selected,
        fileTree,
        setFilesToShow,
        fileTreeFolderSelected,
        setFileTreeFolderSelected,
        filesToShow,
        setFileTree,
        setSelected,
        files,
        setFiles,

        hasUnsavedChanges,
        nudgeSaveBar,
        saveBarNudge,
        canRedo: historyState.canRedo,
        canUndo: historyState.canUndo,
      }}
    >
      {children}
    </ChangesContext.Provider>
  );

  async function saveChanges(): Promise<void> {
    if (!changes) return;
    if (!selected || selected.length === 0) return;

    const frames = [];
    for (const [key, value] of Object.entries(changes)) {
      frames.push({
        key: key,
        values: value,
      });
    }

    try {
      await invoke("save_frame_changes", {
        frameChanges: { paths: selected, frames },
      });

      setChanges({});
      toast.success("Changes saved successfully");
    } catch (err: unknown) {
      console.log(err);
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to save changes: ${message}`);
    }
  }
}

interface HistoryPayload {
  canUndo: boolean;
  canRedo: boolean;
}
