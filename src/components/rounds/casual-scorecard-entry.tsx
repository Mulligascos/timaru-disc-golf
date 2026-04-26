"use client";

import { useState, useCallback, useRef } from "react";
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
  if (total === 0) return dark ? "text-gray-400" : "text-gray-500";
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
  if (throws == null) return dark ? "text-gray-700" : "text-gray-300";
  const diff = throws - par;
  if (throws === 1 || diff <= -2)
    return dark ? "text-yellow-400 font-bold" : "text-yellow-600 font-bold";
  if (diff === -1)
    return dark ? "text-green-400 font-bold" : "text-green-600 font-bold";
  if (diff === 0) return dark ? "text-gray-400" : "text-gray-500";
  if (diff === 1) return dark ? "text-orange-400" : "text-orange-500";
  return dark ? "text-red-400" : "text-red-500";
}

// Dark mode colour tokens — true black theme for night use
const dk = {
  bg: "bg-black",
  card: "bg-[#111111]",
  cardBorder: "border-[#222222]",
  divider: "border-[#222222]",
  text: "text-white",
  textMuted: "text-gray-500",
  textSub: "text-gray-400",
  accent: "text-green-400",
  btnScore: "bg-[#222222] text-white hover:bg-[#2e2e2e]",
  activeCell: "bg-[#1a2a1a]",
  highlightText: "text-green-400",
};

