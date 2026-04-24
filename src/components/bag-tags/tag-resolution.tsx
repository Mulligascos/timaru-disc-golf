"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Trophy, Tag, Check, ChevronRight } from "lucide-react";

interface TagHolder {
  playerId: string;
  playerName: string;
  tagId: string;
  tagNumber: number;
  score: number;
  playoffScore: number | null;
}

interface TagResolutionProps {
  roundId: string;
  roundType: "casual" | "tournament";
  tagHolders: TagHolder[];
  onDismiss: () => void;
}

export function TagResolution({
  roundId,
  roundType,
  tagHolders,
  onDismiss,
}: TagResolutionProps) {
  const supabase = createClient();
  const router = useRouter();
  const [showPlayoff, setShowPlayoff] = useState(false);
  const [playoffScores, setPlayoffScores] = useState<Record<string, number>>(
    {},
  );
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  if (tagHolders.length < 2) return null;

  // Sort by score, use playoff to break ties
  function getSortedHolders(): TagHolder[] {
    return [...tagHolders].sort((a, b) => {
      const scoreDiff = a.score - b.score;
      if (scoreDiff !== 0) return scoreDiff;
      const aPlayoff = playoffScores[a.playerId] ?? null;
      const bPlayoff = playoffScores[b.playerId] ?? null;
      if (aPlayoff !== null && bPlayoff !== null) return aPlayoff - bPlayoff;
      return 0;
    });
  }

  // Check for ties among tag holders
  const hasTies = (() => {
    const scores = tagHolders.map((h) => h.score);
    return scores.some((s, i) => scores.indexOf(s) !== i);
  })();

  // Available tags sorted ascending
  const availableTags = [...tagHolders]
    .map((h) => ({ id: h.tagId, number: h.tagNumber }))
    .sort((a, b) => a.number - b.number);

  const sorted = getSortedHolders();
  const newOrder = sorted.map((holder, i) => ({
    holder,
    newTag: availableTags[i],
    changed: holder.tagId !== availableTags[i]?.id,
  }));

  async function confirmSwaps() {
    setConfirming(true);

    for (const { holder, newTag, changed } of newOrder) {
      if (!changed || !newTag) continue;

      // Update tag holder
      await (supabase as any)
        .from("bag_tags")
        .update({ holder_id: holder.playerId })
        .eq("id", newTag.id);

      await (supabase as any)
        .from("profiles")
        .update({ current_tag_id: newTag.id })
        .eq("id", holder.playerId);

      // Log history
      const oldHolder = tagHolders.find((h) => h.tagId === newTag.id);
      await (supabase as any).from("tag_history").insert({
        tag_id: newTag.id,
        from_holder_id: oldHolder?.playerId ?? null,
        to_holder_id: holder.playerId,
        notes: `${roundType === "casual" ? "Casual" : "Tournament"} round`,
      });
    }

    // Mark round tags as resolved
    if (roundType === "casual") {
      await (supabase as any)
        .from("casual_rounds")
        .update({ tags_resolved: true })
        .eq("id", roundId);
    }

    setConfirming(false);
    setConfirmed(true);
    router.refresh();
  }

  if (confirmed) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
        <p className="text-2xl mb-2">🏷️</p>
        <p className="font-bold text-green-700">Tags Updated!</p>
        <p className="text-sm text-green-600 mt-1">
          Tag swaps have been recorded.
        </p>
        <button
          onClick={onDismiss}
          className="mt-3 text-xs text-green-600 font-medium underline"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-orange-200 overflow-hidden">
      {/* Header */}
      <div className="bg-orange-500 px-5 py-4">
        <div className="flex items-center gap-2">
          <Tag size={18} className="text-white" />
          <p className="font-bold text-white">Bag Tag Results</p>
        </div>
        <p className="text-orange-100 text-xs mt-1">
          {tagHolders.length} tag holders played this round
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Tie resolution */}
        {hasTies && !showPlayoff && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
            <p className="text-sm font-semibold text-yellow-800">
              ⚔️ Tied scores detected!
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Enter playoff scores to determine tag order.
            </p>
            <button
              onClick={() => setShowPlayoff(true)}
              className="mt-2 text-xs font-semibold text-yellow-700 bg-yellow-100 hover:bg-yellow-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              Enter Playoff Scores
            </button>
          </div>
        )}

        {showPlayoff && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Playoff Hole Scores
            </p>
            {tagHolders
              .filter((h) => {
                const tiedScore = h.score;
                return (
                  tagHolders.filter((x) => x.score === tiedScore).length > 1
                );
              })
              .map((h) => (
                <div
                  key={h.playerId}
                  className="flex items-center gap-3 bg-yellow-50 rounded-xl p-3"
                >
                  <p className="flex-1 text-sm font-medium text-gray-900">
                    {h.playerName}
                  </p>
                  <p className="text-xs text-gray-500">Round: {h.score}</p>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={playoffScores[h.playerId] ?? ""}
                    onChange={(e) =>
                      setPlayoffScores((prev) => ({
                        ...prev,
                        [h.playerId]: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-16 px-2 py-1 rounded-lg border border-yellow-300 text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="—"
                  />
                </div>
              ))}
            <button
              onClick={() => setShowPlayoff(false)}
              className="text-xs text-gray-500 underline"
            >
              Done
            </button>
          </div>
        )}

        {/* New tag order */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            New Tag Order
          </p>
          <div className="space-y-2">
            {newOrder.map(({ holder, newTag, changed }, i) => (
              <div
                key={holder.playerId}
                className={`flex items-center gap-3 p-3 rounded-xl border ${changed ? "border-green-300 bg-green-50" : "border-gray-200"}`}
              >
                <div className="flex items-center gap-1 flex-shrink-0">
                  {i === 0 && <Trophy size={14} className="text-yellow-500" />}
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm ${
                      i === 0
                        ? "bg-yellow-400 text-yellow-900"
                        : i === 1
                          ? "bg-gray-200 text-gray-700"
                          : i === 2
                            ? "bg-amber-200 text-amber-800"
                            : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    #{newTag?.number}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">
                    {holder.playerName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Score: {holder.score}
                    {holder.playoffScore != null &&
                      ` (playoff: ${holder.playoffScore})`}
                  </p>
                </div>
                {changed ? (
                  <span className="text-xs font-semibold text-green-700 flex-shrink-0">
                    #{holder.tagNumber} → #{newTag?.number}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    No change
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {newOrder.every((o) => !o.changed) ? (
          <div className="text-center py-2">
            <p className="text-sm text-gray-500">
              No tag changes this round — same order as before.
            </p>
            <button
              onClick={onDismiss}
              className="mt-2 text-xs text-gray-400 underline"
            >
              Dismiss
            </button>
          </div>
        ) : (
          <button
            onClick={confirmSwaps}
            disabled={confirming}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            <Check size={16} />
            {confirming ? "Saving..." : "Confirm Tag Swaps ✓"}
          </button>
        )}
      </div>
    </div>
  );
}
