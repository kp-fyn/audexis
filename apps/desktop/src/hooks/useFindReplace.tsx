import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  useRef,
} from "react";
import { useChanges } from "@/ui/hooks/useChanges";
import { invoke } from "@tauri-apps/api/core";

export type FindOptions = {
  caseSensitive: boolean;
  regex: boolean;
  wholeWord: boolean;
};

type Mode = "find" | "replace";

type Ctx = {
  open: boolean;
  mode: Mode;
  query: string;
  replaceWith: string;
  field: string;
  options: FindOptions;
  matches: number[];
  index: number;
  openFind: (field?: string) => void;
  openReplace: (field?: string) => void;
  close: () => void;
  setQuery: (q: string) => void;
  setReplaceWith: (r: string) => void;
  setField: (f: string) => void;
  setOptions: (o: Partial<FindOptions>) => void;
  next: () => void;
  prev: () => void;
  replaceOne: () => Promise<void>;
  replaceAll: () => Promise<void>;
};

const FindReplaceContext = createContext<Ctx | null>(null);

function buildMatcher(
  query: string,
  opts: FindOptions
): ((s: string) => boolean) | null {
  if (!query) return null;
  if (opts.regex) {
    try {
      const re = new RegExp(query, opts.caseSensitive ? "g" : "gi");
      console.log(re);
      return (s: string) => re.test(s ?? "");
    } catch {
      return null;
    }
  }
  const needle = opts.caseSensitive ? query : query.toLowerCase();
  if (opts.wholeWord) {
    const re = new RegExp(
      `\\b${query.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`,
      opts.caseSensitive ? "" : "i"
    );
    return (s: string) => re.test(s ?? "");
  }
  return (s: string) => {
    const hay = opts.caseSensitive ? s ?? "" : (s ?? "").toLowerCase();
    return hay.includes(needle);
  };
}

function applyReplace(
  orig: string,
  query: string,
  replacement: string,
  opts: FindOptions
): string {
  if (!query) return orig;
  if (opts.regex) {
    try {
      const re = new RegExp(query, opts.caseSensitive ? "g" : "gi");
      return (orig ?? "").replace(re, replacement);
    } catch {
      return orig;
    }
  }
  if (opts.wholeWord) {
    const re = new RegExp(
      `\\b${query.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`,
      opts.caseSensitive ? "g" : "gi"
    );
    return (orig ?? "").replace(re, replacement);
  }
  if (!opts.caseSensitive) {
    const re = new RegExp(
      query.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&"),
      "gi"
    );
    return (orig ?? "").replace(re, replacement);
  }
  return (orig ?? "").split(query).join(replacement);
}

