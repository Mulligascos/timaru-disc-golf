"use client";

import { createContext, useContext, useEffect, useState } from "react";

export interface ThemeSettings {
  mode: "light" | "dark";
  fontSize: "small" | "medium" | "large";
  accentColour: string; // hex
}

const DEFAULTS: ThemeSettings = {
  mode: "light",
  fontSize: "medium",
  accentColour: "#22c55e", // green-500
};

const STORAGE_KEY = "tdg-theme";

interface ThemeContextValue {
  settings: ThemeSettings;
  update: (patch: Partial<ThemeSettings>) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  settings: DEFAULTS,
  update: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function applyTheme(settings: ThemeSettings) {
  const root = document.documentElement;
  const { h, s, l } = hexToHsl(settings.accentColour);

  // Dark / light mode
  root.classList.toggle("dark", settings.mode === "dark");

  // Font size
  const fontSizes = { small: "14px", medium: "16px", large: "18px" };
  root.style.setProperty("--app-font-size", fontSizes[settings.fontSize]);

  // Accent colour CSS variables (generates a full scale from the chosen hue)
  root.style.setProperty("--accent-h", `${h}`);
  root.style.setProperty("--accent-s", `${s}%`);
  root.style.setProperty("--accent-50", `hsl(${h}, ${s}%, 97%)`);
  root.style.setProperty("--accent-100", `hsl(${h}, ${s}%, 93%)`);
  root.style.setProperty("--accent-200", `hsl(${h}, ${s}%, 86%)`);
  root.style.setProperty("--accent-300", `hsl(${h}, ${s}%, 75%)`);
  root.style.setProperty("--accent-400", `hsl(${h}, ${s}%, 62%)`);
  root.style.setProperty("--accent-500", `hsl(${h}, ${s}%, ${l}%)`);
  root.style.setProperty(
    "--accent-600",
    `hsl(${h}, ${s}%, ${Math.max(l - 8, 20)}%)`,
  );
  root.style.setProperty(
    "--accent-700",
    `hsl(${h}, ${s}%, ${Math.max(l - 18, 15)}%)`,
  );
  root.style.setProperty("--accent-900", `hsl(${h}, ${s}%, 12%)`);

  // Dark mode body background
  if (settings.mode === "dark") {
    root.style.setProperty("--bg-primary", "#000000");
    root.style.setProperty("--bg-card", "#111111");
    root.style.setProperty("--text-primary", "#f1f5f9");
    root.style.setProperty("--text-secondary", "#94a3b8");
    root.style.setProperty("--border-colour", "#222222");
  } else {
    root.style.setProperty("--bg-primary", "#f9fafb");
    root.style.setProperty("--bg-card", "#ffffff");
    root.style.setProperty("--text-primary", "#111827");
    root.style.setProperty("--text-secondary", "#373a41");
    root.style.setProperty("--border-colour", "#b4b6b8");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(DEFAULTS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = { ...DEFAULTS, ...JSON.parse(stored) };
        setSettings(parsed);
        applyTheme(parsed);
      } else {
        applyTheme(DEFAULTS);
      }
    } catch {
      applyTheme(DEFAULTS);
    }
    setMounted(true);
  }, []);

  function update(patch: Partial<ThemeSettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }

  // Prevent flash of wrong theme
  if (!mounted) return <>{children}</>;

  return (
    <ThemeContext.Provider value={{ settings, update }}>
      {children}
    </ThemeContext.Provider>
  );
}
