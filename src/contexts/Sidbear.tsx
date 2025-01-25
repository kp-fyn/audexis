"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

import useWindowDimensions from "@/hooks/useWindowDimensions";

interface SidebarWidth {
  sidebarWidth: string;
}

const SidebarWidthContext = createContext<SidebarWidth>({
  sidebarWidth: "300px",
});

export const useSidebarWidth = (): string => {
  const context = useContext(SidebarWidthContext);

  if (!context) {
    throw new Error(
      "useSidebarWidth must be used within a SidebarWidthProvider",
    );
  }
  return context.sidebarWidth!;
};

export const SidebarWidthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { width } = useWindowDimensions();
  const [sidebarWidth, setSidebarWidth] = useState(`300px`);
  useEffect(() => {
    if (width / 4 >= 300) {
      setSidebarWidth(`${width / 4}px`);
    } else {
      setSidebarWidth(`300px`);
    }
  }, []);
  return (
    <SidebarWidthContext.Provider value={{ sidebarWidth: sidebarWidth }}>
      {children}
    </SidebarWidthContext.Provider>
  );
};
