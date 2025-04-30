/* eslint-disable react-hooks/exhaustive-deps */
import React, { ReactNode, useState } from "react";
import { Button } from "./button";
import { Settings } from "lucide-react";

export default function Header({ windowName, headerShown }: Props): ReactNode {
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

    setStartMousePosition({ x: e.screenX, y: e.screenY });

    window.app.getWindowPosition({ windowName }).then((position: { x: number; y: number }) => {
      setStartWindowPosition({ x: position.x, y: position.y });
    });
  };

  const handleMouseMove = (e: MouseEvent): void => {
    if (isDragging) {
      const dx = e.screenX - startMousePosition.x;
      const dy = e.screenY - startMousePosition.y;

      window.app.setWindowPosition({
        x: startWindowPosition.x + dx,
        y: startWindowPosition.y + dy,
        windowName,
      });
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
      className={`z-[999999] bg-background border-b  w-full  border-border  fixed h-[48px] top-0 ${headerShown ? "flex" : "hidden"} `}
    >
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={() => {
          window.app.isMaximized({ windowName }).then((isMaximized: boolean) => {
            if (isMaximized) {
              window.app.unmaximize({ windowName });
            } else {
              window.app.maximize({ windowName });
            }
          });
        }}
        className="flex-1 select-none "
      >
        <></>
      </div>
      <div className="ml-auto justify-center px-2 gap-2 flex items-center h-full">
        {windowName === "app" && (
          <>
            <Button id="import" size={"sm"} onClick={() => window.app.openDialog()}>
              Import FIle
            </Button>
            <button
              className="hover:bg-hover px-2 py-1 rounded-md"
              onClick={() => window.app.openSettings()}
            >
              <Settings />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
interface Props {
  windowName: string;
  headerShown: boolean;
}
