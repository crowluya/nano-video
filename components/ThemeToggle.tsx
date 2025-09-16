"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <>
      {theme === "light" ? (
        <Sun
          className="h-4 w-4 cursor-pointer"
          onClick={() => setTheme("dark")}
        />
      ) : (
        <Moon
          className="h-4 w-4 cursor-pointer"
          onClick={() => setTheme("light")}
        />
      )}
    </>
  );
}
