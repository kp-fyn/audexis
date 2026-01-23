import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import DraggableHeader from "@/ui/components/table/DraggableHeader";
import { ContextMenuArea } from "@/ui/components/ContextMenu";
import { useRef } from "react";

type TableHeaderRowProps = {
  headerGroups: any[];
  columnOrder: string[];
  config: {
    columns: Array<{
      label: string;
      value: string;
      kind: string;
      size?: number;
    }>;
  };
  setColumns: (cols: any[]) => void;
  allColumns: Array<{ label: string; value: string; kind: string }>;
};

export default function TableHeaderRow({
  headerGroups,
  columnOrder,
  config,
  setColumns,
  allColumns,
}: TableHeaderRowProps) {
  const resizingColumnIdRef = useRef<string | null>(null);
  const initialResizeData = useRef<{ startX: number; startWidth: number }>({
    startX: 0,
    startWidth: 0,
  });
  const isResizing = useRef(false);

  const startResizing = (
    columnId: string,
    event: React.MouseEvent<HTMLDivElement>,
  ): void => {
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

    document.addEventListener("mousemove", resize as any);
    document.addEventListener("mouseup", stopResizing as any);
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

    document.removeEventListener("mousemove", resize as any);
    document.removeEventListener("mouseup", stopResizing as any);
  };

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border h-9 shadow-sm">
      {headerGroups.map((headerGroup) => (
        <div className="flex gap-4 h-full" key={headerGroup.id}>
          <SortableContext
            items={columnOrder}
            strategy={horizontalListSortingStrategy}
            key={headerGroup.id}
          >
            {headerGroup.headers.map((header: any, index: number) => (
              <ContextMenuArea
                items={() => {
                  const available = allColumns.filter(
                    (c) => !config.columns.find((col) => col.value === c.value),
                  );
                  if (!available.length) {
                    return [
                      {
                        type: "item" as const,
                        label: "No columns to add",
                        disabled: true,
                      },
                    ];
                  }
                  return [
                    {
                      type: "submenu" as const,
                      label: "Add Column",
                      items: available.map((col) => ({
                        type: "item" as const,
                        label:
                          col.label.charAt(0).toUpperCase() +
                          col.label.slice(1),
                        onSelect: () => {
                          const newCols = config.columns.toSpliced(index, 0, {
                            label:
                              col.label.charAt(0).toUpperCase() +
                              col.label.slice(1),
                            value: col.value,
                            kind: col.kind,
                            size: 150,
                          });
                          setColumns(newCols);
                        },
                      })),
                    },
                    {
                      type: "item" as const,
                      label: "Remove Column",
                      onSelect: () => {
                        const newCols = config.columns.filter(
                          (col) => col.value !== header.id,
                        );
                        setColumns(newCols);
                      },
                    },
                  ];
                }}
                key={header.id}
                asChild
              >
                <DraggableHeader header={header} key={header.id}>
                  <div
                    onMouseDown={(e) => {
                      e.preventDefault();
                      startResizing(header.id, e);
                    }}
                    className="absolute top-0 right-0 h-full w-0.75 cursor-col-resize bg-transparent hover:bg-primary/40 transition"
                  >
                    <div className="border-r border-border h-full" />
                  </div>
                </DraggableHeader>
              </ContextMenuArea>
            ))}
          </SortableContext>
        </div>
      ))}
    </div>
  );
}
