import { ReactNode, useRef } from "react";
import { useSidebarWidth } from "@/ui/hooks/useSidebarWidth";
import useWindowDimensions from "@/ui/hooks/useWindowDimensions";
import EditMenu from "./EditMenu";
import { useUserConfig } from "../hooks/useUserConfig";
import Filetree from "./Filetree";
import { useChanges } from "../hooks/useChanges";

export default function Sidebar(): ReactNode {
  const { sidebarWidth, setSidebarWidth } = useSidebarWidth();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const { config } = useUserConfig();
  const { fileTree } = useChanges();

  const { width } = useWindowDimensions();

  const startResizing = (): void => {
    isResizing.current = true;
    document.body.style.userSelect = "none";

    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResizing);
  };

  const resize = (event: MouseEvent): void => {
    if (isResizing.current && sidebarRef.current) {
      const newWidth = event.clientX;
      const minWidth = 0;
      const maxWidth = window.innerWidth - 200;
      document.body.style.userSelect = "none";

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth);
      }
    }
  };

  const stopResizing = (): void => {
    isResizing.current = false;
    document.body.style.userSelect = "";

    document.removeEventListener("mousemove", resize);
    document.removeEventListener("mouseup", stopResizing);
  };

  // const { src } = useImage({
  //   srcList: [image?.url ?? "../assets/images/unknown.jpg"]
  // });

  return (
    <div
      ref={sidebarRef}
      tabIndex={1}
      style={{
        width: `${sidebarWidth}px`,
        // minWidth: "300px",
        maxWidth: `${width - 200}px`,
      }}
      className="fixed select-none pb-12 top-12 left-0 h-screen z-50 bg-background  border-r border-border text-foreground overflow-y-auto overflow-x-clip"
    >
      {config.view === "simple" ? (
        <EditMenu />
      ) : (
        <Filetree node={fileTree[0]} />
      )}

      <div
        style={{ left: `${sidebarWidth}px` }}
        className={`fixed top-12 bottom-0  left-[${sidebarWidth}px] h-screen w-0.5 cursor-col-resize  bg-border hover:bg-border `}
        onMouseDown={startResizing}
      >
        <div className="border-r h-screen border-border "></div>
      </div>
    </div>
  );
}
