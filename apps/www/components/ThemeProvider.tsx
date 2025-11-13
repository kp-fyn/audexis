"use client";
import { useState, createContext, useEffect, useContext } from "react";

const ThemeContext = createContext<{
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
}>({
  theme: "light",
  setTheme: () => {},
});

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  function changeTheme(newTheme: "light" | "dark") {
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    document.cookie = `theme=${newTheme}; path=/; max-age=31536000`;
  }
  useEffect(() => {
    let storedTheme = "";
    document.cookie.split("; ").forEach((cookie) => {
      const [name, value] = cookie.split("=");
      if (name === "theme" && (value === "light" || value === "dark")) {
        storedTheme = value;
      }
    });
    if (storedTheme.length) {
      if (storedTheme !== "light" && storedTheme !== "dark") {
        storedTheme = "light";
      }
      setTheme(storedTheme);
      document.documentElement.setAttribute("data-theme", storedTheme);
      document.cookie = `theme=${storedTheme}; path=/; max-age=31536000`;
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      document.documentElement.setAttribute(
        "data-theme",
        prefersDark ? "dark" : "light"
      );
      document.cookie = `theme=${
        prefersDark ? "dark" : "light"
      }; path=/; max-age=31536000`;

      setTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
