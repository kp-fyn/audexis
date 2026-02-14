import React, { MouseEvent, ReactNode, useEffect, useState } from "react";
import { useChanges } from "../hooks/useChanges";
import { ExtendedFileNode, File, FileNode, FileEvent } from "../types";
import { invoke } from "@tauri-apps/api/core";
import { FolderClosed, FolderOpen, FileAudio } from "lucide-react";
import { listen } from "@tauri-apps/api/event";
import { path } from "@tauri-apps/api";

export default function TreeRoot(): ReactNode {
  const { fileTree, allFiles, setFiles } = useChanges();
  const [filesToShow, setFilesToShow] = useState<string[]>([]);
  const [rootNodes, setRootNodes] = useState<FileNode[]>(fileTree);

  const [loadedFileTree, setLoadedFileTree] = useState<ExtendedFileNode[]>([]);

  useEffect(() => {
    setRootNodes(fileTree);
  }, [fileTree]);

  function updateFileTree({
    path,
    name,
    children,
  }: {
    path: string;
    name: string;
    children: FileNode[];
  }) {
    setLoadedFileTree((prev) => {
      const oldIndex = prev.findIndex((node) => node.path === path);
      if (oldIndex === -1) {
        const newTree = [...prev, { path, name, is_directory: true, children }];
        return newTree;
      } else {
        const newTree = [...prev];
        newTree[oldIndex] = { children, is_directory: true, name, path };
        return newTree;
      }
    });
  }
  useEffect(() => {
    const unlisten = listen<FileEvent[]>("folder-view-events", (event) => {
      for (const ev of event.payload) {
        console.log(ev.op);
        switch (ev.op) {
          case "Create": {
            const file = ev.file;

            setLoadedFileTree((prev) => {
              const newFileTree = [...prev];
              const parentDirIndex = newFileTree.findIndex(
                (fileNode) => fileNode.path === ev.file.parent_path,
              );
              if (parentDirIndex === -1) {
                console.log("not found");
                return prev;
              }
              const updatedParent = { ...newFileTree[parentDirIndex] };
              if (!updatedParent.children) {
                updatedParent.children = [
                  {
                    name: file.name,
                    is_directory: file.is_directory,
                    path: file.path,
                  },
                ];

                return newFileTree;
              } else {
                updatedParent.children.push({
                  name: file.name,
                  is_directory: file.is_directory,
                  path: file.path,
                });
                console.log({ newFileTree });
                return newFileTree;
              }
            });
            break;
          }
          case "Modify": {
            const file = ev.file;

            setLoadedFileTree((prev) => {
              let newFileTree = [...prev];
              const parentDirIndex = newFileTree.findIndex(
                (fileNode) => fileNode.path === ev.file.parent_path,
              );
              if (parentDirIndex === -1) {
                console.log("not found");
                return prev;
              }
              console.log("modify");
              if (file.is_directory) {
                const badNodes = newFileTree.filter((ch) =>
                  ch.path.startsWith(file.old_path),
                );
                const goodNodes = newFileTree.filter(
                  (ch) =>
                    badNodes.findIndex((ch2) => ch2.path === ch.path) === -1,
                );

                for (const fileNode of badNodes) {
                  const newChildren: FileNode[] = [];
                  if (fileNode.children) {
                    for (const ch of fileNode.children) {
                      const newPath = ch.path.replace(file.old_path, file.path);
                      const oldPath = ch.path;
                      console.log({ oldPath, newPath });
                      newChildren.push({
                        ...ch,
                        path: ch.path.replace(file.old_path, file.path),
                      });
                    }
                  }
                  goodNodes.push({
                    ...fileNode,
                    path: fileNode.path.replace(file.old_path, file.path),
                    children: newChildren,
                  });
                }

                console.log({ badNodes, goodNodes });
                newFileTree = [...goodNodes];
              }
              const updatedParent = { ...newFileTree[parentDirIndex] };
              if (!updatedParent.children) {
                return newFileTree;
              } else {
                const oldChildIndex = updatedParent.children.findIndex(
                  (child) => child.path === file.old_path,
                );

                if (oldChildIndex === -1) return prev;
                updatedParent.children[oldChildIndex] = {
                  ...updatedParent.children[oldChildIndex],
                  path: file.path,
                  name: file.name,
                };

                return newFileTree;
              }
            });
            break;
          }
          case "Delete": {
            const file = ev.file;
            setLoadedFileTree((prev) => {
              let newFileTree = [...prev];
              const parentDirIndex = newFileTree.findIndex(
                (fileNode) => fileNode.path === ev.file.parent_path,
              );
              if (parentDirIndex === -1) {
                console.log("not found");
                return prev;
              }
              if (newFileTree[parentDirIndex].children) {
                newFileTree[parentDirIndex].children = newFileTree[
                  parentDirIndex
                ].children.filter((ch) => ch.path !== file.path);
              }

              const goodNodes = newFileTree.filter(
                (ch) => !ch.path.startsWith(`${file.path}${path.sep()}`),
              );

              newFileTree = [...goodNodes];

              return newFileTree;
            });
          }
        }
      }
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  if (!fileTree) return <></>;
  useEffect(() => {
    const arr: File[] = [];
    filesToShow.forEach((path) => {
      const f = allFiles.get(path);
      if (f) {
        arr.push(f);
      }
    });
    setFiles(arr);
  }, [filesToShow, allFiles]);

  return (
    <div>
      <div className="flex flex-col w-full text-nowrap text-muted-foreground text-xs">
        {rootNodes.map((node) => (
          <FiletreeNode
            setFilesToShow={setFilesToShow}
            key={node.path}
            node={node}
            loadedFileTree={loadedFileTree}
            updateFileTree={updateFileTree}
            depth={0}
          />
        ))}
      </div>
    </div>
  );
}

function FiletreeNode({
  node,
  depth = 0,
  setFilesToShow,
  parentOpen,
  updateFileTree,
  loadedFileTree,
}: {
  node: FileNode;
  depth: number;
  parentOpen?: (fromChild?: boolean) => void;
  setFilesToShow: React.Dispatch<React.SetStateAction<string[]>>;
  updateFileTree: ({
    path,
    name,
    children,
  }: {
    path: string;
    name: string;
    children: FileNode[];
  }) => void;
  loadedFileTree: ExtendedFileNode[];
}): ReactNode {
  const [expanded, setExpanded] = useState(false);
  async function handleClick(
    fromChild = false,
    e?: MouseEvent<HTMLDivElement>,
  ) {
    if (node.is_directory) {
      const realNode = loadedFileTree.find((n) => n.path === node.path);

      if (!expanded && typeof realNode === "undefined") {
        const loaded: FileNode[] = await invoke<FileNode[]>(
          "get_folder_children",
          {
            folderPath: node.path,
          },
        );

        setFilesToShow(
          loaded.filter((child) => !child.is_directory).map((f) => f.path),
        );
        updateFileTree({
          path: node.path,
          name: node.name,
          children: loaded,
        });
        // const arr: File[] = [];
        // const filesNeeded = loaded
        //   ? loaded.filter((child) => !child.is_directory)
        //   : [];

        // filesNeeded.forEach((file) => {
        //   console.log({ allFiles });
        //   const f = allFiles.get(file.path.toString());
        //   console.log({ f });
        //   if (f) {
        //     arr.push(f);
        //   }
        // });

        // setFiles(arr);
      } else if (!expanded || fromChild === true) {
        // const arr: File[] = [];
        if (!realNode) return;
        if (!realNode.children) return;
        setFilesToShow(
          realNode.children
            .filter((child) => !child.is_directory)
            .map((f) => f.path),
        );

        // children.forEach((file) => {
        //   console.log({ allFiles });
        //   const f = allFiles.get(file.path);
        //   console.log(file.path);
        //   console.log({ f });
        //   if (f) {
        //     arr.push(f);
        //   }
        // });
        // setFiles(arr);
      } else {
        if (!realNode) return;
        if (!realNode.children) return;
        const filesToRemove = realNode.children
          ? realNode.children
              .filter((child) => !child.is_directory)
              .map((f) => f.path)
          : [];
        if (parentOpen && fromChild === false) parentOpen();

        setFilesToShow((prev) =>
          prev.filter((path) => !filesToRemove.includes(path)),
        );
      }
      if (!fromChild) setExpanded((prev) => !prev);
    } else {
      console.log("File clicked:", node.path);
    }
  }

  const stickyTop = `${depth * 1.25}rem`;
  const zIndex = 500 - depth;
  const paddingLeft = `${depth}rem`;
  const realNode = loadedFileTree.find((n) => n.path === node.path) || node;

  const realChildren = realNode.children || [];
  return (
    <div className="relative w-full">
      <div
        className="flex gap-2 items-center w-full text-nowrap text-muted-foreground text-xs truncate hover:bg-hover hover:text-hover-foreground py-1 sticky bg-background cursor-pointer"
        style={{
          top: stickyTop,
          zIndex: zIndex,
          paddingLeft: `calc(0.5rem + ${paddingLeft})`,
          paddingRight: "0.5rem",
        }}
        onClick={(e) => handleClick(false, e)}
      >
        {node.is_directory ? (
          expanded ? (
            <FolderOpen className="size-4 text-primary shrink-0 ml-2" />
          ) : (
            <FolderClosed className="size-4 shrink-0 ml-2" />
          )
        ) : (
          <FileAudio className="size-4 shrink-0 ml-2" />
        )}
        <span
          className={` truncate ${node.is_directory ? "font-semibold" : "file"}`}
        >
          {node.name}
        </span>
      </div>
      {expanded && realChildren && (
        <div className="relative w-full">
          <div
            className={`absolute top-0 bottom-0 z w-px bg-border`}
            style={{
              left: `calc(0.5rem + ${paddingLeft} )`,
              zIndex: zIndex - 1,
            }}
          />
          <div className="relative w-full">
            {realChildren
              .sort((a: FileNode, b: FileNode) => {
                const isDir =
                  (b.is_directory ? 1 : 0) - (a.is_directory ? 1 : 0);

                if (isDir !== 0) {
                  return isDir;
                }

                return a.name.localeCompare(b.name);
              })
              .map((child: FileNode) => (
                <div key={child.path} className="relative w-full">
                  <div
                    className={`absolute top-2.5 z w-8 h-px bg-border`}
                    style={{
                      left: `calc(0.5rem + ${paddingLeft})`,
                      zIndex: 1000 + 10,
                    }}
                  />
                  <FiletreeNode
                    parentOpen={() => handleClick(true)}
                    setFilesToShow={setFilesToShow}
                    updateFileTree={updateFileTree}
                    loadedFileTree={loadedFileTree}
                    node={child}
                    depth={depth + 1}
                  />
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
