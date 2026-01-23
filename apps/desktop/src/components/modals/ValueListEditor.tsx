import { useEffect, useState } from "react";
import { Button } from "@/ui/components/Button";
import { Modal } from "./Modal";

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
  const [items, setItems] = useState<string[]>(values || []);

  useEffect(() => setItems(values || []), [values]);

  const add = () => setItems((arr) => [...arr, ""]);
  const remove = (i: number) =>
    setItems((arr) => arr.filter((_, idx) => idx !== i));
  const update = (i: number, v: string) =>
    setItems((arr) => arr.map((x, idx) => (idx === i ? v : x)));

  const save = () => onSave(items);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      bodyClassName="p-5 space-y-2"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </>
      }
    >
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
    </Modal>
  );
}
