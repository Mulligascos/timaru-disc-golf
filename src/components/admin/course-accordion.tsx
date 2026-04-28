"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, MapPin, Layout } from "lucide-react";
import { HoleEditor } from "@/components/admin/hole-editor";
import { LayoutEditor } from "@/components/admin/layout-editor";

interface CourseAccordionProps {
  course: any;
  holes: any[];
  layouts: any[];
}

export function CourseAccordion({
  course,
  holes,
  layouts,
}: CourseAccordionProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"holes" | "layouts">("holes");

  const totalPar = holes.reduce((sum: number, h: any) => sum + (h.par ?? 0), 0);

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-colour)",
      }}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left hover:opacity-80 transition-opacity"
      >
        <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <MapPin size={18} className="text-green-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className="font-bold text-sm"
              style={{ color: "var(--text-primary)" }}
            >
              {course.name}
            </p>
            {!course.is_active && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                Inactive
              </span>
            )}
          </div>
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
            {(["holes", "layouts"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                  tab === t ? "border-b-2 border-green-500 text-green-500" : ""
                }`}
                style={
                  tab !== t ? { color: "var(--text-secondary)" } : undefined
                }
              >
                {t === "holes"
                  ? `Holes (${holes.length})`
                  : `Layouts (${layouts.length})`}
              </button>
            ))}
          </div>

          <div className="p-4">
            {tab === "holes" && (
              <HoleEditor
                courseId={course.id}
                holes={holes}
                holeCount={course.hole_count}
              />
            )}
            {tab === "layouts" && (
              <LayoutEditor
                courseId={course.id}
                holes={holes}
                layouts={layouts}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
