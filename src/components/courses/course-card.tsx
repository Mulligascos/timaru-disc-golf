"use client";

import { useState } from "react";
import {
  MapPin,
  ChevronDown,
  ChevronUp,
  Layout,
  BarChart2,
} from "lucide-react";

interface HoleStats {
  allTime: { sum: number; count: number };
  season: { sum: number; count: number };
}

interface Hole {
  id: string;
  hole_number: number;
  par: number;
  distance_m: number | null;
  stats: HoleStats | null;
}

interface CourseCardProps {
  course: any;
  holes: Hole[];
  layouts: any[];
}

function formatAvg(avg: number): string {
  return avg.toFixed(2);
}

function formatVsPar(avg: number, par: number): string {
  const diff = avg - par;
  if (Math.abs(diff) < 0.005) return "E";
  return diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
}

function vsParColour(avg: number, par: number): string {
  const diff = avg - par;
  if (diff < -0.1) return "text-green-500";
  if (diff > 0.1) return "text-red-500";
  return "text-gray-400";
}

export function CourseCard({ course, holes, layouts }: CourseCardProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"holes" | "stats" | "layouts">("holes");
  const [statsSeason, setStatsSeason] = useState<"allTime" | "season">(
    "allTime",
  );

  const totalPar = holes.reduce((sum, h) => sum + (h.par ?? 0), 0);

  // Calculate course-level stat totals
  const courseAvg = (period: "allTime" | "season") => {
    const holesWithData = holes.filter(
      (h) => h.stats && h.stats[period].count > 0,
    );
    if (holesWithData.length === 0) return null;
    const totalAvg = holesWithData.reduce((sum, h) => {
      return sum + h.stats![period].sum / h.stats![period].count;
    }, 0);
    return totalAvg;
  };

  const tabs = [
    { key: "holes", label: `Holes (${holes.length})` },
    { key: "stats", label: "Stats" },
    ...(layouts.length > 0
      ? [{ key: "layouts", label: `Layouts (${layouts.length})` }]
      : []),
  ] as { key: "holes" | "stats" | "layouts"; label: string }[];

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-colour)",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left hover:opacity-80 transition-opacity"
      >
        <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <MapPin size={18} className="text-green-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="font-bold text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            {course.name}
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: "var(--text-secondary)" }}
          >
            {course.city && `${course.city} · `}
            {holes.length} holes · Par {totalPar}
            {layouts.length > 0 &&
              ` · ${layouts.length} layout${layouts.length > 1 ? "s" : ""}`}
            {course.round_count > 0 && ` · ${course.round_count} rounds played`}
          </p>
        </div>
        <div
          className="flex-shrink-0"
          style={{ color: "var(--text-secondary)" }}
        >
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Expandable content */}
      {open && (
        <div
          className="border-t"
          style={{ borderColor: "var(--border-colour)" }}
        >
          {/* Tabs */}
          <div
            className="flex border-b"
            style={{ borderColor: "var(--border-colour)" }}
          >
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                  tab === t.key
                    ? "border-b-2 border-green-500 text-green-500"
                    : ""
                }`}
                style={
                  tab !== t.key ? { color: "var(--text-secondary)" } : undefined
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Holes tab */}
          {tab === "holes" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    className="border-b"
                    style={{ borderColor: "var(--border-colour)" }}
                  >
                    <th
                      className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Hole
                    </th>
                    <th
                      className="text-center px-4 py-2 text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Par
                    </th>
                    <th
                      className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Distance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {holes.map((hole) => (
                    <tr
                      key={hole.id}
                      className="border-b last:border-0"
                      style={{ borderColor: "var(--border-colour)" }}
                    >
                      <td
                        className="px-4 py-2.5 font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        #{hole.hole_number}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                            hole.par === 3
                              ? "bg-green-100 text-green-700"
                              : hole.par === 4
                                ? "bg-blue-100 text-blue-700"
                                : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {hole.par}
                        </span>
                      </td>
                      <td
                        className="px-4 py-2.5 text-right text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {hole.distance_m ? `${hole.distance_m}m` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: `2px solid var(--border-colour)` }}>
                    <td
                      className="px-4 py-2.5 text-xs font-bold uppercase tracking-wide"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Total
                    </td>
                    <td
                      className="px-4 py-2.5 text-center font-bold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {totalPar}
                    </td>
                    <td
                      className="px-4 py-2.5 text-right text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {holes.reduce((sum, h) => sum + (h.distance_m ?? 0), 0) >
                      0
                        ? `${holes.reduce((sum, h) => sum + (h.distance_m ?? 0), 0)}m`
                        : "—"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Stats tab */}
          {tab === "stats" && (
            <div>
              {/* Season toggle */}
              <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                <div
                  className="flex rounded-lg overflow-hidden border"
                  style={{ borderColor: "var(--border-colour)" }}
                >
                  {(["allTime", "season"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setStatsSeason(p)}
                      className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                        statsSeason === p ? "bg-green-500 text-white" : ""
                      }`}
                      style={
                        statsSeason !== p
                          ? {
                              color: "var(--text-secondary)",
                              background: "var(--bg-primary)",
                            }
                          : undefined
                      }
                    >
                      {p === "allTime"
                        ? "All Time"
                        : `${new Date().getFullYear()} Season`}
                    </button>
                  ))}
                </div>
                {(() => {
                  const avg = courseAvg(statsSeason);
                  if (avg === null) return null;
                  const diff = avg - totalPar;
                  return (
                    <p
                      className="text-xs ml-auto"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Course avg:{" "}
                      <span
                        className={`font-bold ${vsParColour(avg, totalPar)}`}
                      >
                        {diff > 0 ? "+" : ""}
                        {diff.toFixed(2)} vs par
                      </span>
                    </p>
                  );
                })()}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr
                      className="border-b"
                      style={{ borderColor: "var(--border-colour)" }}
                    >
                      <th
                        className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Hole
                      </th>
                      <th
                        className="text-center px-4 py-2 text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Par
                      </th>
                      <th
                        className="text-center px-4 py-2 text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Avg Score
                      </th>
                      <th
                        className="text-center px-4 py-2 text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Vs Par
                      </th>
                      <th
                        className="text-right px-4 py-2 text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Rounds
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {holes.map((hole) => {
                      const stat = hole.stats?.[statsSeason];
                      const avg =
                        stat && stat.count > 0 ? stat.sum / stat.count : null;
                      return (
                        <tr
                          key={hole.id}
                          className="border-b last:border-0"
                          style={{ borderColor: "var(--border-colour)" }}
                        >
                          <td
                            className="px-4 py-2.5 font-semibold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            #{hole.hole_number}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                hole.par === 3
                                  ? "bg-green-100 text-green-700"
                                  : hole.par === 4
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-purple-100 text-purple-700"
                              }`}
                            >
                              {hole.par}
                            </span>
                          </td>
                          <td
                            className="px-4 py-2.5 text-center font-mono text-sm font-semibold"
                            style={{
                              color:
                                avg !== null
                                  ? "var(--text-primary)"
                                  : "var(--text-secondary)",
                            }}
                          >
                            {avg !== null ? formatAvg(avg) : "—"}
                          </td>
                          <td className="px-4 py-2.5 text-center font-mono text-sm font-bold">
                            {avg !== null ? (
                              <span className={vsParColour(avg, hole.par)}>
                                {formatVsPar(avg, hole.par)}
                              </span>
                            ) : (
                              <span style={{ color: "var(--text-secondary)" }}>
                                —
                              </span>
                            )}
                          </td>
                          <td
                            className="px-4 py-2.5 text-right text-xs"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {stat?.count ?? 0}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* No data message */}
              {holes.every(
                (h) => !h.stats || h.stats[statsSeason].count === 0,
              ) && (
                <div className="text-center py-8">
                  <BarChart2
                    size={32}
                    className="mx-auto mb-2"
                    style={{ color: "var(--border-colour)" }}
                  />
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    No scores recorded{" "}
                    {statsSeason === "season" ? "this season" : "yet"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Layouts tab */}
          {tab === "layouts" && layouts.length > 0 && (
            <div className="p-4 space-y-2">
              {layouts.map((layout: any) => (
                <div
                  key={layout.id}
                  className="flex items-center gap-3 p-3 rounded-xl border"
                  style={{
                    borderColor: "var(--border-colour)",
                    background: "var(--bg-primary)",
                  }}
                >
                  <div className="w-9 h-9 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Layout size={16} className="text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className="font-semibold text-sm"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {layout.name}
                      </p>
                      {layout.is_default && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          Default
                        </span>
                      )}
                    </div>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {layout.hole_count} holes
                      {layout.description && ` · ${layout.description}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
