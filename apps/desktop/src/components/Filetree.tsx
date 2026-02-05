import { ReactNode, useState } from "react";
import { useChanges } from "../hooks/useChanges";
import { FileNode } from "../types";
import { invoke } from "@tauri-apps/api/core";
import { FolderClosed, FolderOpen, FileAudio } from "lucide-react";

export default function TreeRoot(): ReactNode {
  const { fileTree } = useChanges();
  if (!fileTree) return <></>;

  return (
    <div>
      <div className="flex flex-col w-full text-nowrap text-muted-foreground text-xs">
        {fileTree.map((node) => (
          <FiletreeNode key={node.path} node={node} depth={0} />
        ))}
      </div>
    </div>
  );
}

function FiletreeNode({
  node,
  depth = 0,
}: {
  node: FileNode;
  depth?: number;
}): ReactNode {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<FileNode[] | null>(null);

  async function handleClick() {
    console.log(node);
    if (node.is_directory) {
      if (!expanded && children === null) {
        const loaded = await invoke<FileNode[]>("get_folder_children", {
          folderPath: node.path,
        });
        console.log(loaded);
        setChildren(loaded);
      }
      setExpanded(!expanded);
    } else {
      console.log("File clicked:", node.path);
    }
  }

  const stickyTop = `${depth * 1.25}rem`;
  const zIndex = 500 - depth;
  const paddingLeft = `${depth}rem`;

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
        onClick={handleClick}
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
      {expanded && children && (
        <div className="relative w-full">
          <div
            className={`absolute top-0 bottom-0 z w-px bg-border`}
            style={{
              left: `calc(0.5rem + ${paddingLeft} + 0.5rem)`,
              zIndex: zIndex - 1,
            }}
          />
          <div className="relative w-full">
            {children.map((child) => (
              <div key={child.path} className="relative w-full">
                <div
                  className={`absolute top-2.5 z w-8 h-px bg-border`}
                  style={{
                    left: `calc(0.5rem + ${paddingLeft} - 0.5rem)`,
                    zIndex: 1000 + 10,
                  }}
                />
                <FiletreeNode node={child} depth={depth + 1} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
