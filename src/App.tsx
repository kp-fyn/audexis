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
import { arrayMove } from "@dnd-kit/sortable";

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
import { useChanges } from "@/ui/hooks/useChanges.tsx";
import TagValueChip from "@/ui/components/table/TagValueChip";
import TableHeaderRow from "@/ui/components/table/TableHeaderRow";
import DataGrid from "@/ui/components/table/DataGrid";
import { useHotkeys } from "@/ui/hooks/useHotkeys";

function App() {
  const {
    setSelected,
    selected,
    setFiles,
    files,
    hasUnsavedChanges,
    nudgeSaveBar,
  } = useChanges();
  const [isLoading, setIsLoading] = useState(true);

  const { config, setColumns, setAllColumns, allColumns } = useUserConfig();
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

  const lastInteractedIndexRef = useRef<number | null>(null);

  const columns: ColumnDef<File>[] = [...helpers];
  const [columnOrder, setColumnOrder] = useState<string[]>(() =>
    columns.map((c) => c.id ?? "")
  );

  useEffect(() => {
    setColumnOrder(config.columns.map((c) => c.value));
  }, [config.columns]);
  useEffect(() => {
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

  useHotkeys(
    [
      {
        combo: "escape",
        handler: () => {
          if (hasUnsavedChanges) {
            nudgeSaveBar();
            return;
          }
          setSelected([]);
          lastInteractedIndexRef.current = null;
        },
      },
      {
        combo: "mod+a",
        handler: () => {
          if (hasUnsavedChanges) {
            nudgeSaveBar();
            return;
          }
          setSelected(files.map((f) => f.path));
        },
      },
    ],
    [files]
  );

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
        style={{
          marginLeft: `${sidebarWidth}px`,
          height: `calc(100% - calc(var(--spacing) * 6))`,
        }}
        className="flex flex-col flex-1  w-full select-none"
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
          <div
            className="h-full"
            onClick={() => {
              if (hasUnsavedChanges) {
                nudgeSaveBar();
                return;
              }
              setSelected([]);
            }}
          >
            <div
              className="relative outline-none"
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
              <TableHeaderRow
                headerGroups={table.getHeaderGroups() as any}
                columnOrder={columnOrder}
                config={config as any}
                setColumns={setColumns as any}
                allColumns={allColumns as any}
              />
              <DataGrid
                table={table as any}
                files={files}
                selected={selected}
                setSelected={setSelected}
                columnOrder={columnOrder}
              />
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 w-full shrink-0 h-6 px-3 flex items-center text-[11px] text-foreground/60 bg-background/85 backdrop-blur border-t border-border">
          <span className="truncate">{files.length} files loaded</span>
        </div>
      </main>
    </DndContext>
  );
}

export default App;
