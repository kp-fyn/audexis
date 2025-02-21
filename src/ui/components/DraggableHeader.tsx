import { useSortable } from "@dnd-kit/sortable";
import { Header, flexRender } from "@tanstack/react-table";
import { CSSProperties, ReactNode } from "react";
import { CSS as CSSUtil } from "@dnd-kit/utilities";
import { AudioFile } from "@/types";
export default function DraggableHeader({ header, children }: Props) {
  const { attributes, isDragging, listeners, setNodeRef, transform } =
    useSortable({
      id: header.column.id,
    });

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: "relative",
    transform: CSSUtil.Translate.toString(transform),
    transition: "width transform 0.2s ease-in-out",
    whiteSpace: "nowrap",
    width: header.column.getSize(),
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div
      {...attributes}
      {...listeners}
      tabIndex={-1}
      className="relative px-4 py-2 font-bold truncate"
      style={{
        ...style,
        width: `${header.getSize()}px`,
        minWidth: `${header.column.columnDef.minSize}px`,
      }}
      ref={setNodeRef}
    >
      {header.isPlaceholder
        ? null
        : flexRender(header.column.columnDef.header, header.getContext())}

      {children}
    </div>
  );
}
interface Props {
  header: Header<AudioFile, unknown>;
  children: ReactNode;
}
