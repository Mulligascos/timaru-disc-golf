"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function CourseForm() {
  const supabase = createClient();
  const router = useRouter();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [holeCount, setHoleCount] = useState(18);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Course name is required.");
      return;
    }
    setSaving(true);
    setError("");

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .insert({
        name: name.trim(),
        city: city || null,
        hole_count: holeCount,
        is_active: true,
      } as any)
      .select()
      .single();

    if (courseError || !course) {
      setError(courseError?.message ?? "Failed");
      setSaving(false);
      return;
    }

    // Create default holes
    const holes = Array.from({ length: holeCount }, (_, i) => ({
      course_id: (course as any).id,
      hole_number: i + 1,
      par: 3,
    }));
    await (supabase as any).from("holes").insert(holes);

    setName("");
    setCity("");
    setHoleCount(18);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Course Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Centennial Park"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            City
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Timaru"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Holes
          </label>
          <input
            type="number"
            value={holeCount}
            onChange={(e) => setHoleCount(parseInt(e.target.value))}
            min={9}
            max={27}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
      >
        {saving ? "Creating..." : "Add Course"}
      </button>
    </div>
  );
}
