import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type CleanupContextType = {
  open: boolean;
  pattern: string;
  setPattern: (p: string) => void;
  paths: string[];
  start: (paths: string[]) => void;
  close: () => void;
};

const CleanupContext = createContext<CleanupContextType | null>(null);

export function useCleanup(): CleanupContextType {
  const ctx = useContext(CleanupContext);
  if (!ctx) throw new Error("useCleanup must be used within RenameProvider");
  return ctx;
}

export function CleanupProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [paths, setPaths] = useState<string[]>([]);
  const [pattern, setPattern] = useState<string>("{artist} - {title}.{ext}");

  const start = useCallback((p: string[]) => {
    setPaths(p);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ open, pattern, setPattern, start, close, paths }),
    [open, pattern, setPattern, start, close, paths]
  );

  return (
    <CleanupContext.Provider value={value}>{children}</CleanupContext.Provider>
  );
}
