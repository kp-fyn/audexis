import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import DragCell from "@/ui/components/table/DragCell";
import { ContextMenuArea } from "@/ui/components/ContextMenu";
import { File } from "@/ui/types";
import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useChanges } from "@/ui/hooks/useChanges";
import { useRename } from "@/ui/hooks/useRename";
import { useCleanup } from "@/ui/hooks/useCleanup";
import { Table } from "@tanstack/react-table";

type DataGridProps = {
  table: Table<File>;
  files: File[];
  selected: string[];
  setSelected: (ids: string[]) => void;
  columnOrder: string[];
};

export default function DataGrid({
  table,
  files,
  selected,
  setSelected,
  columnOrder,
}: DataGridProps) {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const lastInteractedIndexRef = useRef<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const { hasUnsavedChanges, nudgeSaveBar } = useChanges();
  const { start: startRename } = useRename();
  const { start: startCleanup } = useCleanup();

  const getIdAt = (index: number) =>
    table.getSortedRowModel().rows[index].original.path;
  const setSelection = (ids: string[]) => setSelected(Array.from(new Set(ids)));

  function selectSingle(path: string) {
    if (hasUnsavedChanges) {
      nudgeSaveBar();
      return;
    }

    console.log({ path });
    if (!path) return;
    if (selected.length === 1 && selected[0] === path) {
      setSelected([]);
      return;
    }
    setSelection([path]);
  }

  const toggleAt = (index: number) => {
    if (hasUnsavedChanges) {
      nudgeSaveBar();
      return;
    }
    const id = getIdAt(index);
    if (!id) return;
    if (selected.includes(id)) {
      setSelection(selected.filter((x) => x !== id));
    } else {
      setSelection([...selected, id]);
    }
  };

  const selectRange = (toIndex: number) => {
    if (hasUnsavedChanges) {
      nudgeSaveBar();
      return;
    }
    if (lastInteractedIndexRef.current == null) {
      const id = getIdAt(toIndex);
      if (!id) return;
      selectSingle(id);
      lastInteractedIndexRef.current = toIndex;
      return;
    }
    const start = Math.min(lastInteractedIndexRef.current, toIndex);
    const end = Math.max(lastInteractedIndexRef.current, toIndex);
    const rangeIds = files.slice(start, end + 1).map((f) => f.path);
    setSelection(rangeIds);
  };

  const moveFocus = (nextIndex: number, withRange: boolean) => {
    if (nextIndex < 0 || nextIndex >= files.length) return;
    setFocusedIndex(nextIndex);
    if (hasUnsavedChanges) {
      nudgeSaveBar();
      return;
    }
    if (withRange) {
      selectRange(nextIndex);
    } else {
      const id = getIdAt(nextIndex);
      if (!id) return;
      selectSingle(id);
    }
  };

  const handleRowClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (!files.length) return;

    const isToggle = e.metaKey || e.ctrlKey;
    const isRange = e.shiftKey;

    setFocusedIndex(index);

    if (hasUnsavedChanges) {
      nudgeSaveBar();
      return;
    }

    if (isRange) {
      selectRange(index);
    } else if (isToggle) {
      toggleAt(index);
      lastInteractedIndexRef.current = index;
    } else {
      const id = getIdAt(index);
      if (!id) return;
      selectSingle(id);
      lastInteractedIndexRef.current = index;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!files.length) return;

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        let next = focusedIndex + 1;
        if (next >= files.length) {
          next = 0;
        }
        moveFocus(next, e.shiftKey);
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        let next = focusedIndex - 1;
        if (next < 0) {
          next = files.length - 1;
        }
        moveFocus(next, e.shiftKey);
        break;
      }
      case "Home": {
        e.preventDefault();
        moveFocus(0, e.shiftKey);
        break;
      }
      case "End": {
        e.preventDefault();
        moveFocus(files.length - 1, e.shiftKey);
        break;
      }
      case " ":
      case "Spacebar": {
        e.preventDefault();
        toggleAt(focusedIndex);
        lastInteractedIndexRef.current = focusedIndex;
        break;
      }
      default:
        break;
    }
  };

  useEffect(() => {
    setFocusedIndex((idx) =>
      Math.min(Math.max(idx, 0), Math.max(files.length - 1, 0)),
    );

    if (
      lastInteractedIndexRef.current != null &&
      lastInteractedIndexRef.current >= files.length
    ) {
      lastInteractedIndexRef.current = files.length ? files.length - 1 : null;
    }
  }, [files]);

  return (
    <div
      role="grid"
      tabIndex={0}
      ref={gridRef}
      onKeyDown={handleKeyDown}
      aria-multiselectable
      aria-activedescendant={
        files[focusedIndex] ? `row-${focusedIndex}` : undefined
      }
      className="pb-2 outline-none"
    >
      {table.getSortedRowModel().rows.map((row, i: number) => {
        const selectedNow =
          selected.find((ch) => ch === row.original.path) !== undefined;

        return (
          <ContextMenuArea
            key={row.id}
            items={() => [
              {
                text: "Select",
                action: () => {
                  console.log({ row: row.original });
                  selectSingle(row.original.path);
                },
                enabled: !hasUnsavedChanges,
              },

              { item: "Separator" },
              {
                text: "Rename using pattern…",
                action: () => {
                  const targets =
                    selected.length > 0 ? selected : [row.original.path];
                  startRename(targets, "{artist} - {title}.{ext}");
                },
              },
              {
                text: "Cleanup filenames…",
                action: () => {
                  const targets =
                    selected.length > 0 ? selected : [row.original.path];

                  startCleanup(targets);
                },
              },
              { item: "Separator" },
              {
                text: "Reveal in Finder",
                action: () => invoke("open", { path: row.original.path }),
              },
              {
                text: "Open in default app",
                action: () =>
                  invoke("open_default", { path: row.original.path }),
              },
              { item: "Separator" },
              {
                text: "Remove from workspace",
                action: () => {
                  const targets =
                    selected.length > 0 ? selected : [row.original.path];

                  invoke("remove_files", { paths: targets });
                },
              },
            ]}
            asChild
          >
            <div
              id={`row-${i}`}
              role="row"
              aria-selected={selectedNow || undefined}
              className={`tag-row flex gap-4 items-center px-1.5 border-b border-border/40 text-[12px] transition-colors focus:bg-hover ${
                i % 2 === 0 ? "bg-muted/10" : "bg-background"
              } ${selectedNow ? "bg-primary/15" : "hover:bg-hover"}`}
              onClick={(e) => handleRowClick(e, i)}
            >
              {row.getVisibleCells().map((cell: any) => (
                <SortableContext
                  key={cell.id}
                  items={columnOrder}
                  strategy={horizontalListSortingStrategy}
                >
                  <DragCell cell={cell} />
                </SortableContext>
              ))}
            </div>
          </ContextMenuArea>
        );
      })}
    </div>
  );
}
