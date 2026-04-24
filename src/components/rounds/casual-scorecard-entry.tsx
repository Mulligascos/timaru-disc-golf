"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Sun,
  Moon,
  Calendar,
  MapPin,
} from "lucide-react";
import { ManageRound } from "@/components/rounds/start-casual-round";
import { TagResolution } from "@/components/bag-tags/tag-resolution";

interface Hole {
  id: string;
  hole_number: number;
  par: number;
  distance_m: number | null;
}

interface Player {
  id: string;
  name: string;
  scorecardId: string;
  existingScores: Record<string, number>;
}

interface CasualScorecardEntryProps {
  players: Player[];
  holes: Hole[];
  roundId: string;
  roundDate: string;
  courseName: string;
  notes: string | null;
  isComplete: boolean;
  startingHole: number;
  allMembers: any[];
  currentPlayerIds: string[];
}

function scoreName(throws: number, par: number): string {
  const diff = throws - par;
  if (throws === 1) return "ACE";
  if (diff <= -2) return "Eagle";
  if (diff === -1) return "Birdie";
  if (diff === 0) return "Par";
  if (diff === 1) return "Bogey";
  if (diff === 2) return "Double";
  return `+${diff}`;
}

function runningTotalColour(total: number, dark: boolean): string {
  if (total < 0) return dark ? "text-green-400" : "text-green-600";
  if (total === 0) return dark ? "text-gray-300" : "text-gray-500";
  return dark ? "text-red-400" : "text-red-500";
}

function formatTotal(total: number): string {
  if (total === 0) return "E";
  return total > 0 ? `+${total}` : `${total}`;
}

function cellStyle(
  throws: number | undefined,
  par: number,
  dark: boolean,
): string {
  if (throws == null) return dark ? "text-gray-600" : "text-gray-300";
  const diff = throws - par;
  if (throws === 1 || diff <= -2)
    return dark ? "text-yellow-400 font-bold" : "text-yellow-600 font-bold";
  if (diff === -1)
    return dark ? "text-green-400 font-bold" : "text-green-600 font-bold";
  if (diff === 0) return dark ? "text-gray-300" : "text-gray-500";
  if (diff === 1) return dark ? "text-orange-400" : "text-orange-500";
  return dark ? "text-red-400" : "text-red-500";
}

