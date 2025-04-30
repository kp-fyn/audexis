import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { findFileNodeByPath } from "@renderer/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { FileMusic, FolderClosed, FolderOpen } from "lucide-react";
import path from "path-browserify";
import { ReactNode, useEffect, useRef, useState } from "react";
import { FileNode } from "src/types";
import { useChanges } from "../hooks/useChanges";
import ContextMenuHandler from "./ContextMenuHandler";
import FileContextMenu from "./contextMenus/FileContextMenu";
import FileDraggable from "./FileDraggable";
import FolderDroppable from "./FolderDroppable";
export default function FileTree(): ReactNode {
  const { fileTree } = useChanges();
  const [activeDragItem, setActiveDragItem] = useState<FileNode | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    })
  );
  const importedFiles: Map<string, FileNode> = new Map();
  importedFiles.set(":/fake", {
    name: "Imported Files",
    path: ":/fake",
    type: "directory",
    children: fileTree.organized,
  });
  const disorganized: Map<string, FileNode> = new Map();
  disorganized.set(":/fake", {
    name: "Disorganized Files",
    path: ":/fake",
    type: "directory",
    children: fileTree.disorgainzed,
  });
  return (
    <div className="h-full flex flex-col">
      <DndContext
        sensors={sensors}
        onDragStart={(event) => {
          const id = event.active.id;

          const item = findFileNodeByPath(fileTree, id as string);
          setActiveDragItem(item || null);
        }}
        onDragEnd={(e) => {
          const fileToMove = activeDragItem;
          setActiveDragItem(null);
          if (!e.over) return;
          if (!fileToMove) return;
          const folder = findFileNodeByPath(fileTree, e.over.id as string);
          if (!folder) return;
          if (folder.type !== "directory") return;

          if (folder.path === fileToMove.path) return;
          if (isDescendant(fileToMove, folder)) return;
          if (fileToMove.path === path.join(folder.path, fileToMove.name)) return;
          window.app.workspaceAction({
            action: "move",
            path: folder.path,
            str: fileToMove.path,
          });
        }}
        onDragCancel={() => {
          setActiveDragItem(null);
        }}
      >
        <FileNodeHandler initial={true} items={importedFiles} />
        <FileNodeHandler initial={true} items={disorganized} />

        <DragOverlay>
          {activeDragItem ? (
            <div className="flex opacity-50 h-8 border-border  items-center gap-1 py-1 px-4 text-xs text-muted-foreground bg-background border rounded shadow-md">
              {activeDragItem.name}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function FileNodeHandler({ items, num = 0, initial = false }: CollapsibleProps): ReactNode {
  const values = [...items.values()].sort((a, b) => {
    if (a.type === "directory" && b.type !== "directory") return -1;
    if (a.type !== "directory" && b.type === "directory") return 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });

  return (
    <>
      {values.map((v) => {
        if (v.type === "directory") {
          return (
            <FolderDroppable key={v.path + "folder"} fn={v}>
              <FileTreeItem initial={initial} node={v} depth={num} />
            </FolderDroppable>
          );
        } else {
          return (
            <FileDraggable key={v.path + "file"} fn={v}>
              <FileTreeItem initial={initial} node={v} depth={num} />
            </FileDraggable>
          );
        }
      })}
    </>
  );
}
interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  initial?: boolean;
}

function FileTreeItem({ node, depth, initial = false }: FileTreeItemProps): ReactNode {
  const [open, setOpen] = useState(initial);
  const isDir = node.type === "directory";
  const [isRenaming, setisRenaming] = useState(false);
  const [contextHover, setContextHover] = useState(false);

  const [val, setVal] = useState(node.name);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent): void => {
    pointerDownRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent): void => {
    if (!pointerDownRef.current) return;

    const dx = Math.abs(e.clientX - pointerDownRef.current.x);
    const dy = Math.abs(e.clientY - pointerDownRef.current.y);

    const isClick = dx < 5 && dy < 5;

    if (isClick && isDir) {
      setOpen((prev) => !prev);
    }

    pointerDownRef.current = null;
  };
  useEffect(() => {
    if (isRenaming) {
      setTimeout(() => {
        const input = inputRef.current;
        if (input) {
          input.focus();
          const dotIndex = input.value.lastIndexOf(".");
          const selectionEnd = dotIndex > 0 ? dotIndex : input.value.length;
          input.setSelectionRange(0, selectionEnd);
        }
      }, 10);
    }
  }, [isRenaming]);
  useEffect(() => {
    setVal(node.name);
  }, [node.name]);

  return (
    <ContextMenuHandler
      setOpen={setContextHover}
      disabled={node.path === ":/fake"}
      contextMenuContent={<FileContextMenu setIsRenaming={setisRenaming} file={node} />}
    >
      <div className={`flex flex-col relative  transition `}>
        <div
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className={`relative  cursor-pointer select bg-none hover:bg-hover flex flex-nowrap`}
        >
          <div className="absolute inset-0 z-[-1] rounded-sm" />

          <div
            className="flex items-center gap-1 py-1 px-4 text-xs  text-nowrap flex-nowrap w-full"
            style={{ paddingLeft: `${depth + 24}px` }}
          >
            {isDir ? (
              open ? (
                <FolderOpen size={16} className="shrink-0" />
              ) : (
                <FolderClosed size={16} className="shrink-0" />
              )
            ) : (
              <FileMusic size={16} className="shrink-0" />
            )}

            {isRenaming ? (
              <input
                ref={inputRef}
                defaultValue={node.name}
                className="inset-0 w-full border-accent border-2 outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && inputRef.current) {
                    const newName = inputRef.current.value;
                    setVal(newName);
                    window.app.workspaceAction({
                      action: "rename",
                      path: node.path,
                      str: newName,
                    });
                    setisRenaming(false);
                  }
                }}
                onBlur={() => {
                  if (!inputRef.current) return;
                  const newName = inputRef.current.value;
                  setVal(newName);
                  window.app.workspaceAction({
                    action: "rename",
                    path: node.path,
                    str: newName,
                  });
                  setisRenaming(false);
                }}
              />
            ) : (
              <span>{val}</span>
            )}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isDir && open && node.children && (
            <motion.div
              className="relative flex flex-col w-full"
              initial={{ height: 0, opacity: 1, y: -10 }}
              animate={{ height: "auto", opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 1, y: -10 }}
              transition={{ duration: 0.1, ease: "easeInOut" }}
            >
              <div
                className="absolute top-0 bottom-0 w-[1px] bg-gray-400 z-[9999999999]"
                style={{ left: `${depth + 28}px` }}
              />
              <FileNodeHandler items={node.children} num={depth + 16} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ContextMenuHandler>
  );
}
interface CollapsibleProps {
  items: Map<string, FileNode>;
  num?: number;
  initial?: boolean;
}
function isDescendant(parent: FileNode, child: FileNode): boolean {
  if (!parent.children) return false;

  for (const [, subNode] of parent.children) {
    if (subNode.path === child.path) return true;
    if (subNode.type === "directory" && isDescendant(subNode, child)) return true;
  }

  return false;
}
