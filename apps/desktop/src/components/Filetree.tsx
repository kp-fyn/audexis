import { ReactNode, useState } from "react";
import { useChanges } from "../hooks/useChanges";
import { FileNode } from "../types";

export default function TreeNode({ node }: { node: FileNode }): ReactNode {
  if (!node) return <></>;
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<FileNode[] | null>(null);

  // async function handleClick() {
  //   if (node.is_directory) {
  //     if (!expanded && children === null) {
  //       // Load children
  //       const loaded = await invoke<FileNode[]>("get_folder_children", {
  //         folderPath: node.path,
  //       });
  //       setChildren(loaded);
  //     }
  //     setExpanded(!expanded);
  //   } else {
  //     // It's a file - maybe open it or show details
  //     console.log("File clicked:", node.path);
  //   }
  // }
  //onClick={handleClick}
  return (
    <div>
      <div
        className="flex w-full text-nowrap text-muted-foreground text-xs truncate hover:bg-hover hover:text-accent-foreground px-2 py-1"
        onClick={() => {
          setExpanded(!expanded);
        }}
        style={{ cursor: "pointer" }}
      >
        {node.children ? (
          <>
            {node.children && <span>{expanded ? "▼" : "▶"}</span>}
            📁 {node.name} ({node.children.length} files)
          </>
        ) : (
          <div>📄 {node.name}</div>
        )}
      </div>

      {node.children && expanded && (
        <div style={{ marginLeft: 20 }}>
          {node.children.map((child) => (
            <TreeNode key={child.path} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}
