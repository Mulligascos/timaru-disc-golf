"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Tag } from "lucide-react";

interface ClaimTagProps {
  unclaimedTags: any[];
  userId: string;
}

export function ClaimTag({ unclaimedTags, userId }: ClaimTagProps) {
  const supabase = createClient();
  const router = useRouter();
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState("");

  async function handleClaim() {
    if (!selectedTag) return;
    setClaiming(true);
    setError("");

    // Assign tag to user
    const { error: tagError } = await supabase
      .from("bag_tags")
      .update({ holder_id: userId })
      .eq("id", selectedTag);

    if (tagError) {
      setError(tagError.message);
      setClaiming(false);
      return;
    }

    // Update profile
    await supabase
      .from("profiles")
      .update({ current_tag_id: selectedTag })
      .eq("id", userId);

    // Record history
    const tag = unclaimedTags.find((t) => t.id === selectedTag);
    await supabase.from("tag_history").insert({
      tag_id: selectedTag,
      from_holder_id: null,
      to_holder_id: userId,
      notes: "Initial claim",
    });

    setClaiming(false);
    router.refresh();
  }

  if (unclaimedTags.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
        <Tag size={32} className="mx-auto text-gray-300 mb-2" />
        <p className="font-semibold text-gray-600 text-sm">
          No unclaimed tags available
        </p>
        <p className="text-xs text-gray-400 mt-1">
          All tags are currently held. Challenge someone to win theirs!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
          <Tag size={20} className="text-green-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">Claim a Bag Tag</p>
          <p className="text-xs text-gray-500">Pick an available tag number</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {unclaimedTags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => setSelectedTag(tag.id)}
            className={`w-12 h-12 rounded-xl font-bold text-sm transition-all active:scale-95 ${
              selectedTag === tag.id
                ? "bg-green-500 text-white ring-2 ring-green-300"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            #{tag.tag_number}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <button
        onClick={handleClaim}
        disabled={!selectedTag || claiming}
        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {claiming
          ? "Claiming..."
          : selectedTag
            ? `Claim Tag #${unclaimedTags.find((t) => t.id === selectedTag)?.tag_number}`
            : "Select a tag first"}
      </button>
    </div>
  );
}
