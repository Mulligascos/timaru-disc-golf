"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

interface AssignTagFormProps {
  unclaimedTags: { id: string; tag_number: number }[];
  members: { id: string; full_name: string | null; username: string }[];
}

export function AssignTagForm({ unclaimedTags, members }: AssignTagFormProps) {
  const supabase = createClient();
  const router = useRouter();
  const [tag_id, setTagId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleAssign() {
    if (!tag_id || !memberId) {
      setError("Select both a tag and a member.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");

    // Assign tag to member
    const { error: tagError } = await (supabase as any)
      .from("bag_tags")
      .update({ holder_id: memberId })
      .eq("id", tag_id);

    if (tagError) {
      setError(tagError.message);
      setSaving(false);
      return;
    }

    // Update profile
    await (supabase as any)
      .from("profiles")
      .update({ current_tag_id: tag_id })
      .eq("id", memberId);

    // Log history
    const tag = unclaimedTags.find((t) => t.id === tag_id);
    const member = members.find((m) => m.id === memberId);
    await (supabase as any).from("tag_history").insert({
      tag_id: tag_id,
      from_holder_id: null,
      to_holder_id: memberId,
      notes: `Assigned by admin`,
    });

    setSaving(false);
    setSuccess(
      `Tag #${tag?.tag_number} assigned to ${member?.full_name ?? member?.username}!`,
    );
    setTagId("");
    setMemberId("");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Tag Number
          </label>
          <select
            value={tag_id}
            onChange={(e) => setTagId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="">Select tag...</option>
            {unclaimedTags.map((t) => (
              <option key={t.id} value={t.id}>
                Tag #{t.tag_number}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Member
          </label>
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="">Select member...</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name ?? m.username}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm px-3 py-2 rounded-lg">
          <Check size={14} /> {success}
        </div>
      )}

      <button
        onClick={handleAssign}
        disabled={saving || !tag_id || !memberId}
        className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
      >
        {saving ? "Assigning..." : "Assign Tag"}
      </button>
    </div>
  );
}
