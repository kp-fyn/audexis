import { useSortable } from "@dnd-kit/sortable";
import { Cell, flexRender } from "@tanstack/react-table";
import { CSSProperties, ReactNode } from "react";
import { CSS as CSSUtil } from "@dnd-kit/utilities";

export default function DragCell({ cell }: Props): ReactNode {
  const { isDragging, setNodeRef, transform } = useSortable({
    id: cell.column.id,
  });

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: "relative",
    transform: CSSUtil.Translate.toString(transform),
    transition: "width transform 0.2s ease-in-out",
    width: cell.column.getSize(),
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div
      className="px-4 py-2 truncate"
      style={{
        ...style,
        width: `${cell.column.getSize()}px`,
        minWidth: `${cell.column.columnDef.minSize}px`,
      }}
      ref={setNodeRef}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </div>
  );
}

interface Props {
  cell: Cell<FileIdentifier, unknown>;
}
interface FileIdentifier {
  hash: string;
  path: string;
}
