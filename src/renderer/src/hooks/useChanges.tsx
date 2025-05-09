/* eslint-disable react-refresh/only-export-components */
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
import { useHistoryState } from "@uidotdev/usehooks";

import { Changes, AudioFile, RootFileTree } from "./../../../types";

interface ChangesContxt {
  changes: Partial<AudioFile>;
  neededItems: { value: string; label: string; maxLength?: number }[];
  setChanges: (newPresent: Partial<AudioFile>) => void;
  setSelected: Dispatch<SetStateAction<string[]>>;
  setFileTreeFolderSelected: Dispatch<SetStateAction<string[]>>;
  fileTreeFolderSelected: string[];
  setFilesToShow: Dispatch<SetStateAction<AudioFile[]>>;
  setFileTree: Dispatch<SetStateAction<RootFileTree>>;
  filesToShow: AudioFile[];
  selected: string[];
  fileTree: RootFileTree;
  saveChanges: () => void;
  clearChanges: () => void;
  files: AudioFile[];
  setFiles: Dispatch<SetStateAction<AudioFile[]>>;
}

const ChangesContext = createContext<ChangesContxt>({
  changes: {},
  setFileTreeFolderSelected: () => {
    throw new Error("setFileTreeFolderSelected function must be overridden");
  },
  fileTreeFolderSelected: [],
  setFilesToShow: () => {
    throw new Error("setFilesToShow function must be overridden");
  },

  neededItems: [],
  clearChanges: () => {
    throw new Error("clearChanges function must be overridden");
  },
  setFileTree: () => {
    throw new Error("clearChanges function must be overridden");
  },
  filesToShow: [],
  fileTree: {
    disorgainzed: new Map(),
    organized: new Map(),
  },
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
});

export function useChanges(): ChangesContxt {
  const context = useContext(ChangesContext);

  if (!context) {
    throw new Error("useChanges must be used within a SidebarWidthProvider");
  }
  return context;
}

export function ChangesProvider({ children }: { children: ReactNode }): ReactNode {
  const { state, set, undo, redo, clear, canUndo, canRedo } = useHistoryState<Partial<AudioFile>>(
    {}
  );

  const [files, setFiles] = useState<AudioFile[]>([]);
  const [filesToShow, setFilesToShow] = useState<AudioFile[]>([]);
  const [fileTreeFolderSelected, setFileTreeFolderSelected] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [fileTree, setFileTree] = useState<RootFileTree>({
    disorgainzed: new Map(),
    organized: new Map(),
  });

  function handleUndo(): void {
    if (canUndo) {
      undo();
    }
  }
  function handleRedo(): void {
    if (canRedo) redo();
  }

  useEffect(() => {
    const undoHandler = (): void => handleUndo();
    const redoHandler = (): void => handleRedo();

    window.app.onUndo(undoHandler);
    window.app.onRedo(redoHandler);

    return (): void => {
      window.app.offUndo(undoHandler);
      window.app.offRedo(redoHandler);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUndo, canRedo, undo, redo, files, selected]);

  useEffect(() => {
    const handleClick = (event: MouseEvent): void => {
      const targets = ["App", "table"];
      if (!event.target) setSelected([]);
      if (event.target instanceof HTMLElement) {
        if (targets.includes(event.target.id)) setSelected([]);
      }
    };
    document.addEventListener("click", handleClick);
    return (): void => document.removeEventListener("click", handleClick);
  }, []);
  useEffect(() => {
    const isEditable = (el: Element | null): boolean =>
      el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a") {
        if (!document.activeElement) return;
        if (isEditable(document.activeElement)) {
          const el = document.activeElement as HTMLInputElement;
          el.select();
        } else {
          if (document.activeElement.id !== "App") return;

          event.preventDefault();
          if (selected.length >= files.length) {
            setSelected([]);
          } else {
            setSelected(files.map((file) => file.path));
          }
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    clear();
    return (): void => {
      document.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, files]);

  return (
    <ChangesContext.Provider
      value={{
        changes: state,
        neededItems: getNeededItems(),
        setChanges: set,
        saveChanges,
        clearChanges: clear,
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
      }}
    >
      {children}
    </ChangesContext.Provider>
  );

  function saveChanges(): void {
    const changes = state;
    if (!changes) return;
    if (!selected) return;
    const parsedChanges: Partial<Changes> = {
      ...changes,
      paths: selected,
    };

    window.app.save(parsedChanges);
    clear();
  }
}
function getNeededItems(): {
  value: string;
  label: string;
  maxLength?: number;
}[] {
  return [
    { value: "title", label: "Title" },
    { value: "artist", label: "Artist" },
    { value: "album", label: "Album" },
    { value: "year", label: "Year", maxLength: 4 },
    { value: "trackNumber", label: "Track Number" },
    { value: "genre", label: "Genre" },
    { value: "albumArtist", label: "Album Artist" },
    { value: "composer", label: "Composer" },
    { value: "encodedBy", label: "Encoded By" },
    { value: "conductor", label: "Conductor" },
  ];
}