export function FindReplaceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { files, setSelected, hasUnsavedChanges, nudgeSaveBar } = useChanges();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("find");
  const [query, setQuery] = useState("");
  const [replaceWith, setReplaceWith] = useState("");
  const [field, setField] = useState<string>("title");
  const [options, setOptionsState] = useState<FindOptions>({
    caseSensitive: false,
    regex: false,
    wholeWord: false,
  });
  const [active, setActive] = useState(0);
  const prevCriteriaRef = useRef<{
    query: string;
    field: string;
    options: FindOptions;
  }>({ query, field, options });

  const setOptions = useCallback((o: Partial<FindOptions>) => {
    setOptionsState((prev) => ({ ...prev, ...o }));
  }, []);

  const matches = useMemo(() => {
    const match = buildMatcher(query, options);
    if (!match) return [] as number[];
    const arr: number[] = [];
    files.forEach((f, idx) => {
      console.log(f);
      if (field === "all") {
        const t = f.tags as any;
        const any = Object.values(t).some(
          (v: any) =>
            v &&
            typeof v === "object" &&
            v.type === "Text" &&
            match(String(v.value ?? ""))
        );
        if (any) arr.push(idx);
      } else {
        const v = (f.tags as any)[field];
        if (
          v &&
          typeof v === "object" &&
          v.type === "Text" &&
          match(String(v.value ?? ""))
        )
          arr.push(idx);
      }
    });
    return arr;
  }, [files, field, options, query]);

  const focusMatch = useCallback(
    (idxInMatches: number) => {
      if (matches.length === 0) return;
      const bounded =
        ((idxInMatches % matches.length) + matches.length) % matches.length;
      setActive(bounded);
      const fileIndex = matches[bounded];
      const targetPath = files[fileIndex]?.path;
      if (!targetPath) return;
      if (hasUnsavedChanges) {
        nudgeSaveBar();
        return;
      }
      setSelected([targetPath]);
    },
    [matches, files, setSelected, hasUnsavedChanges, nudgeSaveBar]
  );

  const next = useCallback(() => focusMatch(active + 1), [active, focusMatch]);
  const prev = useCallback(() => focusMatch(active - 1), [active, focusMatch]);

  const replaceOne = useCallback(async () => {
    if (field === "all") return;
    if (matches.length === 0) return;
    const idx = matches[active];
    const file = files[idx];
    if (!file) return;
    const v = (file.tags as any)[field];
    if (!v || v.type !== "Text") return;
    const newVal = applyReplace(
      String(v.value ?? ""),
      query,
      replaceWith,
      options
    );
    if (newVal === String(v.value ?? "")) return;
    const key = field.charAt(0).toUpperCase() + field.slice(1);
    const frames = [
      {
        key,
        values: [{ type: "Text", value: newVal }],
      },
    ];
    await invoke("save_frame_changes", {
      frameChanges: { paths: [file.path], frames },
    });
  }, [active, matches, files, field, options, query, replaceWith]);

  const replaceAll = useCallback(async () => {
    if (field === "all") return;
    if (matches.length === 0) return;
    for (const m of matches) {
      const file = files[m];
      const v = (file.tags as any)[field];
      if (!v || v.type !== "Text") continue;
      const newVal = applyReplace(
        String(v.value ?? ""),
        query,
        replaceWith,
        options
      );
      if (newVal === String(v.value ?? "")) continue;
      const key = field.charAt(0).toUpperCase() + field.slice(1);
      const frames = [
        {
          key,
          values: [{ type: "Text", value: newVal }],
        },
      ];
      await invoke("save_frame_changes", {
        frameChanges: { paths: [file.path], frames },
      });
    }
  }, [matches, files, field, options, query, replaceWith]);

  const openFind = useCallback((f?: string) => {
    setMode("find");
    if (f) setField(f);
    setOpen(true);
  }, []);
  const openReplace = useCallback((f?: string) => {
    setMode("replace");
    if (f) setField(f);
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);

  const value: Ctx = {
    open,
    mode,
    query,
    replaceWith,
    field,
    options,
    matches,
    index: active,
    openFind,
    openReplace,
    close,
    setQuery,
    setReplaceWith,
    setField,
    setOptions,
    next,
    prev,
    replaceOne,
    replaceAll,
  };

  useEffect(() => {
    const prev = prevCriteriaRef.current;
    const changed =
      prev.query !== query ||
      prev.field !== field ||
      prev.options.caseSensitive !== options.caseSensitive ||
      prev.options.regex !== options.regex ||
      prev.options.wholeWord !== options.wholeWord;
    prevCriteriaRef.current = { query, field, options };
    if (!open) return;
    if (!changed) return;
    if (matches.length === 0) return;
    focusMatch(0);
  }, [open, query, field, options, matches, focusMatch]);
  useEffect(() => {
    function onOpen(e: Event) {
      const detail = (e as CustomEvent).detail || {};
      if (detail.mode === "replace") openReplace();
      else openFind();
    }
    function onNext() {
      next();
    }
    function onPrev() {
      prev();
    }
    function onReplaceOne() {
      if (open && mode === "replace") replaceOne();
    }
    function onReplaceAll() {
      if (open && mode === "replace") replaceAll();
    }
    window.addEventListener("audexis:find-open", onOpen as EventListener);
    window.addEventListener("audexis:find-next", onNext);
    window.addEventListener("audexis:find-prev", onPrev);
    window.addEventListener("audexis:replace-one", onReplaceOne);
    window.addEventListener("audexis:replace-all", onReplaceAll);
    return () => {
      window.removeEventListener("audexis:find-open", onOpen as EventListener);
      window.removeEventListener("audexis:find-next", onNext);
      window.removeEventListener("audexis:find-prev", onPrev);
      window.removeEventListener("audexis:replace-one", onReplaceOne);
      window.removeEventListener("audexis:replace-all", onReplaceAll);
    };
  }, [open, mode, next, prev, replaceOne, replaceAll, openFind, openReplace]);

  return (
    <FindReplaceContext.Provider value={value}>
      {children}
    </FindReplaceContext.Provider>
  );
}

export function useFindReplace() {
  const ctx = useContext(FindReplaceContext);
  if (!ctx)
    throw new Error("useFindReplace must be used within FindReplaceProvider");
  return ctx;
}
