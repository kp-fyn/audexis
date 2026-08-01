import { getCurrentWindow } from "@tauri-apps/api/window";

import { LazyStore } from "@tauri-apps/plugin-store";
import {
  createContext,
  FC,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { OnboardingModal } from "../modals/OnboardingModal";

const store = new LazyStore("./settings.json");

type Store = {
  store: LazyStore;
  currentTheme: "light" | "dark";
};
const StoreContext = createContext<Store>({
  store,
  currentTheme: "light",
});
export const useStore = (): Store => {
  const context = useContext(StoreContext);

  if (!context) {
    throw new Error(
      "useSidebarWidth must be used within a SidebarWidthProvider",
    );
  }
  return context;
};
export const StoreProvider: FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [stateTheme, setStateTheme] = useState<"light" | "dark">("light");
  const [needsOnboarding, setNeedsOnboarding] = useState(true);
  useEffect(() => {
    store.onChange((key, val) => {
      if (key === "theme") {
        let theme: "light" | "dark" = "light";
        if (!val || (val !== "dark" && val !== "light")) {
          theme = "light";
        } else {
          theme = val;
        }
        if (theme !== val) {
          store.set("theme", theme).then(() => {
            store.save();
          });
        }
        setStateTheme(theme);
        document.documentElement.dataset.theme = theme;
      }
    });

    store.reload();
    store.init().then((s) => {
      store.get("theme").then((ogTheme) => {
        let theme: "light" | "dark" = "light";
        if (!ogTheme || (ogTheme !== "dark" && ogTheme !== "light")) {
          theme = "light";
        } else {
          theme = ogTheme;
        }
        if (theme !== ogTheme) {
          store.set("theme", theme).then(() => {
            store.save();
          });
        }

        setStateTheme(theme);
        localStorage.setItem("theme", theme);
        document.documentElement.dataset.theme = theme;
        store.get("needsOnboarding").then((val) => {
          if (val === false) {
            setNeedsOnboarding(false);
          }
          getCurrentWindow().show();
        });
      });
    });
  }, [stateTheme]);

  return (
    <StoreContext.Provider value={{ store: store, currentTheme: stateTheme }}>
      <div className="h-full w-full mt-14"></div>
      <OnboardingModal
        open={needsOnboarding}
        onClose={() => {
          store.set("needsOnboarding", false).then(() => {
            store.save();
          });
          setNeedsOnboarding(false);
        }}
      />
      {children}
    </StoreContext.Provider>
  );
};
