"use client";

import { useTheme } from "./ThemeProvider";
import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themes: Array<{
    value: "light" | "dark" | "system";
    icon: typeof SunIcon;
    label: string;
  }> = [
    { value: "light", icon: SunIcon, label: "Light" },
    { value: "dark", icon: MoonIcon, label: "Dark" },
    { value: "system", icon: ComputerDesktopIcon, label: "System" },
  ];

  return (
    <div className="fixed top-6 right-6 z-50 flex gap-1 rounded-lg bg-transparent border border-border p-1 shadow-lg">
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`
            flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors
            ${
              theme === value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }
          `}
          title={label}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
