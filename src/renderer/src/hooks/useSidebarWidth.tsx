/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, FC, ReactNode } from "react";

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
    throw new Error("useSidebarWidth must be used within a SidebarWidthProvider");
  }
  return context;
};

export const SidebarWidthProvider: FC<{
  children: ReactNode;
}> = ({ children }) => {
  const { width } = useWindowDimensions();
  const [sidebarWidth, setSidebarWidth] = useState(`300px`);

  useEffect(() => {
    if (width / 4 >= 300) {
      setSidebarWidth(`${width / 4}px`);
    } else {
      setSidebarWidth(`300px`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const w = parseInt(sidebarWidth.split("px")[0]);
    if (w > width - 200) {
      if (width - 200 < 300) {
        setSidebarWidth("300px");
      } else {
        setSidebarWidth(`${width - 200}px`);
      }
    }
  }, [width, sidebarWidth]);
  function setWidth(w: string): void {
    if (w.endsWith("px")) {
      const nw = w.split("px")[0];
      if (parseInt(nw) < 300 || isNaN(parseInt(nw))) {
        setSidebarWidth(w);
        setSidebarWidth("300px");
      } else if (parseInt(nw) > width - 300) {
        setSidebarWidth(`${width - 300}px`);
      } else {
        setSidebarWidth(w);
      }
    }
  }

  return (
    <SidebarWidthContext.Provider value={{ sidebarWidth, setSidebarWidth: setWidth }}>
      {children}
    </SidebarWidthContext.Provider>
  );
};
