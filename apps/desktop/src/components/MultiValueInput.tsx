import { useState } from "react";
import { cn } from "@/ui/lib/utils";

export interface MultiValueInputProps {
  label: string;
  values: string[];
  placeholder?: string;
  disabled?: boolean;
  onChange: (next: string[]) => void;
  maxItems?: number;
}

export function MultiValueInput({
  label,
  values,
  placeholder,
  disabled,
  onChange,
  maxItems = 64,
}: MultiValueInputProps) {
  const [draft, setDraft] = useState("");

  const addValue = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (values.includes(trimmed)) {
      setDraft("");
      return;
    }
    if (values.length >= maxItems) return;
    onChange([...values, trimmed]);
    setDraft("");
  };

  const removeAt = (i: number) => {
    const next = values.filter((_, idx) => idx !== i);
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs font-medium text-foreground/70">{label}</div>
      <div
        className={cn(
          "flex flex-wrap gap-1 rounded border border-border p-2 min-h-10 bg-background",
          disabled && "opacity-50"
        )}
      >
        {values.map((v, i) => (
          <span
            key={v + i}
            className="group inline-flex items-center gap-1 rounded bg-accent/40 px-2 py-0.5 text-xs text-foreground"
          >
            {v}
            {!disabled && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (i === 0) return;
                    const next = [...values];
                    const [item] = next.splice(i, 1);
                    next.splice(i - 1, 0, item);
                    onChange(next);
                  }}
                  className="opacity-30 group-hover:opacity-70 transition text-[10px]"
                  aria-label={`Move ${v} up`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (i === values.length - 1) return;
                    const next = [...values];
                    const [item] = next.splice(i, 1);
                    next.splice(i + 1, 0, item);
                    onChange(next);
                  }}
                  className="opacity-30 group-hover:opacity-70 transition text-[10px]"
                  aria-label={`Move ${v} down`}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="opacity-40 group-hover:opacity-80 transition"
                  aria-label={`Remove ${v}`}
                >
                  ×
                </button>
              </>
            )}
          </span>
        ))}
        {!disabled && (
          <input
            className="flex-1 min-w-[120px] bg-transparent text-xs outline-none"
            placeholder={placeholder || "Add value and press Enter"}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addValue();
              }
              if (e.key === "Backspace" && draft === "" && values.length) {
                removeAt(values.length - 1);
              }
            }}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
}

export default MultiValueInput;
