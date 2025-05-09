import { ReactNode, useRef } from "react";
import { useSidebarWidth } from "../hooks/useSidebarWidth";
import EditMenu from "./EditMenu";

// import { useUserConfig } from "@renderer/hooks/useUserConfig";
import { useBottombarHeight } from "../hooks/useBottombarHeight";

export default function Bottombar(): ReactNode {
  const { sidebarWidth } = useSidebarWidth();
  const { bottombarHeight, setBottombarHeight } = useBottombarHeight();

  const isResizing = useRef(false);
  //   const { config } = useUserConfig();

  const startResizing = (): void => {
    isResizing.current = true;
    document.body.style.userSelect = "none";

    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResizing);
    document.addEventListener("blur", stopResizing);
  };

  const resize = (event: MouseEvent): void => {
    if (isResizing.current) {
      const newHeight = window.innerHeight - event.clientY;
      const minWidth = 40;
      const maxWidth = window.innerHeight - 200;
      if (newHeight >= minWidth && newHeight <= maxWidth) {
        setBottombarHeight(`${newHeight}px`);
      }
    }
  };

  const stopResizing = (): void => {
    isResizing.current = false;
    document.body.style.userSelect = "";

    document.removeEventListener("mousemove", resize);
    document.removeEventListener("mouseup", stopResizing);
    document.removeEventListener("blur", stopResizing);
  };

  // const { src } = useImage({
  //   srcList: [image?.url ?? "../assets/images/unknown.jpg"]
  // });
  function getWidth(): number {
    const w = sidebarWidth.split("px")[0];
    if (parseInt(w) < 300 || isNaN(parseInt(w))) {
      return 300;
    } else {
      return parseInt(w);
    }
  }

  return (
    <div
      tabIndex={2}
      style={{ paddingLeft: `${getWidth() + 6}px`, height: bottombarHeight }}
      className={`fixed select-auto overflow-x-scroll bottom-0   border-border   w-full   bg-background `}
    >
      <div
        className={`fixed  w-full  h-1 cursor-row-resize bg-background hover:bg-border `}
        onMouseDown={startResizing}
      >
        <div className="border-t w-screen border-border "></div>
      </div>
      <EditMenu bottombar />
    </div>
  );
}
