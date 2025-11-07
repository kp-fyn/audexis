import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRename } from "@/ui/hooks/useRename";
import { useChanges } from "@/ui/hooks/useChanges";
import type { File } from "@/ui/types";
import { invoke } from "@tauri-apps/api/core";

function sanitizeFilename(name: string) {
  const invalid = /[\\/:*?"<>|]/g;
  return name
    .trim()
    .replace(invalid, "_")
    .replace(/\s+/g, " ")
    .replace(/^\.+|\.+$/g, "");
}

function applyPatternFrontend(file: File, pattern: string): string {
  const map: Record<string, string> = {};
  const tags = file.tags as any;
  Object.keys(tags).forEach((k) => {
    const v = tags[k];
    if (v && typeof v === "object" && "type" in v && v.type === "Text") {
      map[k] = String(v.value ?? "");
    }
  });
  const ext = file.path.split(".").pop() || "";
  map["ext"] = ext;

  const replaced = pattern.replace(/\{([^}]+)\}/g, (_m, key) => {
    const k = String(key);
    return map[k] ?? "";
  });

  const s = sanitizeFilename(replaced);
  if (s.toLowerCase().endsWith(`.${ext.toLowerCase()}`)) return s;
  return ext ? `${s}.${ext}` : s;
}

export default function RenameModal() {
  const { open, close, paths, pattern, setPattern } = useRename();
  const { files } = useChanges();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstRef = useRef<HTMLInputElement | null>(null);
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);
  const [closing, setClosing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<null | Array<{
    old: string;
    new: string;
    ok: boolean;
    error?: string;
  }>>(null);

  useEffect(() => {
    if (!open) return;
    let root = document.getElementById("modal-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "modal-root";
      document.body.appendChild(root);
    }
    setPortalNode(root);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setTimeout(() => firstRef.current?.focus(), 30);
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const selectedFiles = useMemo(() => {
    const set = new Set(paths);
    return files.filter((f) => set.has(f.path));
  }, [files, paths]);

  const preview = useMemo(() => {
    const items = selectedFiles.map((f) => ({
      file: f,
      current: f.path.split("/").pop() || f.path,
      next: applyPatternFrontend(f, pattern),
    }));
    const counts: Record<string, number> = {};
    items.forEach((i) => {
      counts[i.next] = (counts[i.next] || 0) + 1;
    });
    return items.map((i) => ({ ...i, duplicate: counts[i.next] > 1 }));
  }, [selectedFiles, pattern]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setResult(null);
      setBusy(false);
      close();
    }, 160);
  }, [close]);

  const doRename = useCallback(async () => {
    setBusy(true);
    try {
      const res: Array<{
        old: string;
        new: string;
        ok: boolean;
        error?: string;
      }> = await invoke("rename_files", { pattern, paths });
      setResult(res);
    } finally {
      setBusy(false);
    }
  }, [pattern, paths]);

  if (!open || !portalNode) return null;

  return createPortal(
    <div
      aria-modal="true"
      role="dialog"
      aria-labelledby="rename-modal-title"
      className="fixed inset-0 z-[1200] flex items-center justify-center p-4 md:p-8"
    >
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm border-t border-border animate-in fade-in"
        onClick={handleClose}
      />
      <span tabIndex={0} aria-hidden="true" />
      <div
        ref={dialogRef}
        className={`relative w-full max-w-3xl rounded-lg border border-border bg-gradient-to-b from-background/95 to-background/80 shadow-xl ring-1 ring-border/50 overflow-hidden animate-in ${
          closing ? "animate-out fade-out zoom-out-95" : "zoom-in-90"
        } duration-150`}
      >
        <div className="flex items-center gap-4 px-6 h-14 border-b border-border/60 bg-background/70 backdrop-blur-sm">
          <h2
            id="rename-modal-title"
            className="text-sm font-semibold tracking-wide uppercase text-foreground/70"
          >
            Rename Files
          </h2>
          <span className="text-[11px] text-foreground/50 font-medium">
            Use {"{"}placeholders{"}"} like {"{"}artist{"}"}, {"{"}title{"}"},{" "}
            {"{"}ext{"}"}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleClose}
              className="group h-8 w-8 rounded-md border border-border/60 bg-background/40 hover:bg-destructive/10 hover:border-destructive/50 transition-all duration-200 flex items-center justify-center"
              aria-label="Close"
            >
              <span className="text-foreground/60 group-hover:text-destructive text-lg leading-none transition-colors">
                ×
              </span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-foreground/70 w-28">Pattern</label>
            <input
              ref={firstRef}
              className="flex-1 text-sm px-2 py-1.5 rounded-md border border-border bg-background/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="{artist} - {title}.{ext}"
            />
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
                {preview.map((p, i) => (
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
                ))}
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
                      <strong>{ok}</strong> renamed, <strong>{fail}</strong>{" "}
                      failed.
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
        </div>

        <div className="flex items-center justify-end gap-2 px-6 h-14 border-t border-border/60 bg-background/70 backdrop-blur-sm">
          <div className="mr-auto text-[10px] text-foreground/40 uppercase tracking-wide">
            Esc to close
          </div>
          <button
            onClick={handleClose}
            className="text-xs px-3 py-1.5 rounded-md border border-border bg-muted/30 hover:bg-primary/10 hover:border-primary/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={doRename}
            disabled={busy || preview.length === 0}
            className="text-xs px-3 py-1.5 rounded-md border border-primary/50 bg-primary/25 text-foreground hover:bg-primary/35 transition-colors disabled:opacity-50"
          >
            {busy ? "Renaming…" : "Rename"}
          </button>
        </div>
      </div>
      <span tabIndex={0} aria-hidden="true" />
    </div>,
    portalNode
  );
}
