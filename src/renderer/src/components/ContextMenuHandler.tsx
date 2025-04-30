import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "./context-menu";
import { ReactNode, JSX, Dispatch, SetStateAction } from "react";
export default function ContextMenuHandler({
  children,
  contextMenuContent,
  setOpen,
  disabled = false,
}: Props): ReactNode {
  return (
    <ContextMenu
      onOpenChange={(bool) => {
        if (setOpen !== undefined) {
          setOpen(bool);
        }
      }}
    >
      <ContextMenuTrigger disabled={disabled} className={`data-[state=open]:bg-`}>
        {children}
      </ContextMenuTrigger>

      <ContextMenuContent className="z-[99999] max-h-60 overflow-y-auto bg-background">
        {contextMenuContent}
      </ContextMenuContent>
    </ContextMenu>
  );
}
interface Props {
  children: ReactNode;
  contextMenuContent: JSX.Element;
  disabled?: boolean;
  setOpen?: Dispatch<SetStateAction<boolean>>;
}
