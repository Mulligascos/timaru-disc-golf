"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Play,
  X,
  Plus,
  Minus,
  ChevronRight,
  Check,
  AlertTriangle,
  Trophy,
} from "lucide-react";

interface StartRoundButtonProps {
  userId: string;
  members: any[];
  courses: any[];
  tags: any[];
}

type Step =
  | "select_players"
  | "enter_scores"
  | "resolve_ties"
  | "confirm_swaps";

interface PlayerEntry {
  memberId: string;
  name: string;
  tagId: string | null;
  tagNumber: number | null;
  score: number;
  playoffScore: number | null;
}

export function StartRoundButton({
  userId,
  members,
  courses,
  tags,
}: StartRoundButtonProps) {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("select_players");
  const [selectedIds, setSelectedIds] = useState<string[]>([userId]);
  const [courseId, setCourseId] = useState("");
  const [players, setPlayers] = useState<PlayerEntry[]>([]);
  const [tiedPlayers, setTiedPlayers] = useState<PlayerEntry[][]>([]);
  const [newTagOrder, setNewTagOrder] = useState<
    { player: PlayerEntry; newTag: any }[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleMember(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function buildPlayers() {
    return selectedIds.map((id) => {
      const m = members.find((m) => m.id === id);
      const tag = tags.find((t) => t.holder_id === id);
      return {
        memberId: id,
        name: m?.full_name ?? m?.username ?? "Unknown",
        tagId: tag?.id ?? null,
        tagNumber: tag?.tag_number ?? null,
        score: 0,
        playoffScore: null,
      };
    });
  }

  function goToScores() {
    if (selectedIds.length < 2) {
      setError("Select at least 2 players.");
      return;
    }
    setError("");
    setPlayers(buildPlayers());
    setStep("enter_scores");
  }

  function updateScore(memberId: string, val: number) {
    setPlayers((prev) =>
      prev.map((p) =>
        p.memberId === memberId ? { ...p, score: Math.max(1, val) } : p,
      ),
    );
  }

  function updatePlayoffScore(memberId: string, val: number) {
    setPlayers((prev) =>
      prev.map((p) =>
        p.memberId === memberId ? { ...p, playoffScore: Math.max(1, val) } : p,
      ),
    );
  }

  function calculateNewOrder(): { player: PlayerEntry; newTag: any }[] {
    // Only players with tags compete for tag redistribution
    const tagHolders = players.filter((p) => p.tagNumber !== null);
    if (tagHolders.length === 0) return [];

    // Sort tag holders by score (ascending = best)
    // Use playoff score to break ties if available
    const sorted = [...tagHolders].sort((a, b) => {
      const scoreDiff = a.score - b.score;
      if (scoreDiff !== 0) return scoreDiff;
      // Tie-break using playoff score
      if (a.playoffScore !== null && b.playoffScore !== null) {
        return a.playoffScore - b.playoffScore;
      }
      return 0;
    });

    // Get available tags sorted ascending
    const availableTags = tags
      .filter((t) => tagHolders.some((p) => p.tagId === t.id))
      .sort((a, b) => a.tag_number - b.tag_number);

    return sorted.map((player, i) => ({
      player,
      newTag: availableTags[i],
    }));
  }

  function findTies(): PlayerEntry[][] {
    const tagHolders = players.filter((p) => p.tagNumber !== null);
    const scoreGroups: Record<number, PlayerEntry[]> = {};
    for (const p of tagHolders) {
      scoreGroups[p.score] = [...(scoreGroups[p.score] ?? []), p];
    }
    return Object.values(scoreGroups).filter((g) => g.length > 1);
  }

  function goToResolve() {
    const allScored = players.every((p) => p.score > 0);
    if (!allScored) {
      setError("Enter scores for all players.");
      return;
    }
    setError("");

    const ties = findTies();
    if (ties.length > 0) {
      setTiedPlayers(ties);
      setStep("resolve_ties");
    } else {
      const order = calculateNewOrder();
      setNewTagOrder(order);
      setStep("confirm_swaps");
    }
  }

  function goToConfirm() {
    const order = calculateNewOrder();
    setNewTagOrder(order);
    setStep("confirm_swaps");
  }

  async function confirmSwaps() {
    setSaving(true);
    setError("");

    for (const { player, newTag } of newTagOrder) {
      if (!newTag) continue;
      // Skip if tag didn't change
      if (player.tagId === newTag.id) continue;

      // Update tag holder
      await supabase
        .from("bag_tags")
        .update({ holder_id: player.memberId })
        .eq("id", newTag.id);
      await supabase
        .from("profiles")
        .update({ current_tag_id: newTag.id })
        .eq("id", player.memberId);

      // Log history
      await supabase.from("tag_history").insert({
        tag_id: newTag.id,
        from_holder_id: newTag.holder_id,
        to_holder_id: player.memberId,
        notes: `Group round result`,
      });
    }

    // Record the round as a challenge entry (using challenger_id = round starter, notes = all players)
    const playerSummary = players
      .map((p) => `${p.name}: ${p.score}`)
      .join(", ");
    await supabase.from("tag_challenges").insert({
      challenger_id: userId,
      defender_id: userId, // self-reference for group rounds
      course_id: courseId || null,
      status: "completed",
      played_on: new Date().toISOString().split("T")[0],
      tag_swapped: newTagOrder.some((o) => o.player.tagId !== o.newTag?.id),
      notes: `Group round: ${playerSummary}`,
    });

    setSaving(false);
    setOpen(false);
    resetState();
    router.refresh();
  }

  function resetState() {
    setStep("select_players");
    setSelectedIds([userId]);
    setCourseId("");
    setPlayers([]);
    setTiedPlayers([]);
    setNewTagOrder([]);
    setError("");
  }

  const tagHolderCount = selectedIds.filter((id) =>
    tags.some((t) => t.holder_id === id),
  ).length;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
      >
        <Play size={16} /> Start Round
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => {
              setOpen(false);
              resetState();
            }}
          />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="font-bold text-gray-900">
                  {step === "select_players" && "Who's playing?"}
                  {step === "enter_scores" && "Enter Scores"}
                  {step === "resolve_ties" && "Resolve Ties"}
                  {step === "confirm_swaps" && "Confirm Tag Swaps"}
                </h2>
                <div className="flex gap-1 mt-1">
                  {(
                    [
                      "select_players",
                      "enter_scores",
                      "resolve_ties",
                      "confirm_swaps",
                    ] as Step[]
                  ).map((s, i) => (
                    <div
                      key={s}
                      className={`h-1 rounded-full flex-1 transition-colors ${
                        step === s
                          ? "bg-green-500"
                          : [
                                "select_players",
                                "enter_scores",
                                "resolve_ties",
                                "confirm_swaps",
                              ].indexOf(step) > i
                            ? "bg-green-200"
                            : "bg-gray-100"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={() => {
                  setOpen(false);
                  resetState();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg ml-4"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* ── STEP 1: Select players ── */}
              {step === "select_players" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Course (optional)
                    </label>
                    <select
                      value={courseId}
                      onChange={(e) => setCourseId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    >
                      <option value="">Select course...</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Players ({selectedIds.length} selected · {tagHolderCount}{" "}
                      with tags)
                    </label>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {members.map((m) => {
                        const tag = tags.find((t) => t.holder_id === m.id);
                        const isSelected = selectedIds.includes(m.id);
                        const isMe = m.id === userId;
                        return (
                          <button
                            key={m.id}
                            onClick={() => !isMe && toggleMember(m.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                              isSelected
                                ? "border-green-400 bg-green-50"
                                : "border-gray-200 hover:border-gray-300"
                            } ${isMe ? "cursor-default" : ""}`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                                isSelected ? "bg-green-500" : "bg-gray-300"
                              }`}
                            >
                              {(m.full_name ?? m.username)
                                ?.charAt(0)
                                ?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {m.full_name ?? m.username}
                                {isMe && (
                                  <span className="text-green-600 text-xs ml-1">
                                    (you)
                                  </span>
                                )}
                              </p>
                              {tag && (
                                <p className="text-xs text-gray-500">
                                  Tag #{tag.tag_number}
                                </p>
                              )}
                            </div>
                            {isSelected && (
                              <Check
                                size={16}
                                className="text-green-500 flex-shrink-0"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {tagHolderCount < 2 && selectedIds.length >= 2 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex gap-2 text-sm text-yellow-800">
                      <AlertTriangle
                        size={16}
                        className="flex-shrink-0 mt-0.5"
                      />
                      <span>
                        Fewer than 2 tag holders selected — no tags will be
                        redistributed, but you can still record the round.
                      </span>
                    </div>
                  )}

                  {error && <p className="text-red-600 text-sm">{error}</p>}

                  <button
                    onClick={goToScores}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors"
                  >
                    Next — Enter Scores <ChevronRight size={16} />
                  </button>
                </>
              )}

              {/* ── STEP 2: Enter scores ── */}
              {step === "enter_scores" && (
                <>
                  <p className="text-sm text-gray-500">
                    Enter total throws for each player.
                  </p>
                  <div className="space-y-3">
                    {players.map((p) => (
                      <div
                        key={p.memberId}
                        className="flex items-center gap-4 bg-gray-50 rounded-xl p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {p.name}
                          </p>
                          {p.tagNumber && (
                            <p className="text-xs text-gray-500">
                              Tag #{p.tagNumber}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateScore(p.memberId, p.score - 1)}
                            className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 active:scale-95"
                          >
                            <Minus size={16} className="text-gray-600" />
                          </button>
                          <span className="w-10 text-center text-lg font-bold text-gray-900 tabular-nums">
                            {p.score || "—"}
                          </span>
                          <button
                            onClick={() => updateScore(p.memberId, p.score + 1)}
                            className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 active:scale-95"
                          >
                            <Plus size={16} className="text-gray-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {error && <p className="text-red-600 text-sm">{error}</p>}

                  <button
                    onClick={goToResolve}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </>
              )}

              {/* ── STEP 3: Resolve ties ── */}
              {step === "resolve_ties" && (
                <>
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm text-orange-800">
                    <strong>Tied scores detected!</strong> Enter playoff hole
                    scores to break the tie. Lowest score wins.
                  </div>

                  {tiedPlayers.map((group, gi) => (
                    <div key={gi}>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Tied at {group[0].score} throws
                      </p>
                      <div className="space-y-2">
                        {group.map((p) => (
                          <div
                            key={p.memberId}
                            className="flex items-center gap-4 bg-orange-50 rounded-xl p-3"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900">
                                {p.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Tag #{p.tagNumber} · Round: {p.score}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  updatePlayoffScore(
                                    p.memberId,
                                    (p.playoffScore ?? 3) - 1,
                                  )
                                }
                                className="w-9 h-9 rounded-lg bg-white border border-orange-200 flex items-center justify-center hover:bg-orange-100"
                              >
                                <Minus size={16} />
                              </button>
                              <span className="w-10 text-center text-lg font-bold tabular-nums">
                                {p.playoffScore ?? "—"}
                              </span>
                              <button
                                onClick={() =>
                                  updatePlayoffScore(
                                    p.memberId,
                                    (p.playoffScore ?? 3) + 1,
                                  )
                                }
                                className="w-9 h-9 rounded-lg bg-white border border-orange-200 flex items-center justify-center hover:bg-orange-100"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={goToConfirm}
                    className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors"
                  >
                    Calculate Result <ChevronRight size={16} />
                  </button>
                </>
              )}

              {/* ── STEP 4: Confirm swaps ── */}
              {step === "confirm_swaps" && (
                <>
                  <p className="text-sm text-gray-500">
                    Based on scores, here's the new tag order. Confirm once
                    physical tags have been swapped.
                  </p>

                  {newTagOrder.length === 0 ? (
                    <div className="text-center py-6 text-gray-400">
                      <p className="text-sm">
                        No tags to redistribute in this round.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {newTagOrder.map(({ player, newTag }, i) => {
                        const changed = player.tagId !== newTag?.id;
                        return (
                          <div
                            key={player.memberId}
                            className={`flex items-center gap-3 p-4 rounded-xl border ${
                              changed
                                ? "border-green-300 bg-green-50"
                                : "border-gray-200 bg-white"
                            }`}
                          >
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {i === 0 && (
                                <Trophy size={16} className="text-yellow-500" />
                              )}
                              <span
                                className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${
                                  i === 0
                                    ? "bg-yellow-400 text-yellow-900"
                                    : i === 1
                                      ? "bg-gray-200 text-gray-700"
                                      : i === 2
                                        ? "bg-amber-200 text-amber-800"
                                        : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                #{newTag?.tag_number}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-sm">
                                {player.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Score: {player.score}
                                {player.playoffScore != null
                                  ? ` (playoff: ${player.playoffScore})`
                                  : ""}
                              </p>
                            </div>
                            {changed && (
                              <div className="text-xs text-green-700 font-semibold flex-shrink-0">
                                #{player.tagNumber} → #{newTag?.tag_number}
                              </div>
                            )}
                            {!changed && (
                              <div className="text-xs text-gray-400 flex-shrink-0">
                                No change
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Players not in tag redistribution */}
                  {players.filter((p) => !p.tagNumber).length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 font-medium mb-1">
                        No tag held (scores recorded only):
                      </p>
                      {players
                        .filter((p) => !p.tagNumber)
                        .map((p) => (
                          <p key={p.memberId} className="text-sm text-gray-600">
                            {p.name} — {p.score}
                          </p>
                        ))}
                    </div>
                  )}

                  {error && <p className="text-red-600 text-sm">{error}</p>}

                  <button
                    onClick={confirmSwaps}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
                  >
                    <Check size={18} />
                    {saving ? "Saving..." : "Confirm — Tags Swapped ✓"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
