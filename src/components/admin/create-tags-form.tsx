"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function CreateTagsForm({ currentMax }: { currentMax: number }) {
  const supabase = createClient();
  const router = useRouter();
  const [count, setCount] = useState(10);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    setSaving(true);
    setError("");
    const season = new Date().getFullYear().toString(); // ← add this
    const tags = Array.from({ length: count }, (_, i) => ({
      tag_number: currentMax + i + 1,
      season, // ← add this
      is_active: true,
    }));
    const { error } = await (supabase as any).from("bag_tags").insert(tags);
    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        Currently {currentMax} tags exist (#{1} to #{currentMax}). Create more
        below.
      </p>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            How many to create?
          </label>
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value))}
            min={1}
            max={100}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Will create
          </label>
          <p className="px-3 py-2.5 text-sm text-gray-600 font-medium">
            #{currentMax + 1} to #{currentMax + count}
          </p>
        </div>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        onClick={handleCreate}
        disabled={saving}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
      >
        {saving ? "Creating..." : `Create ${count} Tags`}
      </button>
    </div>
  );
}
