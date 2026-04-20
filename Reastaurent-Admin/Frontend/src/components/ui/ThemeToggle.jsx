import { useEffect, useState } from "react";

function SunIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved) return saved;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="group relative grid h-11 w-11 place-items-center rounded-2xl border border-border-subtle bg-surface-muted transition-all duration-300 hover:border-brand-500/30 hover:bg-brand-500/5 shadow-[0_8px_18px_rgba(25,60,48,0.06)]"
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      <div className="relative h-5 w-5 overflow-hidden">
        <div
          className={`absolute inset-0 transition-transform duration-500 ${
            theme === "light" ? "translate-y-0" : "-translate-y-8"
          }`}
        >
          <SunIcon className="h-5 w-5 text-amber-500" />
        </div>
        <div
          className={`absolute inset-0 transition-transform duration-500 ${
            theme === "dark" ? "translate-y-0" : "translate-y-8"
          }`}
        >
          <MoonIcon className="h-5 w-5 text-indigo-400" />
        </div>
      </div>
    </button>
  );
}

export default ThemeToggle;
