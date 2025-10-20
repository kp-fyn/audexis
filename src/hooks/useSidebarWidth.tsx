/* eslint-disable react-refresh/only-export-components */
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
  sidebarWidth: number;

  setSidebarWidth(w: number): void;
}

const SidebarWidthContext = createContext<SidebarWidth>({
  sidebarWidth: 300,
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
  const [sidebarWidth, setSidebarWidth] = useState(300);

  useEffect(() => {
    if (width / 4 >= 300) {
      setSidebarWidth(width / 4);
    } else {
      setSidebarWidth(300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (sidebarWidth > width - 200) {
      if (width - 200 < 300) {
        setSidebarWidth(300);
      } else {
        setSidebarWidth(width - 200);
      }
    }
  }, [width, sidebarWidth]);

  function setWidth(w: number): void {
    const nw = w;
    if (nw < 300 || isNaN(nw)) {
      setSidebarWidth(300);
    } else if (nw > width - 300) {
      setSidebarWidth(width - 300);
    } else {
      setSidebarWidth(w);
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
