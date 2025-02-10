"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  FC,
  ReactNode,
} from "react";

import useWindowDimensions from "@/ui/hooks/useWindowDimensions";

interface SidebarWidth {
  sidebarWidth: string;
  setSidebarWidth(w: string): void;
}

const SidebarWidthContext = createContext<SidebarWidth>({
  sidebarWidth: "300px",
  setSidebarWidth: () => {},
});

export const useSidebarWidth = (): SidebarWidth => {
  const context = useContext(SidebarWidthContext);

  if (!context) {
    throw new Error(
      "useSidebarWidth must be used within a SidebarWidthProvider"
    );
  }
  return context;
};

export const SidebarWidthProvider: FC<{
  children: ReactNode;
}> = ({ children }) => {
  const { width } = useWindowDimensions();
  const [sidebarWidth, setSidebarWidth] = useState(`300px`);
  const [percentage, setPercentage] = useState(25);
  useEffect(() => {
    if (width / 4 >= 300) {
      setSidebarWidth(`${width / 4}px`);
    } else {
      setSidebarWidth(`300px`);
      console.log((300 / width) * 100);
      const p = (300 / width) * 100;
      setPercentage((300 / width) * 100);

      console.log((p / 100) * width);
    }
  }, []);
  useEffect(() => {
    if (sidebarWidth.endsWith("px")) {
      const nw = sidebarWidth.split("px")[0];
      if (parseInt(nw) < 300 || isNaN(parseInt(nw))) {
        setSidebarWidth("300px");
        setPercentage((300 / width) * 100);
      } else if (parseInt(nw) > width - 200) {
        setSidebarWidth(`${width - 200}px`);
        setPercentage(((width - 200) / width) * 100);
      } else {
        console.log("ee");

        const d = percentage / 100;
        const newWidth = d * width;
        console.log(newWidth);
        if (newWidth >= 300) {
          setSidebarWidth(`${newWidth}px`);
          setPercentage((newWidth / width) * 100);
        } else {
          setSidebarWidth("300px");
          setPercentage((300 / width) * 100);
        }
      }
    } else {
      setSidebarWidth("300px");
      setPercentage((300 / width) * 100);
    }
  }, [width]);
  function setWidth(w: string) {
    if (w.endsWith("px")) {
      const nw = w.split("px")[0];
      if (parseInt(nw) < 300 || isNaN(parseInt(nw))) {
        setSidebarWidth("300px");
      } else if (parseInt(nw) > width - 100) {
        setSidebarWidth(`${width - 100}px`);
      } else {
        setSidebarWidth(w);
      }
    }
  }
  return (
    <SidebarWidthContext.Provider
      value={{ sidebarWidth, setSidebarWidth: setWidth }}
    >
      {children}
    </SidebarWidthContext.Provider>
  );
};
