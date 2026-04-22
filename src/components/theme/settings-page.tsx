"use client";

import { useTheme } from "@/components/theme/theme-provider";
import { useState } from "react";
import { Sun, Moon, Type, Palette, Check } from "lucide-react";

// A hand-curated swatch grid — 8 columns × 8 rows of colours
const SWATCHES = [
  // Reds
  "#fca5a5",
  "#f87171",
  "#ef4444",
  "#dc2626",
  "#b91c1c",
  "#991b1b",
  "#7f1d1d",
  "#450a0a",
  // Oranges
  "#fdba74",
  "#fb923c",
  "#f97316",
  "#ea580c",
  "#c2410c",
  "#9a3412",
  "#7c2d12",
  "#431407",
  // Yellows
  "#fde047",
  "#facc15",
  "#eab308",
  "#ca8a04",
  "#a16207",
  "#854d0e",
  "#713f12",
  "#422006",
  // Limes
  "#bef264",
  "#a3e635",
  "#84cc16",
  "#65a30d",
  "#4d7c0f",
  "#3f6212",
  "#365314",
  "#1a2e05",
  // Greens
  "#86efac",
  "#4ade80",
  "#22c55e",
  "#16a34a",
  "#15803d",
  "#166534",
  "#14532d",
  "#052e16",
  // Teals
  "#5eead4",
  "#2dd4bf",
  "#14b8a6",
  "#0d9488",
  "#0f766e",
  "#115e59",
  "#134e4a",
  "#042f2e",
  // Cyans
  "#67e8f9",
  "#22d3ee",
  "#06b6d4",
  "#0891b2",
  "#0e7490",
  "#155e75",
  "#164e63",
  "#083344",
  // Blues
  "#93c5fd",
  "#60a5fa",
  "#3b82f6",
  "#2563eb",
  "#1d4ed8",
  "#1e40af",
  "#1e3a8a",
  "#172554",
  // Indigos
  "#a5b4fc",
  "#818cf8",
  "#6366f1",
  "#4f46e5",
  "#4338ca",
  "#3730a3",
  "#312e81",
  "#1e1b4b",
  // Purples
  "#d8b4fe",
  "#c084fc",
  "#a855f7",
  "#9333ea",
  "#7e22ce",
  "#6b21a8",
  "#581c87",
  "#3b0764",
  // Pinks
  "#f9a8d4",
  "#f472b6",
  "#ec4899",
  "#db2777",
  "#be185d",
  "#9d174d",
  "#831843",
  "#500724",
  // Roses
  "#fda4af",
  "#fb7185",
  "#f43f5e",
  "#e11d48",
  "#be123c",
  "#9f1239",
  "#881337",
  "#4c0519",
  // Grays
  "#f9fafb",
  "#e5e7eb",
  "#9ca3af",
  "#6b7280",
  "#4b5563",
  "#374151",
  "#1f2937",
  "#111827",
  // Slates
  "#f8fafc",
  "#e2e8f0",
  "#94a3b8",
  "#64748b",
  "#475569",
  "#334155",
  "#1e293b",
  "#0f172a",
];

