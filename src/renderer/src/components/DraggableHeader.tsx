import { useSortable } from "@dnd-kit/sortable";
import { Header, flexRender } from "@tanstack/react-table";
import { CSSProperties, ReactNode } from "react";
import { CSS as CSSUtil } from "@dnd-kit/utilities";
import { AudioFile } from "../../../types";
import { useUserConfig } from "@renderer/hooks/useUserConfig";
export default function DraggableHeader({ header, children }: Props): ReactNode {
  const { attributes, isDragging, listeners, setNodeRef, transform } = useSortable({
    id: header.column.id,
  });
  const { config, setColumns } = useUserConfig();

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
      onDoubleClick={() =>
        setColumns(
          config.columns.map((item) => (item.value === header.id ? { ...item, size: 200 } : item))
        )
      }
      style={{
        ...style,
        width: `${header.column.getSize()}px`,
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
  header: Header<FileIdentifier, unknown>;
  children: ReactNode;
}
interface FileIdentifier {
  hash: string;
  path: string;
}
