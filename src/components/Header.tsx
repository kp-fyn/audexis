// import constants from "../../shared/constants";
// import { useState } from "react";
// const { ipcRenderer } = window.require("electron");
import React, { useState } from "react";
// Import Electron API

export default function Header() {
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const [startMousePosition, setStartMousePosition] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });
  const [startWindowPosition, setStartWindowPosition] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });

  const handleMouseDown = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ): void => {
    setIsDragging(true);

    setStartMousePosition({ x: e.screenX, y: e.screenY });

    window.electronAPI
      .getWindowPosition()
      .then((position: { x: number; y: number }) => {
        setStartWindowPosition({ x: position.x, y: position.y });
      });
  };

  const handleMouseMove = (e: MouseEvent): void => {
    if (isDragging) {
      const dx = e.screenX - startMousePosition.x;
      const dy = e.screenY - startMousePosition.y;

      window.electronAPI.setWindowPosition(
        startWindowPosition.x + dx,
        startWindowPosition.y + dy,
      );
    }
  };

  function handleMouseUp(): void {
    setIsDragging(false);
  }

  React.useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, startMousePosition, startWindowPosition]);
  return (
    <div
      onMouseDown={handleMouseDown}
      onDoubleClick={() => {
        window.electronAPI.isMaximized().then((isMaximized: boolean) => {
          if (isMaximized) {
            window.electronAPI.unmaximize();
          } else {
            window.electronAPI.maximize();
          }
        });
      }}
      className={"bg-neutral-950 border-b  w-full  fixed h-[48px] top-0"}
    ></div>
  );
}
