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
import { useHistoryState } from "@uidotdev/usehooks";
import toast from "react-hot-toast";
import { listen, Event } from "@tauri-apps/api/event";
import {
  RootFileTree,
  Tags,
  File,
  AllTags,
  TagText,
  TagPicture,
} from "@/ui/types";
import { invoke } from "@tauri-apps/api/core";

type FileIdentifier = {
  hash: string;
  path: string;
};

interface ChangesContext {
  changes: Partial<AllTags>;
  neededItems: { value: string; label: string; maxLength?: number }[];
  setChanges: (newPresent: Partial<AllTags>) => void;

  setSelected: Dispatch<SetStateAction<string[]>>;
  setFileTreeFolderSelected: Dispatch<SetStateAction<string[]>>;
  fileTreeFolderSelected: string[];
  setFilesToShow: Dispatch<SetStateAction<FileIdentifier[]>>;
  setFileTree: Dispatch<SetStateAction<RootFileTree>>;
  filesToShow: FileIdentifier[];
  selected: string[];
  fileTree: RootFileTree;
  initialDialogPage: number;
  saveChanges: () => void;
  albumId: string;
  setAlbumId: Dispatch<SetStateAction<string>>;

  showAlbumDialog: (page?: number) => void;
  closeAlbumDialog: () => void;
  clearChanges: () => void;
  files: File[];
  setFiles: Dispatch<SetStateAction<File[]>>;
  albumDialogOpen: boolean;

  albumDialogValues: Partial<Tags>;
  setAlbumDialogValues: Dispatch<SetStateAction<Partial<Tags>>>;
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
  albumId: "",
  setAlbumId: () => {
    throw new Error("setAlbumId function must be overridden");
  },
  setAlbumDialogValues: () => {
    throw new Error("setAlbumDialogValues function must be overridden");
  },
  albumDialogValues: {},
  setFileTreeFolderSelected: () => {
    throw new Error("setFileTreeFolderSelected function must be overridden");
  },
  fileTreeFolderSelected: [],
  setFilesToShow: () => {
    throw new Error("setFilesToShow function must be overridden");
  },
  closeAlbumDialog: () => {
    throw new Error("closeAlbumDialog function must be overridden");
  },
  neededItems: [],
  clearChanges: () => {
    throw new Error("clearChanges function must be overridden");
  },
  setFileTree: () => {
    throw new Error("clearChanges function must be overridden");
  },
  filesToShow: [],
  initialDialogPage: 0,
  fileTree: {
    disorgainzed: new Map(),
    organized: new Map(),
  },
  albumDialogOpen: false,
  showAlbumDialog: () => {
    throw new Error("showAlbumDialog function must be overridden");
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
  const { state, set, clear } = useHistoryState<Partial<AllTags>>({});

  const [files, setFiles] = useState<File[]>([]);
  const [filesToShow, setFilesToShow] = useState<FileIdentifier[]>([]);
  const [albumId, setAlbumId] = useState<string>("");
  const [initialDialogPage, setInitialDialogPage] = useState(0);
  const [fileTreeFolderSelected, setFileTreeFolderSelected] = useState<
    string[]
  >([]);
  const [historyState, setHistoryState] = useState<HistoryPayload>({
    canRedo: false,
    canUndo: false,
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [albumDialogOpen, setAlbumDialogOpen] = useState(false);
  const [albumDialogValues, setAlbumDialogValues] = useState<Partial<Tags>>({
    albumArtist: "",
    album: "",
    year: "",
    genre: "",
    copyright: "",
    attachedPicture: undefined,
  });

  const [fileTree, setFileTree] = useState<RootFileTree>({
    disorgainzed: new Map(),
    organized: new Map(),
  });

  const [saveBarNudge, setSaveBarNudge] = useState(0);
  const nudgeSaveBar = () => setSaveBarNudge((n) => n + 1);

  const hasUnsavedChanges =
    Object.keys(state || {}).length > 0 && selected.length > 0;

  const setChanges = (newPresent: Partial<AllTags>) => {
    set(newPresent);
  };

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
    setTimeout(() => {
      if (document?.body?.style) document.body.style.cssText = "";
    }, 0);
    if (!albumDialogOpen) {
      setAlbumDialogValues({});
      setInitialDialogPage(0);
      setAlbumId("");
    }
  }, [albumDialogOpen]);

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
    clear();
  };

  function showAlbumDialog(page?: number): void {
    if (page) {
      setInitialDialogPage(page);
    } else {
      setInitialDialogPage(0);
    }
    setAlbumDialogOpen(true);
  }

  function closeAlbumDialog(): void {
    setAlbumDialogOpen(false);
    setAlbumDialogValues({});
    setInitialDialogPage(0);
    setAlbumId("");
    setTimeout(() => {
      if (document?.body?.style) document.body.style.cssText = "";
    }, 0);
  }

  return (
    <ChangesContext.Provider
      value={{
        changes: state,
        neededItems: getNeededItems(),
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
        initialDialogPage,
        albumDialogOpen,
        albumId,
        setAlbumId,
        closeAlbumDialog,
        setAlbumDialogValues,
        showAlbumDialog,
        albumDialogValues,
        hasUnsavedChanges,
        nudgeSaveBar,
        saveBarNudge,
        canRedo: historyState.canUndo,
        canUndo: historyState.canRedo,
      }}
    >
      {children}
    </ChangesContext.Provider>
  );

  function toSerializableTags(
    input: Partial<AllTags>,
  ): Record<string, TagText | TagPicture> {
    const out: Record<string, TagText | TagPicture> = {};
    Object.entries(input).forEach(([key, val]) => {
      if (val === undefined || val === null) return;
      if (typeof val === "object" && "type" in val && "value" in val) {
        out[key.charAt(0).toUpperCase() + key.slice(1)] = val as any;
      } else if (typeof val === "string") {
        out[key.charAt(0).toUpperCase() + key.slice(1)] = {
          type: "Text",
          value: val,
        };
      }
    });
    return out;
  }

  async function saveChanges(): Promise<void> {
    const changes = state;
    if (!changes) return;
    if (!selected || selected.length === 0) return;

    const tags = toSerializableTags(changes);
    const frames = Object.entries(tags).map(([k, v]) => ({
      key: k,
      values: [v as any],
    }));

    try {
      await invoke("save_frame_changes", {
        frameChanges: { paths: selected, frames },
      });

      set({});
      toast.success("Changes saved successfully");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to save changes: ${message}`);
    }
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

interface HistoryPayload {
  canUndo: boolean;
  canRedo: boolean;
}