export function CasualScorecardEntry({
  players: initialPlayers,
  holes,
  roundId,
  roundDate,
  courseName,
  notes,
  isComplete: initialComplete,
  startingHole,
  allMembers,
  currentPlayerIds,
}: CasualScorecardEntryProps) {
  const supabase = createClient();
  const router = useRouter();
  const saveTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const [dark, setDark] = useState(true);
  const [currentHoleIdx, setCurrentHoleIdx] = useState(0);
  const [isComplete, setIsComplete] = useState(initialComplete);
  const [players] = useState(initialPlayers);
  const [showCancel, setShowCancel] = useState(false);
  const [scores, setScores] = useState<Record<string, Record<string, number>>>(
    () => {
      const init: Record<string, Record<string, number>> = {};
      for (const p of initialPlayers) init[p.id] = { ...p.existingScores };
      return init;
    },
  );
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [finishing, setFinishing] = useState(false);
  const [showTagResolution, setShowTagResolution] = useState(false);
  const [tagHolders, setTagHolders] = useState<any[]>([]);

  const currentHole = holes[currentHoleIdx];
  const d = dark;

  const saveScore = useCallback(
    async (
      playerId: string,
      holeId: string,
      throws: number,
      scorecardId: string,
    ) => {
      const key = `${playerId}-${holeId}`;
      if (saveTimers.current[key]) clearTimeout(saveTimers.current[key]);
      saveTimers.current[key] = setTimeout(async () => {
        setSaving((prev) => ({ ...prev, [key]: true }));
        const player = players.find((p) => p.id === playerId)!;
        const hole = holes.find((h) => h.id === holeId)!;
        const existing = player.existingScores[holeId];
        if (existing != null) {
          await (supabase as any)
            .from("scores")
            .update({ throws })
            .eq("scorecard_id", scorecardId)
            .eq("hole_id", holeId);
        } else {
          await (supabase as any).from("scores").upsert({
            scorecard_id: scorecardId,
            hole_id: holeId,
            hole_number: hole.hole_number,
            throws,
          });
          player.existingScores[holeId] = throws;
        }
        setSaving((prev) => ({ ...prev, [key]: false }));
      }, 600);
    },
    [players, holes, supabase],
  );

  useEffect(() => {
    for (const player of players) {
      const hole = holes[0];
      if (scores[player.id]?.[hole.id] == null) {
        setScores((prev) => ({
          ...prev,
          [player.id]: { ...prev[player.id], [hole.id]: hole.par },
        }));
        saveScore(player.id, hole.id, hole.par, player.scorecardId);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function goToHole(idx: number) {
    const hole = holes[currentHoleIdx];
    if (scores[players[0]?.id]?.[hole.id] == null) {
      for (const player of players) {
        setScores((prev) => ({
          ...prev,
          [player.id]: { ...prev[player.id], [hole.id]: hole.par },
        }));
        saveScore(player.id, hole.id, hole.par, player.scorecardId);
      }
    }
    setCurrentHoleIdx(idx);
  }

  function updateScore(playerId: string, holeId: string, val: number) {
    const clamped = Math.max(1, val);
    setScores((prev) => ({
      ...prev,
      [playerId]: { ...prev[playerId], [holeId]: clamped },
    }));
    const player = players.find((p) => p.id === playerId)!;
    saveScore(playerId, holeId, clamped, player.scorecardId);
  }

  function getRunningTotal(playerId: string): number {
    return holes.reduce((total, hole) => {
      const throws = scores[playerId]?.[hole.id];
      return total + (throws != null ? throws - hole.par : 0);
    }, 0);
  }

  function getOrderedPlayers(): Player[] {
    if (currentHoleIdx === 0) return players;
    const prevHole = holes[currentHoleIdx - 1];
    return [...players].sort((a, b) => {
      const aScore = scores[a.id]?.[prevHole.id] ?? prevHole.par;
      const bScore = scores[b.id]?.[prevHole.id] ?? prevHole.par;
      return aScore - bScore;
    });
  }

  async function finishRound() {
    setFinishing(true);

    // Save all scores and totals
    for (const player of players) {
      const total = holes.reduce(
        (sum, h) => sum + (scores[player.id]?.[h.id] ?? 0),
        0,
      );
      await (supabase as any)
        .from("scorecards")
        .update({ total_score: total })
        .eq("id", player.scorecardId);
    }
    await (supabase as any)
      .from("casual_rounds")
      .update({ is_complete: true, status: "completed" })
      .eq("id", roundId);

    // Check if any players hold bag tags
    const playerIds = players.map((p) => p.id);
    const { data: tagData } = await (supabase as any)
      .from("bag_tags")
      .select("id, tag_number, holder_id")
      .in("holder_id", playerIds)
      .eq("is_active", true);

    if (tagData && tagData.length >= 2) {
      // Build tag holders with scores
      const holders = tagData.map((tag: any) => {
        const player = players.find((p) => p.id === tag.holder_id)!;
        const total = holes.reduce(
          (sum, h) => sum + (scores[player.id]?.[h.id] ?? 0),
          0,
        );
        return {
          playerId: player.id,
          playerName: player.name,
          tagId: tag.id,
          tagNumber: tag.tag_number,
          score: total,
          playoffScore: null,
        };
      });
      setTagHolders(holders);
      setShowTagResolution(true);
    } else {
      setIsComplete(true);
    }

    setFinishing(false);
  }

  const allScored = players.every((p) =>
    holes.every((h) => scores[p.id]?.[h.id] != null),
  );

  // ── Completed summary ──
  if (isComplete) {
    return (
      <div className={`min-h-screen ${d ? "bg-[#0d2818]" : "bg-gray-100"}`}>
        <div className="px-4 py-6 space-y-4">
          <div
            className={`rounded-2xl p-5 ${d ? "bg-[#1a3d28]" : "bg-white border border-gray-200"}`}
          >
            <p
              className={`text-xs font-semibold uppercase tracking-wide mb-1 ${d ? "text-green-400" : "text-green-600"}`}
            >
              Round Complete ✓
            </p>
            <p
              className={`text-xl font-bold ${d ? "text-white" : "text-gray-900"}`}
            >
              {courseName}
            </p>
            <p
              className={`text-sm mt-1 ${d ? "text-gray-400" : "text-gray-500"}`}
            >
              {new Date(roundDate).toLocaleDateString("en-NZ", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {startingHole > 1 && ` · Started hole ${startingHole}`}
            </p>
          </div>
          <div
            className={`rounded-2xl overflow-hidden ${d ? "bg-[#1a3d28]" : "bg-white border border-gray-200"}`}
          >
            <div
              className={`px-4 py-3 border-b ${d ? "border-green-900" : "border-gray-100"}`}
            >
              <p
                className={`text-xs font-semibold uppercase tracking-wide ${d ? "text-gray-400" : "text-gray-500"}`}
              >
                Final Scores
              </p>
            </div>
            {[...players]
              .sort((a, b) => getRunningTotal(a.id) - getRunningTotal(b.id))
              .map((player, i) => {
                const total = getRunningTotal(player.id);
                return (
                  <div
                    key={player.id}
                    className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? (d ? "border-t border-green-900/50" : "border-t border-gray-50") : ""}`}
                  >
                    <span
                      className={`text-sm font-bold w-6 ${d ? "text-gray-500" : "text-gray-400"}`}
                    >
                      {i + 1}
                    </span>
                    <span
                      className={`flex-1 font-semibold text-sm ${d ? "text-white" : "text-gray-900"}`}
                    >
                      {player.name}
                    </span>
                    <span
                      className={`font-bold text-lg tabular-nums ${runningTotalColour(total, d)}`}
                    >
                      {formatTotal(total)}
                    </span>
                  </div>
                );
              })}
          </div>

          {showTagResolution && tagHolders.length >= 2 && (
            <TagResolution
              roundId={roundId}
              roundType="casual"
              tagHolders={tagHolders}
              onDismiss={() => {
                setShowTagResolution(false);
                setIsComplete(true);
              }}
            />
          )}
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col ${d ? "bg-[#0d2818]" : "bg-gray-100"}`}
    >
      {/* Top bar */}
      <div
        className={`flex items-center justify-between px-4 py-3 ${d ? "bg-[#0d2818]" : "bg-white border-b border-gray-200"}`}
      >
        <button
          onClick={() => setShowCancel(true)}
          className={`flex items-center gap-1 text-sm font-medium ${d ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"}`}
        >
          <ChevronLeft size={16} /> Cancel
        </button>

        <div className="text-center">
          <div
            className={`flex items-center gap-1 justify-center text-xs ${d ? "text-green-400" : "text-green-600"}`}
          >
            <MapPin size={11} /> {courseName}
            {startingHole > 1 && (
              <span className="ml-1 text-orange-400">
                · From hole {startingHole}
              </span>
            )}
          </div>
          <div
            className={`flex items-center gap-1 justify-center text-xs mt-0.5 ${d ? "text-gray-400" : "text-gray-500"}`}
          >
            <Calendar size={11} />
            {new Date(roundDate).toLocaleDateString("en-NZ", {
              day: "numeric",
              month: "short",
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Add player button */}
          <ManageRound
            roundId={roundId}
            members={allMembers}
            currentPlayerIds={currentPlayerIds}
            courseName={courseName}
          />
          <button
            onClick={() => setDark((v) => !v)}
            className={`p-2 rounded-lg ${d ? "bg-white/10 text-gray-300 hover:bg-white/20" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
          >
            {d ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>

      {/* Hole header */}
      <div
        className={`mx-4 mt-2 rounded-2xl p-4 ${d ? "bg-[#1a3d28]" : "bg-white border border-gray-200"}`}
      >
        <div className="flex items-center justify-between">
          <h2
            className={`text-2xl font-black ${d ? "text-green-400" : "text-green-600"}`}
          >
            Hole {currentHole.hole_number}
          </h2>
          <div className="text-right">
            <p
              className={`text-sm font-semibold ${d ? "text-white" : "text-gray-900"}`}
            >
              Par {currentHole.par}
            </p>
            {currentHole.distance_m && (
              <p className={`text-xs ${d ? "text-gray-400" : "text-gray-500"}`}>
                {currentHole.distance_m}m
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Player rows */}
      <div className="mx-4 mt-3 space-y-2 flex-1">
        {getOrderedPlayers().map((player, playerIdx) => {
          const throws = scores[player.id]?.[currentHole.id] ?? currentHole.par;
          const runningTotal = getRunningTotal(player.id);
          const key = `${player.id}-${currentHole.id}`;
          return (
            <div
              key={player.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl ${d ? "bg-[#1a3d28]" : "bg-white border border-gray-200"}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {currentHoleIdx > 0 && (
                    <span
                      className={`text-xs font-bold w-4 flex-shrink-0 ${
                        playerIdx === 0
                          ? d
                            ? "text-yellow-400"
                            : "text-yellow-600"
                          : d
                            ? "text-gray-500"
                            : "text-gray-400"
                      }`}
                    >
                      {playerIdx + 1}
                    </span>
                  )}
                  <p
                    className={`font-bold text-sm truncate ${d ? "text-white" : "text-gray-900"}`}
                  >
                    {player.name}
                  </p>
                </div>
                <p
                  className={`text-xs ${d ? "text-gray-400" : "text-gray-400"}`}
                >
                  {scoreName(throws, currentHole.par)}
                </p>
              </div>
              <button
                onClick={() =>
                  updateScore(player.id, currentHole.id, throws - 1)
                }
                className={`w-9 h-9 rounded-lg font-bold text-lg flex items-center justify-center active:scale-90 transition-all ${d ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
              >
                −
              </button>
              <div className="w-10 text-center">
                <span
                  className={`text-3xl font-black tabular-nums ${d ? "text-white" : "text-gray-900"}`}
                >
                  {throws}
                </span>
              </div>
              <button
                onClick={() =>
                  updateScore(player.id, currentHole.id, throws + 1)
                }
                className={`w-9 h-9 rounded-lg font-bold text-lg flex items-center justify-center active:scale-90 transition-all ${d ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
              >
                +
              </button>
              <div className="w-10 text-right">
                <span
                  className={`text-sm font-bold tabular-nums ${runningTotalColour(runningTotal, d)}`}
                >
                  {saving[key] ? "…" : formatTotal(runningTotal)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="mx-4 mt-4 flex gap-3">
        <button
          onClick={() => goToHole(Math.max(0, currentHoleIdx - 1))}
          disabled={currentHoleIdx === 0}
          className={`flex items-center gap-1 px-4 py-3 rounded-xl font-semibold text-sm disabled:opacity-30 transition-all ${d ? "bg-[#1a3d28] text-white hover:bg-[#254d35]" : "bg-white border border-gray-200 text-gray-700"}`}
        >
          <ChevronLeft size={16} /> Prev
        </button>
        <div className="flex-1" />
        {currentHoleIdx < holes.length - 1 ? (
          <button
            onClick={() =>
              goToHole(Math.min(holes.length - 1, currentHoleIdx + 1))
            }
            className="flex items-center gap-1 px-4 py-3 rounded-xl font-semibold text-sm bg-green-600 hover:bg-green-500 text-white transition-all"
          >
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={finishRound}
            disabled={!allScored || finishing}
            className="flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm bg-green-600 hover:bg-green-500 text-white disabled:opacity-40 transition-all"
          >
            <CheckCircle size={16} />
            {finishing ? "Saving..." : "Finish Round"}
          </button>
        )}
      </div>

      {/* Mini scorecard */}
      <div
        className={`mx-4 mt-4 mb-6 rounded-2xl overflow-hidden ${d ? "bg-[#1a3d28]" : "bg-white border border-gray-200"}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr
                className={
                  d ? "border-b border-green-900" : "border-b border-gray-100"
                }
              >
                <td
                  className={`px-3 py-2 font-semibold sticky left-0 ${d ? "bg-[#1a3d28] text-gray-400" : "bg-white text-gray-400"}`}
                >
                  Player
                </td>
                {holes.map((h, i) => (
                  <td
                    key={h.id}
                    onClick={() => goToHole(i)}
                    className={`text-center px-1.5 py-2 font-semibold cursor-pointer min-w-[22px] transition-colors ${
                      i === currentHoleIdx
                        ? d
                          ? "text-green-400 bg-green-900/40"
                          : "text-green-600 bg-green-50"
                        : d
                          ? "text-gray-500 hover:text-gray-300"
                          : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {h.hole_number}
                  </td>
                ))}
                <td
                  className={`text-center px-2 py-2 font-bold ${d ? "text-gray-300" : "text-gray-600"}`}
                >
                  Tot
                </td>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => {
                const total = holes.reduce((sum, h) => {
                  const t = scores[player.id]?.[h.id];
                  return sum + (t != null ? t - h.par : 0);
                }, 0);
                return (
                  <tr
                    key={player.id}
                    className={
                      d
                        ? "border-t border-green-900/50"
                        : "border-t border-gray-50"
                    }
                  >
                    <td
                      className={`px-3 py-2 font-semibold whitespace-nowrap sticky left-0 truncate max-w-[80px] ${d ? "bg-[#1a3d28] text-gray-300" : "bg-white text-gray-700"}`}
                    >
                      {player.name.split(" ")[0]}
                    </td>
                    {holes.map((h, i) => {
                      const throws = scores[player.id]?.[h.id];
                      return (
                        <td
                          key={h.id}
                          onClick={() => goToHole(i)}
                          className={`text-center px-1.5 py-2 cursor-pointer transition-colors ${i === currentHoleIdx ? (d ? "bg-green-900/40" : "bg-green-50") : ""} ${cellStyle(throws, h.par, d)}`}
                        >
                          {throws ?? "·"}
                        </td>
                      );
                    })}
                    <td
                      className={`text-center px-2 py-2 font-bold ${runningTotalColour(total, d)}`}
                    >
                      {formatTotal(total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancel modal */}
      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowCancel(false)}
          />
          <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-bold text-gray-900 text-lg">Cancel Round?</h2>
            <p className="text-gray-500 text-sm">
              Any scores entered so far have been saved. You can return to this
              round later from the dashboard.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancel(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 font-semibold text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Keep Scoring
              </button>
              <button
                onClick={async () => {
                  await (supabase as any)
                    .from("casual_rounds")
                    .update({ status: "cancelled" })
                    .eq("id", roundId);
                  router.push("/dashboard");
                }}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 font-semibold text-sm text-white transition-colors"
              >
                Cancel Round
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
