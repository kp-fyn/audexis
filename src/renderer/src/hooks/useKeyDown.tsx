import { useState, useEffect } from "react";

export default function useKeyDown(key: string): boolean {
  const [keyDown, setKeyDown] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (key === "Meta" || key === "Control") {
        if (event.ctrlKey || event.metaKey) {
          setKeyDown(true);
        } else {
          if (event.key === key) {
            setKeyDown(true);
          }
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent): void => {
      if (key === "Meta" || key === "Ctrl") {
        if (event.ctrlKey || event.metaKey) {
          setKeyDown(false);
          console.log("Key");
        } else {
          if (event.key === key) {
            setKeyDown(false);
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return (): void => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return keyDown;
}
