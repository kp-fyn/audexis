import { useEffect, useRef, useState } from "react";
import {
  ColumnDef,
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import { Event, listen } from "@tauri-apps/api/event";
import { AllTags, File, TagPicture } from "@/ui/types";
import { invoke } from "@tauri-apps/api/core";
import { useUserConfig } from "@/ui/hooks/useUserConfig.tsx";
import { useSidebarWidth } from "@/ui/hooks/useSidebarWidth.tsx";
import Sidebar from "@/ui/components/Sidebar.tsx";

const columnHelper = createColumnHelper<File>();
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";

import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import DraggableHeader from "@/ui/components/DraggableHeader.tsx";
import DragCell from "@/ui/components/DragCell.tsx";
import { useChanges } from "@/ui/hooks/useChanges.tsx";

function TagValueChip({ text }: { text: string }) {
  return (
    <span
      title={text}
      className="inline-flex max-w-full items-center rounded-sm bg-primary/10 px-2 py-0.5 text-[11px] leading-tight font-medium text-foreground/80 border border-border/60 shadow-sm hover:bg-primary/15 transition-colors truncate"
    >
      {text}
    </span>
  );
}

function App() {
  const { setSelected, selected, setFiles, files } = useChanges();
  const [isLoading, setIsLoading] = useState(true);
  const tableRef = useRef<HTMLDivElement | null>(null);
  const resizingColumnIdRef = useRef<string | null>(null);
  const initialResizeData = useRef<{
    startX: number;
    startWidth: number;
  }>({ startX: 0, startWidth: 0 });
  const isResizing = useRef(false);

  const { config, setColumns, setAllColumns } = useUserConfig();
  const { sidebarWidth } = useSidebarWidth();

  const helpers: ColumnDef<File, any>[] = config.columns.map((item) => {
    if (item.kind === "Image") {
      return columnHelper.display({
        id: item.value,
        size: item.size,
        header: () => (
          <span className="w-full truncate uppercase tracking-wide text-[11px] font-semibold text-foreground/70">
            {item.label}
          </span>
        ),
        enableSorting: false,
        cell: ({ row }) => {
          const tag = row.original.tags[item.value as keyof AllTags] as
            | AllTags[keyof AllTags]
            | undefined;
          if (!tag || (tag as any).type !== "Picture")
            return <div className="text-[11px] italic opacity-40">—</div>;
          const pic = tag as TagPicture;
          return (
            <img
              src={`data:${pic.value.mime};base64,${pic.value.data_base64}`}
              alt="Attached"
              className="max-h-[38px] w-auto rounded-sm border border-border object-cover"
            />
          );
        },
      }) as ColumnDef<File, any>;
    } else if (item.value === "path") {
      return columnHelper.accessor("path", {
        id: item.value,
        size: item.size,
        header: () => (
          <span className="w-full truncate uppercase tracking-wide text-[11px] font-semibold text-foreground/70">
            {item.label}
          </span>
        ),
        sortingFn: "alphanumeric",
        enableSorting: true,
        cell: ({ row }) => {
          return (
            <div
              className="text-[11px] truncate px-2"
              title={row.original.path}
            >
              {row.original.path}
            </div>
          );
        },
      }) as ColumnDef<File, any>;
    } else if (item.value === "release") {
      return columnHelper.accessor("tag_format", {
        id: item.value,
        size: item.size,
        header: () => (
          <span className="w-full truncate uppercase tracking-wide text-[11px] font-semibold text-foreground/70">
            {item.label}
          </span>
        ),
        sortingFn: "alphanumeric",
        enableSorting: true,
        cell: ({ row }) => {
          return (
            <div
              className="text-[11px] truncate px-2"
              title={row.original.tag_format}
            >
              {row.original.tag_format}
            </div>
          );
        },
      }) as ColumnDef<File, any>;
    }
    return (columnHelper as any).accessor(
      (row: File) => {
        const tag = (row.tags as any)[item.value];
        if (!tag || tag.type !== "Text") return "";
        return String(tag.value ?? "");
      },
      {
        id: item.value,
        size: item.size,
        header: () => (
          <span className="w-full truncate uppercase tracking-wide text-[11px] font-semibold text-foreground/70">
            {item.label}
          </span>
        ),
        sortingFn: "alphanumeric",
        enableSorting: true,
        cell: ({ row }: any) => {
          const tag = (row.original.tags as any)[item.value];
          if (!tag || tag.type !== "Text")
            return <div className="text-[11px] italic opacity-40">—</div>;
          return <TagValueChip text={tag.value} />;
        },
      }
    ) as ColumnDef<File, any>;
  });

  const gridRef = useRef<HTMLDivElement | null>(null);
  const lastInteractedIndexRef = useRef<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  const getIdAt = (index: number) => files[index]?.path;
  const isSelectedAt = (index: number) => {
    const id = getIdAt(index);
    return !!id && selected.includes(id);
  };
  const setSelection = (ids: string[]) => setSelected(Array.from(new Set(ids)));

  const selectSingle = (index: number) => {
    const id = getIdAt(index);
    if (!id) return;
    if (selected.length === 1 && selected[0] === id) {
      setSelected([]);
      return;
    }
    setSelection([id]);
  };

  const toggleAt = (index: number) => {
    const id = getIdAt(index);
    if (!id) return;
    if (selected.includes(id)) {
      setSelection(selected.filter((x) => x !== id));
    } else {
      setSelection([...selected, id]);
    }
  };
  const selectRange = (toIndex: number) => {
    if (lastInteractedIndexRef.current == null) {
      selectSingle(toIndex);
      lastInteractedIndexRef.current = toIndex;
      return;
    }
    const start = Math.min(lastInteractedIndexRef.current, toIndex);
    const end = Math.max(lastInteractedIndexRef.current, toIndex);
    const rangeIds = files.slice(start, end + 1).map((f) => f.path);
    setSelection(rangeIds);
  };

  const handleRowClick = (e: React.MouseEvent, index: number) => {
    if (!files.length) return;

    const isToggle = e.metaKey || e.ctrlKey;
    const isRange = e.shiftKey;

    setFocusedIndex(index);

    if (isRange) {
      selectRange(index);
    } else if (isToggle) {
      toggleAt(index);
      lastInteractedIndexRef.current = index;
    } else {
      selectSingle(index);
      lastInteractedIndexRef.current = index;
    }
  };

  const moveFocus = (nextIndex: number, withRange: boolean) => {
    if (nextIndex < 0 || nextIndex >= files.length) return;
    setFocusedIndex(nextIndex);
    if (withRange) {
      selectRange(nextIndex);
    } else {
      selectSingle(nextIndex);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!files.length) return;

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        const next = Math.min(focusedIndex + 1, files.length - 1);
        moveFocus(next, e.shiftKey);
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        const next = Math.max(focusedIndex - 1, 0);
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
      case "Escape": {
        e.preventDefault();
        setSelection([]);
        lastInteractedIndexRef.current = null;
        break;
      }
      case "a":
      case "A": {
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          setSelection(files.map((f) => f.path));
        }
        break;
      }
    }
  };

  const columns: ColumnDef<File>[] = [...helpers];
  const [columnOrder, setColumnOrder] = useState<string[]>(() =>
    columns.map((c) => c.id ?? "")
  );

  useEffect(() => {
    setColumnOrder(config.columns.map((c) => c.value));
  }, [config.columns]);
  useEffect(() => {
    setFocusedIndex((idx) =>
      Math.min(Math.max(idx, 0), Math.max(files.length - 1, 0))
    );

    if (
      lastInteractedIndexRef.current != null &&
      lastInteractedIndexRef.current >= files.length
    ) {
      lastInteractedIndexRef.current = files.length ? files.length - 1 : null;
    }
  }, [files]);

  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    state: { columnOrder, sorting },
    onColumnOrderChange: setColumnOrder,
    onSortingChange: setSorting,
    columns,
    data: files,
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    defaultColumn: { minSize: 50 },
  });

  useEffect(() => {
    const unlisten = listen("workspace-updated", (event: Event<File[]>) => {
      setFiles(event.payload);
      setIsLoading(false);
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  useEffect(() => {
    //  invoke doesn't work immediately on page load or reload
    setTimeout(() => {
      invoke("get_workspace_files").catch(() => {
        setIsLoading(false);
      });
      invoke("get_all_columns")
        .then((cols: any) => {
          setAllColumns(cols);
        })
        .catch(() => {
          setIsLoading(false);
        });
    }, 500);
  }, []);

  const startResizing = (
    columnId: string,
    event: React.MouseEvent<HTMLDivElement>
  ): void => {
    if (!tableRef.current) return;

    const column = config.columns.find((c) => c.value === columnId);
    if (!column) return;
    if (columnId === "attachedPicture") return;

    resizingColumnIdRef.current = columnId;
    isResizing.current = true;
    document.body.style.userSelect = "none";

    initialResizeData.current = {
      startX: event.clientX,
      startWidth: column.size ?? 200,
    };

    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResizing);
  };

  const resize = (event: MouseEvent): void => {
    if (!isResizing.current) return;
    const columnId = resizingColumnIdRef.current;
    if (!columnId) return;

    const deltaX = event.clientX - initialResizeData.current.startX;
    const newWidth = initialResizeData.current.startWidth + deltaX;

    const minWidth = 50;
    const maxWidth = window.innerWidth - 200;
    if (newWidth < minWidth || newWidth > maxWidth) return;
    const columnsCopy = config.columns.map((col) => ({ ...col }));

    const columnIndex = columnsCopy.findIndex((c) => c.value === columnId);
    if (columnIndex === -1) return;

    columnsCopy[columnIndex].size = newWidth;
    setColumns(columnsCopy);
  };
  const stopResizing = (): void => {
    resizingColumnIdRef.current = null;
    isResizing.current = false;
    document.body.style.userSelect = "";

    document.removeEventListener("mousemove", resize);
    document.removeEventListener("mouseup", stopResizing);
  };

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setColumnOrder((columnOrder) => {
        const oldIndex = columnOrder.indexOf(active.id as string);
        const newIndex = columnOrder.indexOf(over.id as string);
        const newColumns = arrayMove(columnOrder, oldIndex, newIndex);

        const newRc = newColumns.map((item) => {
          const rc = config.columns.find((c) => c.value === item);
          if (!rc) return null;

          return {
            ...rc,
            value: item,
          };
        });
        const newRealColumns = newRc.filter((item) => item !== null);
        setColumns(newRealColumns as any);
        return arrayMove(columnOrder, oldIndex, newIndex);
      });
    }
  }

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-foreground/60">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[restrictToHorizontalAxis]}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <Sidebar />
      <main
        style={{ marginLeft: `${sidebarWidth}px` }}
        className="flex flex-col flex-1 h-full min-h-0 w-full select-none"
      >
        <div className="shrink-0 sticky top-0 z-50 flex items-center gap-4 h-9 px-4 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <h1 className="text-xs font-semibold tracking-wide uppercase text-foreground/70">
            Tag Editor
          </h1>
          <div className="text-[11px] text-foreground/60">
            {selected.length
              ? `${selected.length} selected`
              : `${files.length} files`}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto" id="app-scroll">
          <div className="h-full" ref={tableRef}>
            <div
              className="relative"
              style={{
                width: Math.max(
                  config.columns.reduce(
                    (sum, col) => sum + (col.size || 200),
                    0
                  ) +
                    config.columns.length * 16 +
                    (config.columns.length - 1) * 16 +
                    12 +
                    170,
                  600
                ),
                minWidth: "100%",
              }}
            >
              <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border h-[36px] shadow-sm">
                {table.getHeaderGroups().map((headerGroup) => (
                  <div className="flex gap-4 h-full" key={headerGroup.id}>
                    <SortableContext
                      items={columnOrder}
                      strategy={horizontalListSortingStrategy}
                      key={headerGroup.id}
                    >
                      {headerGroup.headers.map((header) => (
                        <DraggableHeader header={header} key={header.id}>
                          <div
                            onMouseDown={(e) => {
                              e.preventDefault();
                              startResizing(header.id, e);
                            }}
                            className="absolute top-0 right-0 h-full w-[3px] cursor-col-resize bg-transparent hover:bg-primary/40 transition"
                          >
                            <div className="border-r border-border h-full" />
                          </div>
                        </DraggableHeader>
                      ))}
                    </SortableContext>
                  </div>
                ))}
              </div>
              <div
                role="grid"
                tabIndex={0}
                ref={gridRef}
                onKeyDown={handleKeyDown}
                aria-multiselectable
                aria-activedescendant={
                  files[focusedIndex] ? `row-${focusedIndex}` : undefined
                }
                className="pb-2"
              >
                {table.getRowModel().rows.map((row, i) => {
                  const selectedNow = isSelectedAt(i);
                  return (
                    <div
                      id={`row-${i}`}
                      key={row.id}
                      role="row"
                      aria-selected={selectedNow || undefined}
                      className={`tag-row flex gap-4 items-center px-1.5 border-b border-border/40 text-[12px] transition-colors
                                                 ${
                                                   i % 2 === 0
                                                     ? "bg-muted/10"
                                                     : "bg-background"
                                                 }
                                                 ${
                                                   selectedNow
                                                     ? "bg-primary/15 ring-1 ring-primary/40"
                                                     : "hover:bg-muted/30"
                                                 }
                                                 ${
                                                   i === focusedIndex
                                                     ? "outline outline-primary/60"
                                                     : "outline-none"
                                                 }`}
                      onClick={(e) => handleRowClick(e, i)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <SortableContext
                          key={cell.id}
                          items={columnOrder}
                          strategy={horizontalListSortingStrategy}
                        >
                          <DragCell cell={cell} />
                        </SortableContext>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 h-6 px-3 flex items-center text-[11px] text-foreground/60 bg-background/85 backdrop-blur border-t border-border">
          <span className="truncate">{files.length} files loaded</span>
        </div>
      </main>
    </DndContext>
  );
}

export default App;
