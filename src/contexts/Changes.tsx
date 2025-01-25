"use client";
import React, { createContext, useContext, useState } from "react";

import { Changes, MusicMetadataFile } from "../../electron/electron-env";

interface ChangesContxt {
  changes: Partial<MusicMetadataFile>;
  setChanges: React.Dispatch<React.SetStateAction<Partial<MusicMetadataFile>>>;
  setIndex: React.Dispatch<React.SetStateAction<number[]>>;
  index: number[];
  saveChanges: () => void;
  files: MusicMetadataFile[];
  setFiles: React.Dispatch<React.SetStateAction<MusicMetadataFile[]>>;
}

const ChangesContext = createContext<ChangesContxt>({
  changes: {},
  setChanges: () => {},
  saveChanges: () => {},
  setIndex: () => {},
  index: [],
  files: [],
  setFiles: () => {},
});

export const useChanges = (): ChangesContxt => {
  const context = useContext(ChangesContext);

  if (!context) {
    throw new Error("useChanges must be used within a SidebarWidthProvider");
  }
  return context;
};

export const ChangesProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  // const { width } = useWindowDimensions();
  const [changes, setChanges] = useState<Partial<MusicMetadataFile>>({});
  const [files, setFiles] = useState<MusicMetadataFile[]>([]);
  const [index, setIndex] = useState<number[]>([]);
  // useEffect(() => {
  //   if (width / 4 >= 300) {
  //     setSidebarWidth(`${width / 4}px`);
  //   } else {
  //     setSidebarWidth(`300px`);
  //   }
  // }, [width]);
  return (
    <ChangesContext.Provider
      value={{
        changes,
        setChanges,
        saveChanges,
        index,
        setIndex,
        files,
        setFiles,
      }}
    >
      {children}
    </ChangesContext.Provider>
  );

  function saveChanges() {
    if (!changes) return;
    if (!index) return;
    const parsedChanges: Partial<Changes> = { ...changes, paths: [] };
    index.map((i) => {
      if (!files[i]) return;
      if (!parsedChanges.paths) {
        parsedChanges.paths = [files[i].path];
      } else {
        parsedChanges.paths.push(files[i].path);
      }
    });

    window.electronAPI.save(parsedChanges);
    setChanges({});
  }
};
