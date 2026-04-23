"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

interface Hole {
  id: string;
  hole_number: number;
  par: number;
  distance_m: number | null;
}

interface HoleEditorProps {
  courseId: string;
  holes: Hole[];
  holeCount: number;
}

export function HoleEditor({ courseId, holes, holeCount }: HoleEditorProps) {
  const supabase = createClient();
  const router = useRouter();
  const [localHoles, setLocalHoles] = useState<Hole[]>(
    holes.sort((a, b) => a.hole_number - b.hole_number),
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function updateHole(id: string, field: "par" | "distance_m", value: number) {
    setLocalHoles((prev) =>
      prev.map((h) => (h.id === id ? { ...h, [field]: value } : h)),
    );
    setSaved(false);
  }

  async function saveAll() {
    setSaving(true);
    for (const hole of localHoles) {
      await (supabase as any)
        .from("holes")
        .update({ par: hole.par, distance_m: hole.distance_m })
        .eq("id", hole.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Hole Details
        </p>
        <button
          onClick={saveAll}
          disabled={saving}
          className="flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          <Save size={13} />
          {saving ? "Saving..." : saved ? "Saved ✓" : "Save Changes"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-400 pb-2 pr-3">
                Hole
              </th>
              <th className="text-left text-xs font-semibold text-gray-400 pb-2 pr-3">
                Par
              </th>
              <th className="text-left text-xs font-semibold text-gray-400 pb-2">
                Distance (m)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {localHoles.map((hole) => (
              <tr key={hole.id}>
                <td className="py-1.5 pr-3 font-semibold text-gray-700 text-sm">
                  {hole.hole_number}
                </td>
                <td className="py-1.5 pr-3">
                  <select
                    value={hole.par}
                    onChange={(e) =>
                      updateHole(hole.id, "par", parseInt(e.target.value))
                    }
                    className="px-2 py-1 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white w-16"
                  >
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                  </select>
                </td>
                <td className="py-1.5">
                  <input
                    type="number"
                    value={hole.distance_m ?? ""}
                    min={0}
                    max={500}
                    onChange={(e) =>
                      updateHole(
                        hole.id,
                        "distance_m",
                        parseInt(e.target.value) || 0,
                      )
                    }
                    placeholder="—"
                    className="px-2 py-1 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-20"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
