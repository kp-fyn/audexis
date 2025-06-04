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

import { Changes, AudioFile, RootFileTree, Tags, FileNode } from "./../../../types";
type FileIdentifier = {
  hash: string;
  path: string;
};
interface ChangesContxt {
  changes: Partial<AudioFile>;
  neededItems: { value: string; label: string; maxLength?: number }[];
  setChanges: (newPresent: Partial<AudioFile>) => void;
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
  files: FileNode[];
  setFiles: Dispatch<SetStateAction<FileNode[]>>;
  albumDialogOpen: boolean;

  albumDialogValues: Partial<Tags>;
  setAlbumDialogValues: Dispatch<SetStateAction<Partial<Tags>>>;
}

const ChangesContext = createContext<ChangesContxt>({
  changes: {},
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
    console.log("closeAlbumDialog function must be overridden");
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
    console.log("showAlbumDialog function must be overridden");
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

  const [files, setFiles] = useState<FileNode[]>([]);
  const [filesToShow, setFilesToShow] = useState<FileIdentifier[]>([]);
  const [albumId, setAlbumId] = useState<string>("");
  const [initialDialogPage, setInitialDialogPage] = useState(0);
  const [fileTreeFolderSelected, setFileTreeFolderSelected] = useState<string[]>([]);
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
  useEffect(() => {
    setTimeout(() => {
      document.body.style = "";
    }, 0);
    if (!albumDialogOpen) {
      setAlbumDialogValues({});
      setInitialDialogPage(0);
      setAlbumId("");
    }
  }, [albumDialogOpen]);

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
      document.body.style = "";
    }, 0);
  }
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
        initialDialogPage,
        albumDialogOpen,
        albumId,
        setAlbumId,
        closeAlbumDialog,
        setAlbumDialogValues,
        showAlbumDialog,
        albumDialogValues,
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
    console.log("saved");
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