const lt = {
  bg: "bg-gray-100",
  card: "bg-white",
  cardBorder: "border-gray-200",
  divider: "border-gray-100",
  text: "text-gray-900",
  textMuted: "text-gray-500",
  textSub: "text-gray-400",
  accent: "text-green-600",
  btnScore: "bg-gray-200 text-gray-700 hover:bg-gray-300",
  activeCell: "bg-green-50",
  highlightText: "text-green-600",
};

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
  const t = dark ? dk : lt;

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
          await (supabase as any)
            .from("scores")
            .upsert({
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

    const playerIds = players.map((p) => p.id);
    const { data: tagData } = await (supabase as any)
      .from("bag_tags")
      .select("id, tag_number, holder_id")
      .in("holder_id", playerIds)
      .eq("is_active", true);

    if (tagData && tagData.length >= 2) {
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
      <div className={`min-h-screen ${t.bg}`}>
        <div className="px-4 py-6 space-y-4">
          <div className={`rounded-2xl p-5 ${t.card} border ${t.cardBorder}`}>
            <p
              className={`text-xs font-semibold uppercase tracking-wide mb-1 ${t.accent}`}
            >
              Round Complete ✓
            </p>
            <p className={`text-xl font-bold ${t.text}`}>{courseName}</p>
            <p className={`text-sm mt-1 ${t.textMuted}`}>
              {new Date(roundDate).toLocaleDateString("en-NZ", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {startingHole > 1 && ` · Started hole ${startingHole}`}
            </p>
          </div>
          <div
            className={`rounded-2xl overflow-hidden ${t.card} border ${t.cardBorder}`}
          >
            <div className={`px-4 py-3 border-b ${t.divider}`}>
              <p
                className={`text-xs font-semibold uppercase tracking-wide ${t.textMuted}`}
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
                    className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? `border-t ${t.divider}` : ""}`}
                  >
                    <span className={`text-sm font-bold w-6 ${t.textMuted}`}>
                      {i + 1}
                    </span>
                    <span className={`flex-1 font-semibold text-sm ${t.text}`}>
                      {player.name}
                    </span>
                    <span
                      className={`font-bold text-lg tabular-nums ${runningTotalColour(total, dark)}`}
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
    <div className={`min-h-screen flex flex-col ${t.bg}`}>
      {/* Top bar */}
      <div
        className={`flex items-center justify-between px-4 py-3 ${t.card} border-b ${t.divider}`}
      >
        <button
          onClick={() => setShowCancel(true)}
          className={`flex items-center gap-1 text-sm font-medium ${t.textMuted} hover:${t.text}`}
        >
          <ChevronLeft size={16} /> Cancel
        </button>
        <div className="text-center">
          <div
            className={`flex items-center gap-1 justify-center text-xs ${t.accent}`}
          >
            <MapPin size={11} /> {courseName}
            {startingHole > 1 && (
              <span className="ml-1 text-orange-400">
                · From hole {startingHole}
              </span>
            )}
          </div>
          <div
            className={`flex items-center gap-1 justify-center text-xs mt-0.5 ${t.textSub}`}
          >
            <Calendar size={11} />
            {new Date(roundDate).toLocaleDateString("en-NZ", {
              day: "numeric",
              month: "short",
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ManageRound
            roundId={roundId}
            members={allMembers}
            currentPlayerIds={currentPlayerIds}
            courseName={courseName}
          />
          <button
            onClick={() => setDark((v) => !v)}
            className={`p-2 rounded-lg ${dark ? "bg-white/10 text-gray-300 hover:bg-white/20" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>

      {/* Hole header */}
      <div
        className={`mx-4 mt-3 rounded-2xl p-4 ${t.card} border ${t.cardBorder}`}
      >
        <div className="flex items-center justify-between">
          <h2 className={`text-2xl font-black ${t.accent}`}>
            Hole {currentHole.hole_number}
          </h2>
          <div className="text-right">
            <p className={`text-sm font-semibold ${t.text}`}>
              Par {currentHole.par}
            </p>
            {currentHole.distance_m && (
              <p className={`text-xs ${t.textSub}`}>
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl ${t.card} border ${t.cardBorder}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {currentHoleIdx > 0 && (
                    <span
                      className={`text-xs font-bold w-4 flex-shrink-0 ${playerIdx === 0 ? (dark ? "text-yellow-400" : "text-yellow-600") : t.textMuted}`}
                    >
                      {playerIdx + 1}
                    </span>
                  )}
                  <p className={`font-bold text-sm truncate ${t.text}`}>
                    {player.name}
                  </p>
                </div>
                <p className={`text-xs ${t.textSub}`}>
                  {scoreName(throws, currentHole.par)}
                </p>
              </div>
              <button
                onClick={() =>
                  updateScore(player.id, currentHole.id, throws - 1)
                }
                className={`w-9 h-9 rounded-lg font-bold text-lg flex items-center justify-center active:scale-90 transition-all ${t.btnScore}`}
              >
                −
              </button>
              <div className="w-10 text-center">
                <span className={`text-3xl font-black tabular-nums ${t.text}`}>
                  {throws}
                </span>
              </div>
              <button
                onClick={() =>
                  updateScore(player.id, currentHole.id, throws + 1)
                }
                className={`w-9 h-9 rounded-lg font-bold text-lg flex items-center justify-center active:scale-90 transition-all ${t.btnScore}`}
              >
                +
              </button>
              <div className="w-10 text-right">
                <span
                  className={`text-sm font-bold tabular-nums ${runningTotalColour(runningTotal, dark)}`}
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
          className={`flex items-center gap-1 px-4 py-3 rounded-xl font-semibold text-sm disabled:opacity-30 transition-all ${t.card} border ${t.cardBorder} ${t.text}`}
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
        className={`mx-4 mt-4 mb-6 rounded-2xl overflow-hidden ${t.card} border ${t.cardBorder}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className={`border-b ${t.divider}`}>
                <td
                  className={`px-3 py-2 font-semibold sticky left-0 ${t.card} ${t.textMuted}`}
                >
                  Player
                </td>
                {holes.map((h, i) => (
                  <td
                    key={h.id}
                    onClick={() => goToHole(i)}
                    className={`text-center px-1.5 py-2 font-semibold cursor-pointer min-w-[22px] transition-colors ${
                      i === currentHoleIdx
                        ? `${t.highlightText} ${t.activeCell}`
                        : t.textMuted
                    }`}
                  >
                    {h.hole_number}
                  </td>
                ))}
                <td className={`text-center px-2 py-2 font-bold ${t.textSub}`}>
                  Tot
                </td>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => {
                const total = holes.reduce((sum, h) => {
                  const throws = scores[player.id]?.[h.id];
                  return sum + (throws != null ? throws - h.par : 0);
                }, 0);
                return (
                  <tr key={player.id} className={`border-t ${t.divider}`}>
                    <td
                      className={`px-3 py-2 font-semibold whitespace-nowrap sticky left-0 truncate max-w-[80px] ${t.card} ${t.textSub}`}
                    >
                      {player.name.split(" ")[0]}
                    </td>
                    {holes.map((h, i) => {
                      const throws = scores[player.id]?.[h.id];
                      return (
                        <td
                          key={h.id}
                          onClick={() => goToHole(i)}
                          className={`text-center px-1.5 py-2 cursor-pointer transition-colors ${i === currentHoleIdx ? t.activeCell : ""} ${cellStyle(throws, h.par, dark)}`}
                        >
                          {throws ?? "·"}
                        </td>
                      );
                    })}
                    <td
                      className={`text-center px-2 py-2 font-bold ${runningTotalColour(total, dark)}`}
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
          <div
            className={`relative rounded-2xl w-full max-w-sm p-6 space-y-4 ${t.card}`}
          >
            <h2 className={`font-bold text-lg ${t.text}`}>Cancel Round?</h2>
            <p className={`text-sm ${t.textMuted}`}>
              Any scores entered so far have been saved. You can return to this
              round later from the dashboard.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancel(false)}
                className={`flex-1 py-3 rounded-xl border font-semibold text-sm transition-colors ${t.cardBorder} ${t.text}`}
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
