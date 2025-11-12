import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/ui/components/Button";
import { cn } from "@/ui/lib/utils";

interface Props {
  open: boolean;
  title?: string;
  values: string[];
  onSave: (vals: string[]) => void;
  onClose: () => void;
}

export default function ValueListEditor({
  open,
  title = "Edit Values",
  values,
  onSave,
  onClose,
}: Props) {
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);
  const [items, setItems] = useState<string[]>(values || []);

  useEffect(() => {
    if (!open) return;
    let root = document.getElementById("modal-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "modal-root";
      document.body.appendChild(root);
    }
    setPortalNode(root);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => setItems(values || []), [values]);

  if (!open || !portalNode) return null;

  const add = () => setItems((arr) => [...arr, ""]);
  const remove = (i: number) =>
    setItems((arr) => arr.filter((_, idx) => idx !== i));
  const update = (i: number, v: string) =>
    setItems((arr) => arr.map((x, idx) => (idx === i ? v : x)));

  const save = () => onSave(items);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={cn(
          "relative max-h-[70vh] w-full max-w-lg overflow-hidden rounded-lg border border-border bg-background shadow-2xl",
          "flex flex-col"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="text-sm font-semibold text-foreground">{title}</div>
          <button
            onClick={onClose}
            className="text-foreground/70 hover:text-foreground"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="p-5 space-y-2 overflow-auto">
          {items.length === 0 && (
            <div className="text-sm text-foreground/60">No values</div>
          )}
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className="flex-1 text-sm rounded border border-border bg-background px-2 py-1 outline-none focus:ring-2 focus:ring-primary/30"
                value={it}
                onChange={(e) => update(i, e.target.value)}
                placeholder={`Value ${i + 1}`}
              />
              <Button variant="outline" onClick={() => remove(i)}>
                Remove
              </Button>
            </div>
          ))}
          <div>
            <Button variant="outline" onClick={add}>
              Add value
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </div>
      </div>
    </div>,
    portalNode
  );
}
