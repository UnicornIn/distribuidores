"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark" | "system";

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    const storedTheme = localStorage.getItem(storageKey) as Theme | null;
    return storedTheme ?? defaultTheme;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = window.document.documentElement;

    // Modo sistema: detecta el tema preferido del sistema
    const systemTheme =
      window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

    const appliedTheme = theme === "system" ? systemTheme : theme;

    root.classList.remove("light", "dark");
    root.classList.add(appliedTheme);
  }, [theme]);

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
