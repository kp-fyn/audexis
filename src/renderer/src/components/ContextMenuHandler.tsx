import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "./context-menu";
import { ReactNode, JSX } from "react";
export default function ContextMenuHandler({ children, contextMenuContent }: Props): ReactNode {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="">{children}</ContextMenuTrigger>
      <ContextMenuContent className="z-[99999]">{contextMenuContent}</ContextMenuContent>
    </ContextMenu>
  );
}
interface Props {
  children: ReactNode;
  contextMenuContent: JSX.Element;
}