export default function SettingsPage() {
  const { settings, update } = useTheme();
  const [customColour, setCustomColour] = useState(settings.accentColour);

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Personalise your app experience
        </p>
      </div>

      {/* ── Theme mode ── */}
      <section
        className="rounded-2xl border p-5 space-y-4"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-colour)",
        }}
      >
        <div className="flex items-center gap-2">
          <Palette size={18} style={{ color: "var(--text-secondary)" }} />
          <h2
            className="font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Appearance
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { value: "light", label: "Light", icon: Sun },
              { value: "dark", label: "Dark", icon: Moon },
            ] as const
          ).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => update({ mode: value })}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                settings.mode === value
                  ? "border-[var(--accent-500)] bg-[var(--accent-50)] text-[var(--accent-700)]"
                  : "border-[var(--border-colour)] text-[var(--text-secondary)] hover:border-[var(--accent-300)]"
              }`}
            >
              <Icon size={16} />
              {label}
              {settings.mode === value && <Check size={14} />}
            </button>
          ))}
        </div>
      </section>

      {/* ── Font size ── */}
      <section
        className="rounded-2xl border p-5 space-y-4"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-colour)",
        }}
      >
        <div className="flex items-center gap-2">
          <Type size={18} style={{ color: "var(--text-secondary)" }} />
          <h2
            className="font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Font Size
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {(
            [
              { value: "small", label: "Small", size: "text-xs" },
              { value: "medium", label: "Medium", size: "text-sm" },
              { value: "large", label: "Large", size: "text-base" },
            ] as const
          ).map(({ value, label, size }) => (
            <button
              key={value}
              onClick={() => update({ fontSize: value })}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 font-semibold transition-all ${
                settings.fontSize === value
                  ? "border-[var(--accent-500)] bg-[var(--accent-50)] text-[var(--accent-700)]"
                  : "border-[var(--border-colour)] text-[var(--text-secondary)] hover:border-[var(--accent-300)]"
              }`}
            >
              <span
                className={`${size} font-bold`}
                style={{ color: "var(--text-primary)" }}
              >
                Aa
              </span>
              <span className="text-xs">{label}</span>
              {settings.fontSize === value && <Check size={12} />}
            </button>
          ))}
        </div>
      </section>

      {/* ── Accent colour ── */}
      <section
        className="rounded-2xl border p-5 space-y-4"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-colour)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette size={18} style={{ color: "var(--text-secondary)" }} />
            <h2
              className="font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Accent Colour
            </h2>
          </div>
          {/* Current colour preview */}
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full border-2 border-white shadow-md"
              style={{ backgroundColor: settings.accentColour }}
            />
            <span
              className="text-xs font-mono"
              style={{ color: "var(--text-secondary)" }}
            >
              {settings.accentColour.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Swatch grid */}
        <div className="grid grid-cols-8 gap-1.5">
          {SWATCHES.map((colour) => (
            <button
              key={colour}
              onClick={() => {
                update({ accentColour: colour });
                setCustomColour(colour);
              }}
              className="aspect-square rounded-lg transition-all hover:scale-110 active:scale-95 relative"
              style={{ backgroundColor: colour }}
              title={colour}
            >
              {settings.accentColour === colour && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check
                    size={12}
                    className="text-white drop-shadow"
                    strokeWidth={3}
                  />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Custom colour picker */}
        <div className="flex items-center gap-3 pt-1">
          <div className="flex-1">
            <label
              className="block text-xs font-semibold mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Custom colour
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={customColour}
                onChange={(e) => setCustomColour(e.target.value)}
                className="w-10 h-10 rounded-lg border cursor-pointer p-0.5"
                style={{ borderColor: "var(--border-colour)" }}
              />
              <input
                type="text"
                value={customColour}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomColour(val);
                  if (/^#[0-9a-fA-F]{6}$/.test(val))
                    update({ accentColour: val });
                }}
                placeholder="#22c55e"
                className="flex-1 px-3 py-2 rounded-lg border text-sm font-mono focus:outline-none focus:ring-2"
                style={{
                  background: "var(--bg-primary)",
                  borderColor: "var(--border-colour)",
                  color: "var(--text-primary)",
                }}
              />
              <button
                onClick={() => update({ accentColour: customColour })}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: "var(--accent-600)" }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Preview ── */}
      <section
        className="rounded-2xl border p-5 space-y-3"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-colour)",
        }}
      >
        <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>
          Preview
        </h2>
        <div className="space-y-2">
          <div
            className="flex items-center gap-3 p-3 rounded-xl border"
            style={{ borderColor: "var(--border-colour)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: "var(--accent-500)" }}
            >
              🥏
            </div>
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Timaru Disc Golf
              </p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Your club app
              </p>
            </div>
          </div>
          <button
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: "var(--accent-600)" }}
          >
            Sample Button
          </button>
          <p className="text-xs" style={{ color: "var(--accent-600)" }}>
            Accent text colour
          </p>
        </div>
      </section>

      {/* Reset */}
      <button
        onClick={() => {
          update({
            mode: "light",
            fontSize: "medium",
            accentColour: "#22c55e",
          });
          setCustomColour("#22c55e");
        }}
        className="w-full py-3 rounded-xl border text-sm font-semibold transition-colors"
        style={{
          borderColor: "var(--border-colour)",
          color: "var(--text-secondary)",
        }}
      >
        Reset to Defaults
      </button>
    </div>
  );
}
