import React, { createContext, useCallback, useContext, useState } from "react";
import { useChanges } from "./useChanges";

type RenameContextType = {
  open: boolean;
  paths: string[];
  pattern: string;
  setPattern: (p: string) => void;
  start: (paths: string, pattern: string) => void;
  close: () => void;
};

const RenameContext = createContext<RenameContextType | null>(null);

export function useRename(): RenameContextType {
  const ctx = useContext(RenameContext);
  if (!ctx) throw new Error("useRename must be used within RenameProvider");
  return ctx;
}

export function RenameProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [paths, setPaths] = useState<string[]>([]);
  const [pattern, setPattern] = useState<string>("{artist} - {title}.{ext}");
  const { selected } = useChanges();

  const start = (p: string, pat: string) => {
    const f = selected;
    let targets: string[] = [];
    if (f.has(p)) {
      targets = [...f];
    } else {
      targets = [p];
    }
    setPaths(targets);

    if (pat) setPattern(pat);
    setOpen(true);
  };

  const close = useCallback(() => setOpen(false), []);

  return (
    <RenameContext.Provider
      value={{ open, paths, pattern, setPattern, start, close }}
    >
      {children}
    </RenameContext.Provider>
  );
}
