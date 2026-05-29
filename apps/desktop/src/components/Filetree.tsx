import React, { ReactNode, useEffect, useMemo, useState } from "react";
import { useChanges } from "../hooks/useChanges";
import { ExtendedFileNode, File, FileNode, FileEvent, RawFile } from "../types";
import { invoke } from "@tauri-apps/api/core";
import { FolderClosed, FolderOpen, FileAudio } from "lucide-react";
import { listen } from "@tauri-apps/api/event";
import { path } from "@tauri-apps/api";
import { ContextMenuArea, MenuOptions } from "./ContextMenu";
import { useRename } from "../hooks/useRename";
import { useCleanup } from "../hooks/useCleanup";
import { FolderConfigModal } from "./modals/FolderConfigModal";

export default function TreeRoot(): ReactNode {
  const { fileTree, allFiles, setFiles, setAllFiles } = useChanges();
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
    const unlisten = listen<FileEvent[]>(
      "folder-view-events",
      async (event) => {
        for (const ev of event.payload) {
          switch (ev.op) {
            case "Create": {
              const file = ev.file;

              setLoadedFileTree((prev) => {
                const newFileTree = [...prev];
                const parentDirIndex = newFileTree.findIndex(
                  (fileNode) => fileNode.path === ev.file.parent_path,
                );
                if (parentDirIndex === -1) {
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
                  newFileTree[parentDirIndex] = updatedParent;
                  return newFileTree;
                }
              });
              break;
            }
            case "Modify": {
              const file = ev.file;

              const oldFile = allFiles.get(file.path);
              let newFil: File | undefined;
              if (!oldFile) {
                try {
                  const newF = await invoke<RawFile>("request_file", {
                    path: file.path,
                  });

                  if (newF) {
                    newFil = {
                      ...newF,
                      frames: newF.tags,
                    };

                    setAllFiles((prev) =>
                      new Map([...Array.from(prev.entries())]).set(
                        newF.path,
                        newFil as File,
                      ),
                    );
                    setFiles((prev) => {
                      return [...prev, newFil as File];
                    });
                  }
                } catch {}
              }

              setLoadedFileTree((prev) => {
                let newFileTree = [...prev];
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
                        newChildren.push({
                          ...ch,
                          path: ch.path.replace(
                            `${file.old_path}${path.sep()}`,
                            `${file.path}${path.sep()}`,
                          ),
                        });
                      }
                    }
                    goodNodes.push({
                      ...fileNode,
                      path: fileNode.path.replace(
                        `${file.old_path}${path.sep()}`,
                        `${file.path}${path.sep()}`,
                      ),

                      children: newChildren,
                    });
                  }

                  newFileTree = [...goodNodes];
                  setAllFiles((prevAllFiles) => {
                    return new Map(
                      [...prevAllFiles.values()].map((prevFile) => {
                        const newPath = prevFile.path.replace(
                          `${file.old_path}${path.sep()}`,
                          `${file.path}${path.sep()}`,
                        );

                        return [
                          newPath,
                          {
                            ...prevFile,
                            path: newPath,
                          },
                        ];
                      }),
                    );
                  });
                  setFiles((prevFiles) => {
                    return prevFiles.map((prevFile) => {
                      return {
                        ...prevFile,
                        path: prevFile.path.replace(
                          `${file.old_path}${path.sep()}`,
                          `${file.path}${path.sep()}`,
                        ),
                      };
                    });
                  });
                }
                const parentDirIndex = newFileTree.findIndex(
                  (fileNode) => fileNode.path === ev.file.parent_path,
                );
                if (parentDirIndex === -1) {
                  return newFileTree;
                }

                const updatedParent = { ...newFileTree[parentDirIndex] };
                if (!updatedParent.children) {
                  return newFileTree;
                } else {
                  const oldChildIndex = updatedParent.children.findIndex(
                    (child) => child.path === file.old_path,
                  );

                  if (oldChildIndex === -1) {
                    if (file.is_directory) {
                      updatedParent.children.push(file);
                    } else {
                      if (newFil) {
                        updatedParent.children.push(file);
                      }

                      return newFileTree;
                    }
                  }
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
            case "Remove": {
              const file = ev.file;

              setLoadedFileTree((prev) => {
                let newFileTree = [...prev];
                const parentDirIndex = newFileTree.findIndex(
                  (fileNode) => fileNode.path === ev.file.parent_path,
                );
                if (parentDirIndex === -1) {
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
      },
    );
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  if (!fileTree) return <></>;
  useEffect(() => {
    setFiles(filesToShow.map((p) => allFiles.get(p)).filter(Boolean) as File[]);
  }, [filesToShow, allFiles]);

  return (
    <div>
      <div className="flex font-light flex-col w-full text-nowrap text-muted-foreground text-xs">
        {rootNodes.map((node) => (
          <FiletreeNode
            setFilesToShow={setFilesToShow}
            key={node.path}
            node={node}
            loadedFileTree={loadedFileTree}
            updateFileTree={updateFileTree}
            rootPath={node.path}
            depth={0}
          />
        ))}
      </div>
    </div>
  );
}

function FiletreeNode({
  node,
  depth,
  setFilesToShow,
  parentOpen,
  updateFileTree,
  loadedFileTree,
  rootPath,
}: {
  node: FileNode;
  depth: number;
  rootPath: string;
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
  const { selected, setSelected } = useChanges();
  const [folderConfigOpened, setFolderConfigOpened] = useState(false);
  const isSelected = selected.has(node.path);

  async function handleClick(fromChild = false) {
    if (node.is_directory) {
      const realNode = loadedFileTree.find((n) => n.path === node.path);

      if (!expanded && typeof realNode === "undefined") {
        const loaded: FileNode[] = await invoke<FileNode[]>(
          "get_folder_children",
          {
            folderPath: node.path,
          },
        ).catch(() => []);

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

        //   const f = allFiles.get(file.path.toString());

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

        //   const f = allFiles.get(file.path);

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
      setSelected(() => new Set([node.path]));
      const parentPath = await path.dirname(node.path);
      const parentPathName = await path.basename(parentPath);
      const realNode = loadedFileTree.find((n) => n.path === parentPath);

      if (!expanded && typeof realNode === "undefined") {
        const loaded: FileNode[] = await invoke<FileNode[]>(
          "get_folder_children",
          {
            folderPath: parentPath,
          },
        ).catch(() => []);

        setFilesToShow(
          loaded.filter((child) => !child.is_directory).map((f) => f.path),
        );
        updateFileTree({
          path: parentPath,
          name: parentPathName,
          children: loaded,
        });
        // const arr: File[] = [];
        // const filesNeeded = loaded
        //   ? loaded.filter((child) => !child.is_directory)
        //   : [];

        // filesNeeded.forEach((file) => {

        //   const f = allFiles.get(file.path.toString());

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
      }
    }
  }

  const stickyTop = `${depth * 1.25}rem`;
  const zIndex = 500 - depth;
  const paddingLeft = `${depth}rem`;
  const realNode = loadedFileTree.find((n) => n.path === node.path) || node;
  const { start: startRename } = useRename();
  const { start: startCleanup } = useCleanup();
  const realChildren = realNode.children || [];
  const otherItems: MenuOptions = node.is_directory
    ? [
        {
          text: "Default Values for files...",
          action: () => {
            setFolderConfigOpened(true);
          },
        },
      ]
    : [
        {
          text: "Rename using pattern…",
          action: () => {
            const targets = selected.size > 0 ? [...selected] : [node.path];
            startRename(targets, "{artist} - {title}.{ext}");
          },
        },
        {
          text: "Cleanup filenames…",
          action: () => {
            const targets = selected.size > 0 ? [...selected] : [node.path];

            startCleanup(targets);
          },
        },
        { item: "Separator" },
      ];
  const sortedChildren = useMemo(() => {
    return [...realChildren].sort((a: FileNode, b: FileNode) => {
      const isDir = (b.is_directory ? 1 : 0) - (a.is_directory ? 1 : 0);

      if (isDir !== 0) {
        return isDir;
      }

      return a.name.localeCompare(b.name);
    });
  }, [realChildren]);
  return (
    <div className="relative w-full">
      <ContextMenuArea
        items={() => [
          ...otherItems,
          {
            text: "Copy Path" as string,
            action: () => navigator.clipboard.writeText(node.path),
          },
          {
            text: "Copy Relative Path",
            action: () =>
              navigator.clipboard.writeText(node.path.replace(rootPath, "")),
          },

          { item: "Separator" },

          { text: "Rename" },

          {
            text: "Show In Finder",
            action: () => invoke("open", { path: node.path }),
          },
          { item: "Separator" },

          { text: "Delete" },
        ]}
      >
        <div
          className={`flex gap-2 ${isSelected ? "bg-primary/15 " : "hover:bg-hover hover:text-hover-foreground bg-background"} font-light  items-center w-full text-nowrap text-foreground text-xs truncate py-1 sticky `}
          style={{
            top: stickyTop,
            zIndex: zIndex,
            paddingLeft: `calc(0.5rem + ${paddingLeft})`,

            paddingRight: "0.5rem",
          }}
          onClick={() => handleClick(false)}
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
            className={` truncate  ${node.is_directory ? "font-normale" : "file"}`}
          >
            {node.name}
          </span>
        </div>
      </ContextMenuArea>
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
            {sortedChildren.map((child: FileNode) => (
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
                  rootPath={rootPath}
                  node={child}
                  depth={depth + 1}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      <FolderConfigModal
        folderPath={node.path}
        open={folderConfigOpened}
        onClose={() => setFolderConfigOpened(false)}
      />
    </div>
  );
}
