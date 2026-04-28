"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Star,
  Check,
  GripVertical,
  RefreshCw,
} from "lucide-react";

interface Hole {
  id: string;
  hole_number: number;
  par: number;
  distance_m: number | null;
}

interface Layout {
  id: string;
  name: string;
  description: string | null;
  hole_count: number;
  is_default: boolean;
}

interface LayoutEditorProps {
  courseId: string;
  holes: Hole[];
  layouts: Layout[];
}

interface LayoutHoleEntry {
  position: number;
  source_hole_id: string;
  par_override: number | null;
}

export function LayoutEditor({
  courseId,
  holes,
  layouts: initialLayouts,
}: LayoutEditorProps) {
  const supabase = createClient();
  const router = useRouter();
  const [layouts, setLayouts] = useState(initialLayouts);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // New layout form state
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [layoutHoles, setLayoutHoles] = useState<LayoutHoleEntry[]>(
    holes.map((h, i) => ({
      position: i + 1,
      source_hole_id: h.id,
      par_override: null,
    })),
  );

  function addHoleToLayout() {
    const nextPos = layoutHoles.length + 1;
    setLayoutHoles((prev) => [
      ...prev,
      {
        position: nextPos,
        source_hole_id: holes[0]?.id ?? "",
        par_override: null,
      },
    ]);
  }

  function removeHoleFromLayout(pos: number) {
    setLayoutHoles((prev) =>
      prev
        .filter((h) => h.position !== pos)
        .map((h, i) => ({ ...h, position: i + 1 })),
    );
  }

  function updateLayoutHole(
    pos: number,
    field: keyof LayoutHoleEntry,
    value: any,
  ) {
    setLayoutHoles((prev) =>
      prev.map((h) => (h.position === pos ? { ...h, [field]: value } : h)),
    );
  }

  function applyDoubleRound() {
    // Repeat holes 1-9 twice (positions 1-9 then 10-18)
    const doubled = [
      ...holes.map((h, i) => ({
        position: i + 1,
        source_hole_id: h.id,
        par_override: null,
      })),
      ...holes.map((h, i) => ({
        position: holes.length + i + 1,
        source_hole_id: h.id,
        par_override: null,
      })),
    ];
    setLayoutHoles(doubled);
    if (!newName) setNewName("Double Round");
  }

  async function handleCreate() {
    if (!newName || layoutHoles.length === 0) {
      setError("Layout name and at least one hole are required.");
      return;
    }
    setSaving(true);
    setError("");

    const { data: layout, error: layoutErr } = await (supabase as any)
      .from("course_layouts")
      .insert({
        course_id: courseId,
        name: newName,
        description: newDesc || null,
        hole_count: layoutHoles.length,
        is_default: layouts.length === 0,
      })
      .select()
      .single();

    if (layoutErr) {
      setError(layoutErr.message);
      setSaving(false);
      return;
    }

    const { error: holesErr } = await (supabase as any)
      .from("layout_holes")
      .insert(
        layoutHoles.map((h) => ({
          layout_id: layout.id,
          hole_number: h.position,
          source_hole_id: h.source_hole_id,
          par_override: h.par_override,
        })),
      );

    if (holesErr) {
      setError(holesErr.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setCreating(false);
    setNewName("");
    setNewDesc("");
    setLayoutHoles(
      holes.map((h, i) => ({
        position: i + 1,
        source_hole_id: h.id,
        par_override: null,
      })),
    );
    router.refresh();
  }

  async function setDefault(layoutId: string) {
    await (supabase as any)
      .from("course_layouts")
      .update({ is_default: false })
      .eq("course_id", courseId);
    await (supabase as any)
      .from("course_layouts")
      .update({ is_default: true })
      .eq("id", layoutId);
    setLayouts((prev) =>
      prev.map((l) => ({ ...l, is_default: l.id === layoutId })),
    );
  }

  async function deleteLayout(layoutId: string) {
    await (supabase as any).from("course_layouts").delete().eq("id", layoutId);
    setLayouts((prev) => prev.filter((l) => l.id !== layoutId));
  }

  const inputStyle = {
    background: "var(--bg-primary)",
    borderColor: "var(--border-colour)",
    color: "var(--text-primary)",
  };

  return (
    <div className="space-y-4">
      {/* Existing layouts */}
      {layouts.length === 0 ? (
        <p
          className="text-sm text-center py-4"
          style={{ color: "var(--text-secondary)" }}
        >
          No layouts yet. Create one below to enable layout selection when
          starting a round.
        </p>
      ) : (
        <div className="space-y-2">
          {layouts.map((layout) => (
            <div
              key={layout.id}
              className="flex items-center gap-3 p-3 rounded-xl border"
              style={{
                borderColor: "var(--border-colour)",
                background: "var(--bg-primary)",
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className="text-sm font-semibold"
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
              <div className="flex items-center gap-1">
                {!layout.is_default && (
                  <button
                    onClick={() => setDefault(layout.id)}
                    title="Set as default"
                    className="p-1.5 rounded-lg hover:bg-yellow-50 text-gray-400 hover:text-yellow-500 transition-colors"
                  >
                    <Star size={14} />
                  </button>
                )}
                <button
                  onClick={() => deleteLayout(layout.id)}
                  title="Delete layout"
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create new layout */}
      {!creating ? (
        <button
          onClick={() => setCreating(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed text-sm font-medium transition-colors hover:border-green-400 hover:text-green-500"
          style={{
            borderColor: "var(--border-colour)",
            color: "var(--text-secondary)",
          }}
        >
          <Plus size={16} /> Add Layout
        </button>
      ) : (
        <div
          className="space-y-3 p-4 rounded-xl border"
          style={{
            borderColor: "var(--border-colour)",
            background: "var(--bg-primary)",
          }}
        >
          <p
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            New Layout
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wide mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Standard 18, Double Round"
                className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                style={inputStyle}
              />
            </div>
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wide mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Description (optional)
              </label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="e.g. Play holes 1-9 twice"
                className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Quick actions */}
          {holes.length <= 9 && (
            <button
              onClick={applyDoubleRound}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 bg-blue-50 rounded-lg transition-colors"
            >
              <RefreshCw size={12} /> Auto-fill Double Round (×2)
            </button>
          )}

          {/* Hole sequence */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--text-secondary)" }}
              >
                Hole Sequence ({layoutHoles.length} holes)
              </label>
              <button
                onClick={addHoleToLayout}
                className="flex items-center gap-1 text-xs text-green-600 font-medium hover:text-green-700"
              >
                <Plus size={12} /> Add hole
              </button>
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {layoutHoles.map((lh) => {
                const sourceHole = holes.find(
                  (h) => h.id === lh.source_hole_id,
                );
                const effectivePar = lh.par_override ?? sourceHole?.par ?? 3;
                return (
                  <div key={lh.position} className="flex items-center gap-2">
                    <span
                      className="text-xs font-bold w-6 text-center flex-shrink-0"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {lh.position}
                    </span>
                    <select
                      value={lh.source_hole_id}
                      onChange={(e) =>
                        updateLayoutHole(
                          lh.position,
                          "source_hole_id",
                          e.target.value,
                        )
                      }
                      className="flex-1 px-2 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                      style={inputStyle}
                    >
                      {holes.map((h) => (
                        <option key={h.id} value={h.id}>
                          Hole {h.hole_number} (par {h.par})
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Par
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={9}
                        value={lh.par_override ?? sourceHole?.par ?? 3}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          const defaultPar = sourceHole?.par ?? 3;
                          updateLayoutHole(
                            lh.position,
                            "par_override",
                            val === defaultPar ? null : val,
                          );
                        }}
                        className="w-12 px-2 py-1.5 rounded-lg border text-xs text-center focus:outline-none focus:ring-1 focus:ring-green-500"
                        style={inputStyle}
                      />
                    </div>
                    <button
                      onClick={() => removeHoleFromLayout(lh.position)}
                      className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {error && <p className="text-red-600 text-xs">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={() => {
                setCreating(false);
                setError("");
              }}
              className="flex-1 py-2 rounded-lg border text-sm font-medium"
              style={{
                borderColor: "var(--border-colour)",
                color: "var(--text-secondary)",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving || !newName}
              className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
            >
              {saving ? "Saving..." : "Create Layout"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
