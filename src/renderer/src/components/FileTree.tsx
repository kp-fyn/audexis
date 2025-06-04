import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { findFileNodeByPath } from "@renderer/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { FileMusic, FolderClosed, FolderOpen } from "lucide-react";
import path from "path-browserify";
import { ReactNode, useEffect, useRef, useState } from "react";
import type { FileNode } from "src/types";
import { useChanges } from "../hooks/useChanges";
import ContextMenuHandler from "./ContextMenuHandler";
import FileContextMenu from "./contextMenus/FileContextMenu";
// import FileDraggable from "./FileDraggable";
import { FileIdentifier } from "../../../types/index";
import FolderDroppable from "./FolderDroppable";
import useKeyDown from "@renderer/hooks/useKeyDown";
import FileDraggable from "./FileDraggable";
export default function FileTree(): ReactNode {
  const { fileTree, files } = useChanges();
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
    path: ":/fake2",
    type: "directory",
    children: fileTree.disorgainzed,
  });
  console.log({ fileTree });
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
        {files.length === 0 && (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            No files imported yet
            <button
              onClick={() => window.app.openDialog()}
              className="ml-2 text-sm text-primary underline"
            >
              Import Files
            </button>
          </div>
        )}

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

function FileNodeHandler({
  items,
  num = 0,
  initial = false,
  showFiles = false,
}: CollapsibleProps): ReactNode {
  const values = [...items.values()].sort((a, b) => {
    if (a.type === "directory" && b.type !== "directory") return -1;
    if (a.type !== "directory" && b.type === "directory") return 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });

  return (
    <>
      {values.map((v: FileNode) => {
        if (v.type === "directory") {
          return (
            <FolderDroppable key={v.path + "folder"} fn={v}>
              <FileTreeItem initial={initial} node={v} depth={num} />
            </FolderDroppable>
          );
        } else {
          if (showFiles) {
            return (
              <FileDraggable key={v.path + "file"} fn={v}>
                <FileTreeItem initial={initial} node={v} depth={num} />
              </FileDraggable>
            );
          } else return null;
        }
        // else {
        //   return (
        //     <FileDraggable key={v.path + "file"} fn={v}>
        //       <FileTreeItem initial={initial} node={v} depth={num} />
        //     </FileDraggable>
        //   );
        // }
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
  const {
    setFileTreeFolderSelected,
    fileTreeFolderSelected,
    setFilesToShow,
    filesToShow,
    fileTree,
    setSelected,
    selected,
  } = useChanges();

  // const [open, setOpen] = useState(initial);
  const isDir = node.type === "directory";
  const [isRenaming, setisRenaming] = useState(false);
  const [contextHover, setContextHover] = useState(false);
  const [showFiles, setShowFiles] = useState(initial);
  const [showSubDirectories, setShowSubDirectories] = useState(initial);
  const metaKeyDown = useKeyDown("Meta");

  const [val, setVal] = useState(node.name);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent): void => {
    if (e.button !== 0) return;
    pointerDownRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent): void => {
    if (!pointerDownRef.current) return;

    const dx = Math.abs(e.clientX - pointerDownRef.current.x);
    const dy = Math.abs(e.clientY - pointerDownRef.current.y);

    const isClick = dx < 5 && dy < 5;
    if (!isClick) return;
    if (isDir) {
      // setOpen((prev) => !prev);
      if (fileTreeFolderSelected.includes(node.path)) {
        if (metaKeyDown) {
          if (fileTreeFolderSelected.length < 2) {
            setFilesToShow([]);
            setFileTreeFolderSelected([]);
          } else {
            const newFiles: FileIdentifier[] = [];
            if (node.children) {
              node.children.forEach((child) => {
                if (child.type !== "directory" && child.audioFile) {
                  if (child.hash) {
                    newFiles.push({ path: child.path, hash: child.hash });
                  }
                }
              });
            }

            setFilesToShow([...newFiles]);
            setFileTreeFolderSelected([node.path]);
          }
        } else {
          setSelected([]);
          setFileTreeFolderSelected((prev) => prev.filter((v) => v !== node.path));

          setFilesToShow((prev) => prev.filter((v) => v.path !== node.path));
        }
        selected.forEach((s) => {
          const parentPath = path.dirname(s);

          const parentNode = findFileNodeByPath(fileTree, parentPath);
          if (!parentNode) return;
          if (parentNode.path === node.path) {
            setSelected((prev) => prev.filter((v) => v !== s));
          }
        });
      } else {
        if (metaKeyDown) {
          const newFiles: FileIdentifier[] = [];
          if (node.children) {
            node.children.forEach((child) => {
              if (child.type !== "directory" && child.audioFile) {
                if (child.hash) {
                  newFiles.push({ path: child.path, hash: child.hash });
                }
              }
            });
            setFilesToShow((prev) => [...prev, ...newFiles]);
            setFileTreeFolderSelected((prev) => [...prev, node.path]);
          }
        } else {
          setSelected([]);
          const newFiles: FileIdentifier[] = [];
          if (node.children) {
            node.children.forEach((child) => {
              if (child.type !== "directory" && child.audioFile && child.hash) {
                newFiles.push({ path: child.path, hash: child.hash });
              }
            });
          }

          setFilesToShow([...newFiles]);
          setFileTreeFolderSelected([node.path]);
        }
      }
    } else {
      const parentPath = path.dirname(node.path);
      const parentNode = findFileNodeByPath(fileTree, parentPath);

      if (!parentNode) {
        if (fileTree.disorgainzed.has(node.path)) {
          if (filesToShow.findIndex((f) => f.path === node.path) === -1) {
            const files = fileTree.disorgainzed.values();
            const au = files.map((f) => {
              return {
                path: f.path,
                hash: f.hash,
              };
            });

            const audioFiles = au.filter((f) => f.hash !== undefined);
            setFilesToShow([...audioFiles]);
          }
          if (metaKeyDown) {
            if (selected.includes(node.path)) {
              setSelected((prev) => prev.filter((v) => v !== node.path));
            } else {
              setSelected((prev) => [...prev, node.path]);
            }
          } else {
            setSelected([node.path]);
          }

          setFileTreeFolderSelected([":/fake2"]);
          return;
        }
      } else {
        if (!metaKeyDown) {
          if (fileTreeFolderSelected.includes(parentNode.path)) {
            setFileTreeFolderSelected((prev) => prev.filter((v) => v !== parentNode.path));
          } else {
            setFileTreeFolderSelected([parentNode.path]);
          }
        } else {
          if (fileTreeFolderSelected.includes(parentNode.path)) {
            setFileTreeFolderSelected((prev) => prev.filter((v) => v !== parentNode.path));
          } else {
            setFileTreeFolderSelected((prev) => [...prev, parentNode.path]);
          }
        }
      }

      if (metaKeyDown) {
        if (selected.includes(node.path)) {
          setSelected((prev) => prev.filter((v) => v !== node.path));
        } else {
          setSelected((prev) => [...prev, node.path]);
        }
      } else {
        if (selected.includes(node.path)) {
          setSelected((prev) => prev.filter((v) => v !== node.path));
          setFilesToShow((prev) => prev.filter((v) => v.path !== node.path));
        } else {
          setSelected([node.path]);
          if (!node.hash) return;
          setFilesToShow([{ path: node.path, hash: node.hash }]);
        }
      }
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
    if (fileTreeFolderSelected.length === 0) setSelected([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileTreeFolderSelected]);
  useEffect(() => {
    setVal(node.name);
  }, [node]);

  return (
    <ContextMenuHandler
      setOpen={setContextHover}
      // disabled={}
      contextMenuContent={
        <FileContextMenu
          checked={showFiles}
          showSubDirectories={showSubDirectories}
          setChecked={setShowFiles}
          setShowSubDirectories={setShowSubDirectories}
          setIsRenaming={setisRenaming}
          file={node}
        />
      }
    >
      <div className={`flex flex-col relative  transition `}>
        <div
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className={`relative  cursor-pointer select ${(contextHover || fileTreeFolderSelected.includes(node.path) || selected.includes(node.path)) && "bg-hover"} hover:bg-hover flex flex-nowrap`}
        >
          <div className="absolute inset-0 z-[-1] rounded-sm" />

          <div
            className="flex items-center gap-1 py-1 px-4 text-xs  text-nowrap flex-nowrap w-full text-muted-foreground"
            style={{ paddingLeft: `${depth + 24}px` }}
          >
            {/* {isDir ? (
              open ? ( */}
            {isDir ? (
              showFiles ? (
                <FolderOpen size={16} className="shrink-0" />
              ) : (
                <FolderClosed size={16} className="shrink-0" />
              )
            ) : (
              <FileMusic size={16} className="shrink-0" />
            )}
            {/* ) : (
                <FolderClosed size={16} className="shrink-0" />
              )
            ) : (
              <FileMusic size={16} className="shrink-0" />
            )} */}

            {isRenaming ? (
              <input
                ref={inputRef}
                defaultValue={node.name}
                className="inset-0 w-full bg-background rounded border-accent border-2 outline-none"
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
          {isDir && node.children && showSubDirectories && (
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
              <FileNodeHandler showFiles={showFiles} items={node.children} num={depth + 16} />
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
  showFiles?: boolean;
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
