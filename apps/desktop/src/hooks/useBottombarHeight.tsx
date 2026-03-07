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

interface BottombarHeight {
  bottombarHeight: number;

  setBottombarHeight(w: number): void;
}

const BottombarHeightContext = createContext<BottombarHeight>({
  bottombarHeight: 300,
  setBottombarHeight: () => {},
});

export const useBottombarHeight = (): BottombarHeight => {
  const context = useContext(BottombarHeightContext);

  if (!context) {
    throw new Error(
      "useBottombarHeight must be used within a BottombarHeightProvider",
    );
  }
  return context;
};

export const BottombarHeightProvider: FC<{
  children: ReactNode;
}> = ({ children }) => {
  const { height } = useWindowDimensions();
  const [bottombarHeight, setBottombarHeight] = useState(300);

  useEffect(() => {
    if (height / 4 >= 300) {
      setBottombarHeight(height / 4);
    } else {
      setBottombarHeight(300);
    }
  }, []);
  useEffect(() => {
    if (bottombarHeight > height - 200) {
      if (height - 200 < 300) {
        setBottombarHeight(300);
      } else {
        setBottombarHeight(height - 200);
      }
    }
  }, [height, bottombarHeight]);

  function setHeight(w: number): void {
    const nw = w;
    if (nw < 300 || isNaN(nw)) {
      setBottombarHeight(300);
    } else if (nw > height - 300) {
      setBottombarHeight(height - 300);
    } else {
      setBottombarHeight(w);
    }
  }

  return (
    <BottombarHeightContext.Provider
      value={{ bottombarHeight, setBottombarHeight: setHeight }}
    >
      {children}
    </BottombarHeightContext.Provider>
  );
};
