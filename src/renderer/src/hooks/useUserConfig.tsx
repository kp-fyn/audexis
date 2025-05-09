/* eslint-disable react-refresh/only-export-components */
"use client";
import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { UserConfig } from "../../../types";

const UserConfigContext = createContext<Config>({
  config: {
    theme: "light",
    onboarding: false,
    view: "folder",
    columns: [],
  },
  setTheme: () => {},
  setView: () => {},
  setColumns: () => {},
});
interface Config {
  config: UserConfig;
  setTheme: (theme: "light" | "dark") => void;
  setView: (view: "simple" | "folder") => void;
  setColumns: (column: { label: string; size: number; value: string }[]) => void;
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
  });
  useEffect(() => {
    window.app.test();
    const cachedTheme = localStorage.getItem("theme");
    if (cachedTheme) {
      if (cachedTheme !== "light" && cachedTheme !== "dark") {
        localStorage.setItem("theme", "light");
      }

      setUserConfig({ ...userConfig, theme: cachedTheme as "light" | "dark" });
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add(cachedTheme as "light" | "dark");
    }
    window.app.onUserConfigUpdate((_e, config) => {
      setUserConfig((prev) => {
        const hasChanged = JSON.stringify(prev) !== JSON.stringify(config);
        if (!hasChanged) return prev;
        return config;
      });
      localStorage.setItem("theme", config.theme);
      if (config.onboarding === true) {
        setHasOpened(true);
        if (hasOpened) return;
        window.app.openOnboarding();
      }

      document.documentElement.classList.remove("dark");
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add(config.theme);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add(userConfig.theme);
  }, [userConfig]);

  return (
    <UserConfigContext.Provider
      value={{
        config: userConfig,
        setTheme: (theme: "light" | "dark") => {
          setUserConfig({ ...userConfig, theme });
          window.app.updateConfig({ theme });
        },

        setView: (view: "simple" | "folder") => {
          setUserConfig({ ...userConfig, view });
          window.app.updateConfig({ view });
        },
        setColumns: (c) => {
          setUserConfig((prev) => {
            const updated = { ...prev, columns: c };
            window.app.updateConfig({ columns: c });
            return updated;
          });
        },
      }}
    >
      {children}
    </UserConfigContext.Provider>
  );
}
