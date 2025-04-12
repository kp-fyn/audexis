/* eslint-disable react-hooks/exhaustive-deps */
import React, { ReactNode, useState } from "react";
import { Button } from "./button";

export default function Header(): ReactNode {
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const [startMousePosition, setStartMousePosition] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });
  const [startWindowPosition, setStartWindowPosition] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
    setIsDragging(true);
    console.log(e.currentTarget);

    setStartMousePosition({ x: e.screenX, y: e.screenY });

    window.app.getWindowPosition().then((position: { x: number; y: number }) => {
      setStartWindowPosition({ x: position.x, y: position.y });
    });
  };

  const handleMouseMove = (e: MouseEvent): void => {
    if (isDragging) {
      const dx = e.screenX - startMousePosition.x;
      const dy = e.screenY - startMousePosition.y;

      window.app.setWindowPosition(startWindowPosition.x + dx, startWindowPosition.y + dy);
    }
  };

  function handleMouseUp(): void {
    setIsDragging(false);
  }

  React.useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return (): void => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, startMousePosition, startWindowPosition]);
  return (
    <div
      className={
        "z-[999999] bg-neutral-950 border-b  w-full  border-gray-700  fixed h-[48px] top-0 flex"
      }
    >
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={() => {
          window.app.isMaximized().then((isMaximized: boolean) => {
            if (isMaximized) {
              window.app.unmaximize();
            } else {
              window.app.maximize();
            }
          });
        }}
        className="flex-1 select-none "
      >
        <></>
      </div>
      <div className="ml-auto justify-center px-2 flex items-center h-full">
        <Button id="import" size={"sm"} onClick={() => window.app.openDialog()}>
          Import FIle
        </Button>
      </div>
    </div>
  );
}
