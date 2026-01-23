import { useEffect, useMemo, useState } from "react";
import { Button } from "@/ui/components/Button";
import Select from "@/ui/components/Select";
import { TagPicture } from "@/ui/types";
import { invoke } from "@tauri-apps/api/core";
import { cn } from "@/ui/lib/utils";
import { Modal } from "./Modal";

type Item = {
  mime: string;
  data_base64: string;
  picture_type?: number;
  description?: string;
};

export interface ImageManagerModalProps {
  open: boolean;
  onClose: () => void;
  pictures: TagPicture[];
  onChange: (next: TagPicture[]) => void;
}

const PICTURE_TYPES = [
  { id: 3, name: "Front Cover" },
  { id: 4, name: "Back Cover" },
  { id: 0, name: "Other" },
  { id: 6, name: "Media (e.g., label side)" },
  { id: 8, name: "Leaflet Page" },
];

export function ImageManagerModal({
  open,
  onClose,
  pictures,
  onChange,
}: ImageManagerModalProps) {
  const initialItems = useMemo<Item[]>(() => {
    if (!pictures || pictures.length === 0) return [];

    return pictures.map((p) => p.value).filter((v) => !!v);
  }, [pictures]);
  const [items, setItems] = useState<Item[]>(initialItems);
  useEffect(() => {
    setItems(initialItems);
    setIndex(0);
  }, [initialItems]);

  const [index, setIndex] = useState(0);
  const [types] = useState<Record<number, number>>({});

  const current = items[index];

  const currentTypeId = current?.picture_type ?? types[index] ?? 3;
  const currentTypeName =
    PICTURE_TYPES.find((t) => t.id === currentTypeId)?.name || "Front Cover";
  const typeOptions = useMemo(
    () =>
      PICTURE_TYPES.map((t) => ({
        label: `${t.name} (${t.id})`,
        value: t.id.toString(),
      })),
    [],
  );

  const apply = (nextItems: Item[]) => {
    const nextPictures: TagPicture[] = nextItems.map((it) => ({
      type: "Picture",
      value: it,
    }));
    onChange(nextPictures);
    setItems(nextItems);
  };

  const addImage = async () => {
    try {
      const img: TagPicture | null = await invoke("import_image");
      if (!img) return;
      const next = [...items, img.value];
      apply(next);
    } catch (e) {
      console.error(e);
    }
  };

  const removeImage = () => {
    const next = items.filter((_, i) => i !== index);
    apply(next);
    setIndex((i) => (i > 0 ? i - 1 : 0));
  };

  const setPrimary = (i: number) => {
    if (i === 0) return;
    const next = [...items];
    const [picked] = next.splice(i, 1);
    next.unshift(picked);
    apply(next);
    setIndex(0);
  };
  const moveImage = (direction: "up" | "down") => {
    if (items.length < 2) return;
    const dest = direction === "up" ? index - 1 : index + 1;
    if (dest < 0 || dest >= items.length) return;
    const next = [...items];
    const [curr] = next.splice(index, 1);
    next.splice(dest, 0, curr);
    apply(next);
    setIndex(dest);
  };
  const updateType = (newType: number) => {
    const next = items.map((it, i) =>
      i === index ? { ...it, picture_type: newType } : it,
    );
    apply(next);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Artwork"
      description={`${items.length} image${items.length === 1 ? "" : "s"}`}
      zIndexClassName="z-[1200]"
      bodyClassName="p-0"
      footer={
        <Button variant="outline" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="flex flex-1 gap-4 p-6 overflow-hidden">
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <div className="text-xs uppercase tracking-wide text-foreground/60">
                Current Type
              </div>
              <div className="text-sm font-medium text-foreground">
                {currentTypeName}
              </div>
            </div>
            <div className="w-40 relative z-100000000">
              <Select
                disabled={!current}
                value={currentTypeId.toString()}
                onChange={(v) => updateType(Number(v))}
                placeholder="Select type"
                options={typeOptions}
                contentClassName="z-[100000001] border border-border bg-background/95 backdrop-blur-sm shadow-lg"
              />
            </div>
          </div>
          <div className="relative flex-1 min-h-0 rounded-md border border-border bg-muted/20 flex items-center justify-center">
            {current ? (
              current.mime && current.data_base64 ? (
                <img
                  alt="artwork"
                  className="max-h-full max-w-full object-contain"
                  src={`data:${current.mime};base64,${current.data_base64}`}
                />
              ) : (
                <div className="text-foreground/60 text-sm">No image data</div>
              )
            ) : (
              <div className="text-foreground/60 text-sm">No image</div>
            )}
          </div>
          {current?.description && (
            <div className="text-[11px] text-foreground/50 truncate px-1">
              Description: {current.description}
            </div>
          )}
          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => moveImage("up")}
              disabled={index === 0}
            >
              Up
            </Button>
            <Button
              variant="outline"
              onClick={() => moveImage("down")}
              disabled={index === items.length - 1}
            >
              Down
            </Button>
            <Button
              variant="ghost"
              onClick={() => setPrimary(index)}
              disabled={index === 0}
            >
              Make Primary
            </Button>
          </div>
        </div>

        <div className="w-64 shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground/70">Images</span>
            <span className="text-xs rounded bg-accent px-2 py-0.5 text-foreground/80">
              {items.length}
            </span>
          </div>
          <div className="flex-1 overflow-auto rounded border border-border divide-y divide-border">
            {items.map((it, i) => (
              <button
                key={i}
                className={cn(
                  "flex w-full items-center gap-2 p-2 hover:bg-muted/40",
                  i === index && "bg-muted/40",
                )}
                onClick={() => setIndex(i)}
              >
                <img
                  className="h-10 w-10 rounded object-cover"
                  src={
                    it.mime && it.data_base64
                      ? `data:${it.mime};base64,${it.data_base64}`
                      : undefined
                  }
                  alt={it.description || `Image ${i + 1}`}
                />
                <div className="flex-1 text-left">
                  <div className="text-xs font-medium text-foreground truncate">
                    {i === 0 ? "Primary" : `Image ${i + 1}`}
                  </div>
                  <div className="text-[10px] text-foreground/60 truncate">
                    {PICTURE_TYPES.find(
                      (t) =>
                        ((items[i] as Item)?.picture_type ?? types[i] ?? 3) ===
                        t.id,
                    )?.name || "Front Cover"}
                  </div>
                </div>
              </button>
            ))}
            {items.length === 0 && (
              <div className="p-3 text-sm text-foreground/60">
                No images yet
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={addImage}>
              Add image
            </Button>
            <Button
              className="flex-1"
              variant="outline"
              onClick={removeImage}
              disabled={items.length === 0}
            >
              Remove
            </Button>
          </div>
          <div className="text-[10px] text-foreground/60">
            Reorder and adjust types. Defaults to Front Cover when absent.
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default ImageManagerModal;
