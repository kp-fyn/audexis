import { ReactNode } from "react";
import { FileNode } from "src/types";
import { useDroppable, useDraggable } from "@dnd-kit/core";
export default function FolderDroppable({ children, fn }: Props): ReactNode {
  const isFake = fn.path === ":/fake";
  const {
    attributes,
    listeners,

    setNodeRef: setDragRef,
  } = useDraggable({
    id: fn.path,
    disabled: isFake,
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: fn.path,
    disabled: isFake,
  });

  const setRef = (el: HTMLElement | null): void => {
    setDragRef(el);
    setDropRef(el);
  };

  return (
    <div
      className={`${isOver && !isFake && "bg-accent text-white"}`}
      ref={setRef}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
}
interface Props {
  children: ReactNode;
  fn: FileNode;
}
