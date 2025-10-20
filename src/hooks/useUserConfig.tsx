/* eslint-disable react-refresh/only-export-components */
"use client";
import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { UserConfig, Column } from "@/ui/types";
import { Event, listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

const UserConfigContext = createContext<Config>({
  config: {
    theme: "light",
    onboarding: false,
    view: "folder",
    columns: [],
    albums: [],
    density: "default",
  },
  allColumns: [],
  setTheme: () => {},
  setView: () => {},
  setColumns: () => {},
  setDensity: () => {},
  setAllColumns: () => {},
});

interface Config {
  config: UserConfig;
  allColumns: Column[];
  setAllColumns: (columns: Column[]) => void;
  setTheme: (theme: "light" | "dark") => void;
  setView: (view: "simple" | "folder") => void;
  setColumns: (column: Column[]) => void;
  setDensity: (density: "default" | "compact" | "comfort") => void;
}

export function useUserConfig(): Config {
  const context = useContext(UserConfigContext);

  if (!context) {
    throw new Error("useChanges must be used within a SidebarWidthProvider");
  }
  return context;
}

export function UserConfigProvider({
  children,
  initialTheme,
}: {
  children: ReactNode;
  initialTheme: string;
}): ReactNode {
  const [hasOpened, setHasOpened] = useState(false);

  const [userConfig, setUserConfig] = useState<UserConfig>({
    theme: initialTheme ? (initialTheme as "light" | "dark") : "light",
    onboarding: false,
    view: "folder",
    columns: [],
    albums: [],
    density: "default",
  });
  const [allColumns, setAllColumns] = useState<Column[]>([]);
  useEffect(() => {
    const unlisten = listen(
      "user-config-updated",
      (event: Event<UserConfig>) => {
        const config = event.payload;
        const params = new URLSearchParams(window.location.search);
        const themeLower = (config.theme as string).toLowerCase() as
          | "light"
          | "dark";
        params.set("theme", themeLower);
        document.documentElement.setAttribute(
          "data-density",
          config.density.toLowerCase() as string
        );

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, "", newUrl);
        setUserConfig({
          ...config,
          theme: themeLower,
          density: (config.density as string).toLowerCase() as
            | "default"
            | "compact"
            | "comfort",
          view: (config.view as string).toLowerCase(),
        });
        localStorage.setItem("theme", themeLower);

        if (config.onboarding) {
          setHasOpened(true);
          if (hasOpened) return;
          // window.app.openOnboarding();
        }

        document.documentElement.setAttribute("data-theme", themeLower);
      }
    );
    // window.app.onUserConfigUpdate((_e, config) => {
    //     console.log(config);
    //     setUserConfig(config);

    // });
    // window.app.test();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  return (
    <UserConfigContext.Provider
      value={{
        config: userConfig,
        setTheme: (theme: "light" | "dark") => {
          setUserConfig({ ...userConfig, theme });
          invoke("update_user_config", {
            patch: {
              theme: theme.charAt(0).toUpperCase() + theme.slice(1),
            },
          });
          localStorage.setItem("theme", theme);
          document.documentElement.setAttribute("data-theme", theme);
          // window.app.updateConfig({theme});
        },

        setView: (view: "simple" | "folder") => {
          setUserConfig({ ...userConfig, view });
        },
        setColumns: (c) => {
          setUserConfig((prev) => {
            const updated: UserConfig = { ...prev, columns: c };
            invoke("update_user_config", {
              patch: {
                columns: c,
              },
            });
            return updated;
          });
        },
        setAllColumns,
        allColumns,
        setDensity: (density) => {
          setUserConfig((prev) => ({ ...prev, density }));
          invoke("update_user_config", {
            patch: {
              density:
                density === "default"
                  ? "Default"
                  : density === "compact"
                  ? "Compact"
                  : "Comfort",
            },
          });
          document.documentElement.setAttribute("data-density", density);
        },
      }}
    >
      {children}
    </UserConfigContext.Provider>
  );
}
