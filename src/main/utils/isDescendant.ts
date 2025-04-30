import { FileNode } from "../../types";
export function isDescendant(parent: FileNode, child: FileNode): boolean {
  if (!parent.children) return false;

  for (const [, subNode] of parent.children) {
    if (subNode.path === child.path) return true;
    if (subNode.type === "directory" && isDescendant(subNode, child)) return true;
  }

  return false;
}
