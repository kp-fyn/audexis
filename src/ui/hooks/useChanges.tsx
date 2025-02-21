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

import { Changes, AudioFile, UploadedImage } from "@/types";

interface ChangesContxt {
  changes: Partial<AudioFile>;
  neededItems: { value: string; label: string; maxLength?: number }[];
  setChanges: (newPresent: Partial<AudioFile>) => void;
  setSelected: Dispatch<SetStateAction<string[]>>;
  selected: string[];
  imageData: UploadedImage | null;
  setImageData: Dispatch<SetStateAction<UploadedImage | null>>;
  saveChanges: () => void;
  clearChanges: () => void;
  files: AudioFile[];
  setFiles: Dispatch<SetStateAction<AudioFile[]>>;
}

const ChangesContext = createContext<ChangesContxt>({
  changes: {},
  neededItems: [],
  clearChanges: () => {
    throw new Error("clearChanges function must be overridden");
  },
  imageData: null,
  setImageData: () => {
    throw new Error("setImageData function must be overridden");
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

// eslint-disable-next-line react-refresh/only-export-components
export function useChanges(): ChangesContxt {
  const context = useContext(ChangesContext);

  if (!context) {
    throw new Error("useChanges must be used within a SidebarWidthProvider");
  }
  return context;
}

export function ChangesProvider({ children }: { children: ReactNode }) {
  const { state, set, undo, redo, clear, canUndo, canRedo } = useHistoryState<
    Partial<AudioFile>
  >({});

  const [files, setFiles] = useState<AudioFile[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [imageData, setImageData] = useState<UploadedImage | null>(null);
  useEffect(() => {
    window.app.onUndo(() => {
      if (canUndo) undo();
    });
    window.app.onRedo(() => {
      if (canRedo) redo();
    });
  }, []);

  return (
    <ChangesContext.Provider
      value={{
        changes: state,
        neededItems: getNeededItems(),
        setChanges: set,
        saveChanges,
        clearChanges: clear,
        selected,
        imageData,
        setImageData,
        setSelected,
        files,
        setFiles,
      }}
    >
      {children}
    </ChangesContext.Provider>
  );

  function saveChanges() {
    const changes = state;
    if (!changes) return;
    if (!selected) return;
    console.log(changes);
    const parsedChanges: Partial<Changes> = {
      ...changes,
      paths: selected,
      attachedPicture: changes.attachedPicture
        ? changes.attachedPicture
        : imageData
        ? imageData
        : undefined,
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
