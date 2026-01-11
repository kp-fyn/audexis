import { useCallback, useEffect, useRef } from "react";
import { useFindReplace } from "@/ui/hooks/useFindReplace";
import Select from "@/ui/components/Select";
import { useChanges } from "../hooks/useChanges";
import { Checkbox } from "./Checkbox";
import { useUserConfig } from "../hooks/useUserConfig";

export default function FindReplaceBar() {
  const {
    open,
    mode,
    query,
    replaceWith,
    field,
    options,
    matches,
    index,
    close,
    setQuery,
    setReplaceWith,
    setField,
    setOptions,
    next,
    prev,
    replaceOne,
    replaceAll,
  } = useFindReplace();
  const findRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => findRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) {
          prev();
          return;
        }
        if (mode === "replace" && field !== "all") {
          void replaceOne();
        } else {
          next();
        }
      }
    },
    [close, next, prev, mode, field, replaceOne]
  );

  if (!open) return null;

  const { config } = useUserConfig();
  const { sidebar_items } = config;
  return (
    <div
      onKeyDown={onKeyDown}
      className="fixed right-3 top-[52px] z-[1100] rounded-md border border-border bg-background/95 shadow-lg p-2 flex items-center gap-2"
    >
      <input
        ref={findRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Find"
        className="h-7 w-52 text-sm px-2 rounded border border-border bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      {mode === "replace" && (
        <input
          value={replaceWith}
          onChange={(e) => setReplaceWith(e.target.value)}
          placeholder="Replace"
          className="h-7 w-52 text-sm px-2 rounded border border-border bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      )}
      <Select
        value={field as string}
        onChange={(v) => setField(v as any)}
        options={[...sidebar_items, { value: "all", label: "All (find only)" }]}
        placeholder="Field"
        className="w-44"
        size="sm"
        ariaLabel="Find field selector"
      />

      <label className="text-xs flex items-center gap-1">
        <Checkbox
          checked={options.caseSensitive}
          onCheckedChange={(checked) =>
            setOptions({ caseSensitive: checked ? true : false })
          }
        />
        Aa
      </label>
      <label className="text-xs flex items-center gap-1">
        <Checkbox
          checked={options.wholeWord}
          onCheckedChange={(checked) =>
            setOptions({ wholeWord: checked ? true : false })
          }
        />
        Word
      </label>
      <label className="text-xs flex items-center gap-1">
        <Checkbox
          checked={options.regex}
          onCheckedChange={(checked) =>
            setOptions({ regex: checked ? true : false })
          }
        />
        Regex
      </label>

      <div className="text-xs text-foreground/70 w-20 text-center">
        {matches.length > 0 ? `${index + 1}/${matches.length}` : "0/0"}
      </div>
      <button
        onClick={prev}
        className="h-7 px-2 text-xs rounded border border-border hover:bg-muted/30"
      >
        Prev
      </button>
      <button
        onClick={next}
        className="h-7 px-2 text-xs rounded border border-border hover:bg-muted/30"
      >
        Next
      </button>
      {mode === "replace" && field !== "all" && (
        <>
          <button
            onClick={replaceOne}
            className="h-7 px-2 text-xs rounded border border-primary/50 bg-primary/20 hover:bg-primary/30"
          >
            Replace
          </button>
          <button
            onClick={replaceAll}
            className="h-7 px-2 text-xs rounded border border-primary/60 bg-primary/25 hover:bg-primary/35"
          >
            Replace All
          </button>
        </>
      )}
      <button
        onClick={close}
        className="h-7 px-2 text-xs rounded border border-border hover:bg-muted/30"
      >
        Close
      </button>
    </div>
  );
}
