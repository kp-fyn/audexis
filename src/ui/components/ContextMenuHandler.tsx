import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "./context-menu";
import { ReactNode, JSX } from "react";
export default function ContextMenuHandler({
  children,
  contextMenuContent,
}: Props) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent>{contextMenuContent}</ContextMenuContent>
    </ContextMenu>
  );
}
interface Props {
  children: ReactNode;
  contextMenuContent: JSX.Element;
}
