// TODO: Add preview of changes before applying
import { useCallback, useState } from "react";

import { invoke } from "@tauri-apps/api/core";
import { useCleanup } from "../../hooks/useCleanup";
import { Checkbox } from "../Checkbox";
import { Modal, useAnimatedModalClose } from "./Modal";

const cleanupOptions = [
  {
    id: "replaceUnderscores",
    label: "Replace underscores with spaces",
    key: "replace_underscores",
  },
  {
    id: "normalizeDashes",
    label: "Normalize dashes to en-dash",
    key: "normalize_dashes",
  },
  {
    id: "fixCapitalization",
    label: "Fix capitalization",
    key: "fix_capitalization",
  },
  {
    id: "trimWhitespace",
    label: "Trim leading & trailing spaces",
    key: "trim_whitespace",
  },
  {
    id: "collapseSpaces",
    label: "Collapse duplicate spaces",
    key: "collapse_spaces",
  },

  {
    id: "removeSuffixes",
    label: "Remove common suffixes (final, mixdown, v2, master)",
    key: "remove_suffixes",
  },
  {
    id: "normalizeFeat",
    label: "Normalize 'feat.' formatting",
    key: "normalize_feat",
  },
];

export function CleanupModal() {
  const { open, close, paths } = useCleanup();
  const [busy, setBusy] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [result, setResult] = useState<null | Array<{
    old: string;
    new: string;
    ok: boolean;
    error?: string;
  }>>(null);

  const { closing, requestClose } = useAnimatedModalClose(() => {
    setResult(null);
    setBusy(false);
    close();
  }, 160);

  const doRename = useCallback(async () => {
    setBusy(true);

    try {
      const res: Array<{
        old: string;
        new: string;
        ok: boolean;
        error?: string;
      }> = await invoke("clean_up_file_names", { options, paths });

      setResult(res);
    } finally {
      setBusy(false);
    }
  }, [options, paths]);

  return (
    <Modal
      open={open}
      onClose={requestClose}
      closing={closing}
      title="Clean up File Names"
      description={
        <>
          Use {"{"}placeholders{"}"} like {"{"}artist{"}"}, {"{"}title{"}"},{" "}
          {"{"}ext{"}"}
        </>
      }
      bodyClassName="p-6 space-y-4"
      footer={
        <>
          <div className="mr-auto text-[10px] text-foreground/40 uppercase tracking-wide">
            Esc to close
          </div>
          <button
            onClick={requestClose}
            className="text-xs px-3 py-1.5 rounded-md border border-border bg-muted/30 hover:bg-primary/10 hover:border-primary/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={doRename}
            disabled={busy || options.length === 0}
            className="text-xs px-3 py-1.5 rounded-md border border-primary/50 bg-primary/25 text-foreground hover:bg-primary/35 transition-colors disabled:opacity-50"
          >
            {busy ? "Renaming…" : "Rename"}
          </button>
        </>
      }
    >
      <div className="flex flex-col  gap-2">
        <label className="text-xs text-foreground/70 w-28">Pattern</label>
        {cleanupOptions.map((option) => (
          <div className="flex flex-row items-center gap-2" key={option.id}>
            <Checkbox
              id={option.id}
              onCheckedChange={(checked) => {
                if (checked) {
                  setOptions((prev) => [...prev, option.key]);
                } else {
                  setOptions((prev) => prev.filter((k) => k !== option.key));
                }
              }}
            />
            <label
              className="text-muted-foreground text-sm select-none"
              htmlFor={option.id}
            >
              {option.label}
            </label>
          </div>
        ))}
        <div className="flex flex-col"></div>
      </div>

      <div className="max-h-72 overflow-auto custom-scrollbar border border-border/60 rounded-md">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-background/80 backdrop-blur-sm">
            <tr className="text-foreground/60">
              <th className="text-left p-2 font-medium">Current</th>
              <th className="text-left p-2 font-medium">New name</th>
            </tr>
          </thead>
          <tbody>
            {/* {preview.map((p, i) => (
                  <tr key={i} className="border-t border-border/40">
                    <td className="p-2 font-mono text-[11px] text-foreground/80">
                      {p.current}
                    </td>
                    <td
                      className={`p-2 font-mono text-[11px] ${
                        p.duplicate ? "text-amber-600" : "text-foreground"
                      }`}
                    >
                      {p.next || (
                        <span className="text-foreground/50">(empty)</span>
                      )}
                    </td>
                  </tr>
                ))} */}
          </tbody>
        </table>
      </div>

      {result && (
        <div className="text-xs border border-border/60 rounded-md p-3 bg-muted/10">
          {(() => {
            const ok = result.filter((r) => r.ok).length;
            const fail = result.length - ok;
            return (
              <div className="space-y-2">
                <div>
                  <strong>{ok}</strong> renamed, <strong>{fail}</strong> failed.
                </div>
                {fail > 0 && (
                  <ul className="list-disc pl-5 space-y-1 max-h-36 overflow-auto">
                    {result
                      .filter((r) => !r.ok)
                      .map((r, idx) => (
                        <li key={idx} className="text-destructive/80">
                          {r.old} → {r.new}: {r.error}
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </Modal>
  );
}
