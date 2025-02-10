"use client";
import {
  createContext,
  useContext,
  useState,
  Dispatch,
  SetStateAction,
  ReactNode,
} from "react";

import { Changes, AudioFile } from "@/types";
interface ImageData {
  mime: string;
  type: { id: number };
  description: string;
  imageBuffer: Buffer;
}
interface ChangesContxt {
  changes: Partial<AudioFile>;
  neededItems: { value: string; label: string; maxLength?: number }[];
  setChanges: Dispatch<SetStateAction<Partial<AudioFile>>>;
  setSelected: Dispatch<SetStateAction<string[]>>;
  selected: string[];
  imageData: ImageData | null;
  setImageData: Dispatch<SetStateAction<ImageData | null>>;
  saveChanges: () => void;
  files: AudioFile[];
  setFiles: Dispatch<SetStateAction<AudioFile[]>>;
}

const ChangesContext = createContext<ChangesContxt>({
  changes: {},
  neededItems: [],
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
  const [changes, setChanges] = useState<Partial<AudioFile>>({});
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [imageData, setImageData] = useState<{
    mime: string;
    type: { id: number; name?: string };
    description: string;
    imageBuffer: Buffer;
  } | null>(null);
  return (
    <ChangesContext.Provider
      value={{
        changes,
        neededItems: getNeededItems(),
        setChanges,
        saveChanges,
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
    if (!changes) return;
    if (!selected) return;
    console.log({ changes, selected });
    const parsedChanges: Partial<Changes> = {
      ...changes,
      paths: selected,
      image: imageData ? imageData : undefined,
    };

    window.app.save(parsedChanges);
    setChanges({});
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
