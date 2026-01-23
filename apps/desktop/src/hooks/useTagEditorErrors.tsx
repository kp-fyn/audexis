import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  Dispatch,
  SetStateAction,
  useEffect,
} from "react";
import type { BackendError } from "@/ui/types";
type TagEditorErrorsContextType = {
  isOpen: boolean;
  close: () => void;
  errors: BackendError[][];
  setErrors: Dispatch<SetStateAction<BackendError[][]>>;
};

const TagEditorErrorsContext = createContext<TagEditorErrorsContextType | null>(
  null,
);

export function useTagEditorErrors(): TagEditorErrorsContextType {
  const ctx = useContext(TagEditorErrorsContext);
  if (!ctx)
    throw new Error(
      "useTagEditorErrors must be used within TagEditorErrorsProvider",
    );
  return ctx;
}

export function TagEditorErrorsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [errors, setErrors] = useState<BackendError[][]>([]);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ isOpen, open, close, errors, setErrors }),
    [isOpen, open, close, errors, setErrors],
  );
  useEffect(() => {
    if (errors.length > 0) {
      setIsOpen(true);
    }
    console.log("Errors updated:", errors);
  }, [errors]);

  return (
    <TagEditorErrorsContext.Provider value={value}>
      {children}
    </TagEditorErrorsContext.Provider>
  );
}
