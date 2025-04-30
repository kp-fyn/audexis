import { ReactNode, useRef } from "react";
import { useSidebarWidth } from "../hooks/useSidebarWidth";
import useWindowDimensions from "../hooks/useWindowDimensions";
import EditMenu from "./EditMenu";
import FileTree from "./FileTree";
import { useUserConfig } from "@renderer/hooks/useUserConfig";

export default function Sidebar(): ReactNode {
  const { sidebarWidth, setSidebarWidth } = useSidebarWidth();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const { config } = useUserConfig();

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

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(`${newWidth}px`);
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
      style={{
        width: `${sidebarWidth}`,
        // minWidth: "300px",
        maxWidth: `${width - 200} px`,
      }}
      className="fixed pb-12 top-12 left-0 h-screen z-[9999] bg-background  text-foreground overflow-y-auto overflow-x-clip"
    >
      {config.view === "simple" ? <EditMenu /> : <FileTree />}
      <div
        style={{ marginLeft: `${sidebarWidth}` }}
        className={`fixed top-12 bottom-0  h-screen w-[6px] cursor-col-resize  bg-background hover:bg-border `}
        onMouseDown={startResizing}
      >
        <div className="border-r h-screen border-border "></div>
      </div>
    </div>
  );
}
