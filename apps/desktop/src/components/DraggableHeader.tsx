import { useSortable } from "@dnd-kit/sortable";
import { Header, flexRender } from "@tanstack/react-table";
import { CSSProperties, ReactNode } from "react";
import { CSS as CSSUtil } from "@dnd-kit/utilities";
import { useUserConfig } from "@/ui/hooks/useUserConfig";
import { File } from "@/ui/types";

export default function DraggableHeader({
  header,
  children,
}: Props): ReactNode {
  const { attributes, isDragging, listeners, setNodeRef, transform } =
    useSortable({
      id: header.column.id,
    });
  const { config, setColumns } = useUserConfig();

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: "relative",
    transform: CSSUtil.Translate.toString(transform),
    transition: "width transform 0.2s ease-in-out",
    whiteSpace: "nowrap",
    width: header.getSize(),
    zIndex: isDragging ? 1 : 0,
  };

  const canSort = header.column.getCanSort();
  const sorted = header.column.getIsSorted();

  return (
    <div
      ref={setNodeRef}
      tabIndex={-1}
      className="flex items-center gap-x-1 relative select-none group"
      onDoubleClick={() => {
        const column = config.columns.find((item) => item.value === header.id);
        if (!column) return;
        if (column.kind === "Image") return;
        setColumns(
          config.columns.map((item) =>
            item.value === header.id ? { ...item, size: 200 } : item,
          ),
        );
      }}
      style={{
        ...style,
        width: `${header.column.getSize()}px`,
        maxWidth: `${header.column.getSize()}px`,
        minWidth: `${header.column.columnDef.minSize}px`,
      }}
    >
      <button
        type="button"
        className="shrink-0 w-3 h-3 rounded-sm text-[10px] leading-none flex items-center justify-center cursor-grab active:cursor-grabbing text-foreground/40 hover:text-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary/50"
        aria-label={`Reorder column ${header.column.id}`}
        {...attributes}
        {...listeners}
      >
        <DragIcon />
      </button>

      {header.isPlaceholder ? null : (
        <div
          className={`flex h-full justify-center items-center gap-1 min-w-0 truncate font-semibold text-[11px] uppercase tracking-wide ${
            canSort ? "cursor-pointer select-none" : ""
          }`}
          onClick={
            canSort ? header.column.getToggleSortingHandler() : undefined
          }
          role={canSort ? "button" : undefined}
          aria-sort={
            sorted ? (sorted === "asc" ? "ascending" : "descending") : "none"
          }
          title={
            canSort
              ? sorted === "asc"
                ? "Sorted ascending"
                : sorted === "desc"
                  ? "Sorted descending"
                  : "Click to sort"
              : undefined
          }
        >
          {flexRender(header.column.columnDef.header, header.getContext())}
          {canSort && (
            <span className="text-[10px] leading-none text-foreground/50 group-hover:text-foreground/70">
              {sorted === "asc" ? "▲" : sorted === "desc" ? "▼" : "↕"}
            </span>
          )}
        </div>
      )}

      {children}
      <div {...attributes} {...listeners}></div>
    </div>
  );
}

interface Props {
  header: Header<File, unknown>;
  children: ReactNode;
}
function DragIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide-grip-vertical"
    >
      <circle cx="9" cy="12" r="1" />
      <circle cx="9" cy="5" r="1" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="15" cy="5" r="1" />
      <circle cx="15" cy="19" r="1" />
    </svg>
  );
}
