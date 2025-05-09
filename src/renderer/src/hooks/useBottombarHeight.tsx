/* eslint-disable react-refresh/only-export-components */
"use client";
import { createContext, useContext, useEffect, useState, FC, ReactNode } from "react";

import useWindowDimensions from "@/ui/hooks/useWindowDimensions";

interface bottomBarHeight {
  bottombarHeight: string;
  setBottombarHeight(w: string): void;
}

const BottombarHeightContext = createContext<bottomBarHeight>({
  bottombarHeight: "300px",
  setBottombarHeight: () => {},
});

export const useBottombarHeight = (): bottomBarHeight => {
  const context = useContext(BottombarHeightContext);

  if (!context) {
    throw new Error("useBottombarHeight must be used within a bottomHeightProvider");
  }
  return context;
};

export const BottomHeightProvider: FC<{
  children: ReactNode;
}> = ({ children }) => {
  const { height } = useWindowDimensions();
  const [bottombarHeight, setBottombarHeight] = useState(`300px`);
  const [percentage, setPercentage] = useState(25);
  useEffect(() => {
    if (height / 4 >= 300) {
      setBottombarHeight(`${height / 4}px`);
    } else {
      setBottombarHeight(`300px`);

      setPercentage((300 / height) * 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    setBottombarHeight(`${height * (percentage / 100)}px`);
  }, [height, percentage]);

  function setHeight(w: string): void {
    setBottombarHeight(w);
  }
  return (
    <BottombarHeightContext.Provider value={{ bottombarHeight, setBottombarHeight: setHeight }}>
      {children}
    </BottombarHeightContext.Provider>
  );
};
