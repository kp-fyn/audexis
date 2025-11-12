import { useState } from "react";
import { cn } from "@/ui/lib/utils";
import type { UserTextEntry, UserUrlEntry } from "@/ui/types";

export interface UserFramesEditorProps {
  textItems: UserTextEntry[];
  urlItems: UserUrlEntry[];
  disabled?: boolean;
  onChangeText: (next: UserTextEntry[]) => void;
  onChangeUrl: (next: UserUrlEntry[]) => void;
}

function Row({
  item,
  onChange,
  onRemove,
  disabled,
  kind,
}: {
  item: UserTextEntry | UserUrlEntry;
  onChange: (next: UserTextEntry | UserUrlEntry) => void;
  onRemove: () => void;
  disabled?: boolean;
  kind: "text" | "url";
}) {
  return (
    <div className={cn("grid grid-cols-5 gap-2 items-center")}>
      <input
        className="col-span-2 rounded border border-border bg-background px-2 py-1 text-xs outline-none"
        placeholder="Description"
        value={item.description}
        disabled={disabled}
        onChange={(e) => onChange({ ...item, description: e.target.value })}
      />
      <input
        className="col-span-2 rounded border border-border bg-background px-2 py-1 text-xs outline-none"
        placeholder={kind === "text" ? "Value" : "URL"}
        value={
          kind === "text"
            ? (item as UserTextEntry).value
            : (item as UserUrlEntry).url
        }
        disabled={disabled}
        onChange={(e) =>
          onChange(
            kind === "text"
              ? { ...(item as UserTextEntry), value: e.target.value }
              : { ...(item as UserUrlEntry), url: e.target.value }
          )
        }
      />
      <button
        type="button"
        className="rounded border border-border bg-accent/40 px-2 py-1 text-xs text-foreground/90 hover:bg-accent"
        onClick={onRemove}
        disabled={disabled}
      >
        Remove
      </button>
    </div>
  );
}

export function UserFramesEditor({
  textItems,
  urlItems,
  disabled,
  onChangeText,
  onChangeUrl,
}: UserFramesEditorProps) {
  const [addingText, setAddingText] = useState(false);
  const [addingUrl, setAddingUrl] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="text-xs font-semibold text-foreground/70">
          User Defined Text (TXXX)
        </div>
        <div className="flex flex-col gap-2">
          {textItems.map((it, i) => (
            <Row
              key={i}
              item={it}
              kind="text"
              disabled={disabled}
              onChange={(next) => {
                const arr = [...textItems];
                arr[i] = next as UserTextEntry;
                onChangeText(arr);
              }}
              onRemove={() => {
                const arr = textItems.filter((_, idx) => idx !== i);
                onChangeText(arr);
              }}
            />
          ))}
          {!disabled && (
            <button
              type="button"
              onClick={() => {
                setAddingText(true);
                onChangeText([...textItems, { description: "", value: "" }]);
              }}
              className="self-start rounded border border-border bg-background px-2 py-1 text-xs hover:bg-muted"
              disabled={addingText}
            >
              + Add Text Frame
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-xs font-semibold text-foreground/70">
          User Defined URL (WXXX)
        </div>
        <div className="flex flex-col gap-2">
          {urlItems.map((it, i) => (
            <Row
              key={i}
              item={it}
              kind="url"
              disabled={disabled}
              onChange={(next) => {
                const arr = [...urlItems];
                arr[i] = next as UserUrlEntry;
                onChangeUrl(arr);
              }}
              onRemove={() => {
                const arr = urlItems.filter((_, idx) => idx !== i);
                onChangeUrl(arr);
              }}
            />
          ))}
          {!disabled && (
            <button
              type="button"
              onClick={() => {
                setAddingUrl(true);
                onChangeUrl([...urlItems, { description: "", url: "" }]);
              }}
              className="self-start rounded border border-border bg-background px-2 py-1 text-xs hover:bg-muted"
              disabled={addingUrl}
            >
              + Add URL Frame
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserFramesEditor;
