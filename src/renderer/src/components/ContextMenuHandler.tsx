import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "./context-menu";
import { ReactNode, JSX } from "react";
export default function ContextMenuHandler({ children, contextMenuContent }: Props): ReactNode {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="">{children}</ContextMenuTrigger>
      <ContextMenuContent className="z-[99999] max-h-60 overflow-y-auto bg-background">
        {contextMenuContent}x
      </ContextMenuContent>
    </ContextMenu>
  );
}
interface Props {
  children: ReactNode;
  contextMenuContent: JSX.Element;
}
