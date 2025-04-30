import { FileNode } from "../../types";
export function findFileNodeByPath(
  tree: { organized: Map<string, FileNode>; disorgainzed: Map<string, FileNode> },
  id: string
): FileNode | null {
  const search = (nodes: Map<string, FileNode>): FileNode | null => {
    for (const node of nodes.values()) {
      if (node.path === id) return node;
      if (node.type === "directory" && node.children) {
        const found = search(node.children);
        if (found) return found;
      }
    }
    return null;
  };

  return search(tree.organized) || search(tree.disorgainzed);
}
