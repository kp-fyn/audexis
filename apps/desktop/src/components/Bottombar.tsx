import { ReactNode, useRef } from "react";
import EditMenu from "./EditMenu";

import { useBottombarHeight } from "../hooks/useBottombarHeight";

export default function Bottombar({ left }: { left: number }): ReactNode {
  const { bottombarHeight, setBottombarHeight } = useBottombarHeight();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  const startResizing = (): void => {
    isResizing.current = true;
    document.body.style.userSelect = "none";

    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResizing);
  };

  const resize = (event: MouseEvent): void => {
    if (isResizing.current && sidebarRef.current) {
      const newHeight = window.innerHeight - event.clientY;
      const minHeight = 200;
      const maxHeight = window.innerHeight - 200;
      document.body.style.userSelect = "none";

      if (newHeight >= minHeight && newHeight <= maxHeight) {
        setBottombarHeight(newHeight);
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
      tabIndex={2}
      style={{
        width: `calc(100% - ${left}px)`,
        // minWidth: "300px",
        marginLeft: `${left}px`,
        height: `${bottombarHeight}px`,
      }}
      className="bottom-0 fixed bg-background overflow-y-auto  "
    >
      <div
        className={` bg-transparent   w-full h-1 cursor-row-resize   hover:bg-border `}
        onMouseDown={startResizing}
      >
        <div className="border-t  border-border "></div>
      </div>

      <EditMenu bottombar />
    </div>
  );
}
