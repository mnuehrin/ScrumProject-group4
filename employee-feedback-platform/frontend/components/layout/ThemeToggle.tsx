"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem("theme") as Theme | null;
    if (stored) {
      setTheme(stored);
      document.documentElement.classList.toggle("dark", stored === "dark");
      return;
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial: Theme = prefersDark ? "dark" : "light";
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    window.localStorage.setItem("theme", next);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/80 text-foreground shadow-sm transition hover:bg-accent/60"
    >
      {theme === "dark" ? (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
          <path d="M9.33 2.05a.75.75 0 0 1 .37 1.03 6.5 6.5 0 1 0 7.2 9.2.75.75 0 0 1 1.35.64 8 8 0 1 1-8.92-10.87Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
          <path d="M10 3.5a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 10 3.5Zm0 12.5a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75ZM3.5 9.25a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75Zm12.5 0a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75ZM5.56 5.56a.75.75 0 0 1 1.06 0l.35.35a.75.75 0 1 1-1.06 1.06l-.35-.35a.75.75 0 0 1 0-1.06Zm7.52 7.52a.75.75 0 0 1 1.06 0l.35.35a.75.75 0 1 1-1.06 1.06l-.35-.35a.75.75 0 0 1 0-1.06ZM5.56 14.44a.75.75 0 0 1 0-1.06l.35-.35a.75.75 0 1 1 1.06 1.06l-.35.35a.75.75 0 0 1-1.06 0Zm7.52-7.52a.75.75 0 0 1 0-1.06l.35-.35a.75.75 0 1 1 1.06 1.06l-.35.35a.75.75 0 0 1-1.06 0ZM10 6.25A3.75 3.75 0 1 0 10 13.75 3.75 3.75 0 0 0 10 6.25Z" />
        </svg>
      )}
    </button>
  );
}
