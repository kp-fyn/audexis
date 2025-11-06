import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type RenameContextType = {
  open: boolean;
  paths: string[];
  pattern: string;
  setPattern: (p: string) => void;
  start: (paths: string[], pattern?: string) => void;
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

  const start = useCallback((p: string[], pat?: string) => {
    setPaths(p);
    if (pat) setPattern(pat);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ open, paths, pattern, setPattern, start, close }),
    [open, paths, pattern, setPattern, start, close]
  );

  return (
    <RenameContext.Provider value={value}>{children}</RenameContext.Provider>
  );
}
