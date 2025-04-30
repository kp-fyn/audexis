import { ReactNode } from "react";
import { FileNode } from "src/types";
import { useDraggable } from "@dnd-kit/core";
export default function FileDraggable({ children, fn }: Props): ReactNode {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: fn.path,
  });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      {children}
    </div>
  );
}
interface Props {
  children: ReactNode;
  fn: FileNode;
}
