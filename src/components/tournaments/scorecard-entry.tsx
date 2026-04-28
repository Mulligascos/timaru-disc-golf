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
} from "lucide-react";

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
  division?: string | null; // ← added
}

interface ScorecardEntryProps {
  players: Player[];
  holes: Hole[];
  tournamentId: string;
  roundId: string;
  roundNumber: number;
  courseName: string;
}

// Junior players get -1 from their actual throws when calculating score vs par
function adjustedScore(throws: number, player: Player): number {
  return player.division === "junior" ? throws - 1 : throws;
}

function scoreName(throws: number, par: number): string {
  const diff = throws - par;
  if (throws === 1) return "ACE";
  if (diff <= -3) return "Albatross";
  if (diff === -2) return "Eagle";
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
  adjustedThrows: number | undefined,
  par: number,
  dark: boolean,
): string {
  if (adjustedThrows == null) return dark ? "text-gray-600" : "text-gray-300";
  const diff = adjustedThrows - par;
  if (adjustedThrows === 1 || diff <= -2)
    return dark ? "text-yellow-400 font-bold" : "text-yellow-600 font-bold";
  if (diff === -1)
    return dark ? "text-green-400 font-bold" : "text-green-600 font-bold";
  if (diff === 0) return dark ? "text-gray-300" : "text-gray-500";
  if (diff === 1) return dark ? "text-orange-400" : "text-orange-500";
  return dark ? "text-red-400" : "text-red-500";
}

export function ScorecardEntry({
  players,
  holes,
  tournamentId,
  roundId,
  roundNumber,
  courseName,
}: ScorecardEntryProps) {
  const supabase = createClient();
  const router = useRouter();
  const saveTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const [dark, setDark] = useState(true);
  const [currentHoleIdx, setCurrentHoleIdx] = useState(0);
  const [scores, setScores] = useState<Record<string, Record<string, number>>>(
    () => {
      const init: Record<string, Record<string, number>> = {};
      for (const p of players) init[p.id] = { ...p.existingScores };
      return init;
    },
  );
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

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
    const player = players.find((p) => p.id === playerId)!;
    return holes.reduce((total, hole) => {
      const rawThrows = scores[playerId]?.[hole.id];
      if (rawThrows == null) return total;
      return total + (adjustedScore(rawThrows, player) - hole.par);
    }, 0);
  }

  function getOrderedPlayers(): Player[] {
    if (currentHoleIdx === 0) return players;
    const prevHole = holes[currentHoleIdx - 1];
    return [...players].sort((a, b) => {
      const aAdj = adjustedScore(
        scores[a.id]?.[prevHole.id] ?? prevHole.par,
        a,
      );
      const bAdj = adjustedScore(
        scores[b.id]?.[prevHole.id] ?? prevHole.par,
        b,
      );
      return aAdj - bAdj;
    });
  }

  async function submitRound() {
    setSubmitting(true);
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
    router.push(`/tournaments/${tournamentId}`);
    setSubmitting(false);
  }

  const allScored = players.every((p) =>
    holes.every((h) => scores[p.id]?.[h.id] != null),
  );

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
          <ChevronLeft size={16} /> Back
        </button>
        <div className="text-center">
          <p
            className={`text-xs font-medium ${d ? "text-green-400" : "text-green-600"}`}
          >
            Round {roundNumber}
          </p>
          <p
            className={`text-sm font-bold ${d ? "text-white" : "text-gray-900"}`}
          >
            {courseName}
          </p>
        </div>
        <button
          onClick={() => setDark((v) => !v)}
          className={`p-2 rounded-lg ${d ? "bg-white/10 text-gray-300 hover:bg-white/20" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
        >
          {d ? <Sun size={16} /> : <Moon size={16} />}
        </button>
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
          const rawThrows =
            scores[player.id]?.[currentHole.id] ?? currentHole.par;
          const adj = adjustedScore(rawThrows, player);
          const runningTotal = getRunningTotal(player.id);
          const key = `${player.id}-${currentHole.id}`;
          const isJunior = player.division === "junior";

          return (
            <div
              key={player.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl ${d ? "bg-[#1a3d28]" : "bg-white border border-gray-200"}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {currentHoleIdx > 0 && (
                    <span
                      className={`text-xs font-bold w-4 flex-shrink-0 ${playerIdx === 0 ? (d ? "text-yellow-400" : "text-yellow-600") : d ? "text-gray-500" : "text-gray-400"}`}
                    >
                      {playerIdx + 1}
                    </span>
                  )}
                  <p
                    className={`font-bold text-sm truncate ${d ? "text-white" : "text-gray-900"}`}
                  >
                    {player.name}
                  </p>
                  {isJunior && (
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                      JNR
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs ${d ? "text-gray-400" : "text-gray-400"}`}
                >
                  {scoreName(adj, currentHole.par)}
                </p>
              </div>
              <button
                onClick={() =>
                  updateScore(player.id, currentHole.id, rawThrows - 1)
                }
                className={`w-9 h-9 rounded-lg font-bold text-lg flex items-center justify-center transition-all active:scale-90 ${d ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
              >
                −
              </button>
              <div className="w-10 text-center">
                <span
                  className={`text-3xl font-black tabular-nums ${d ? "text-white" : "text-gray-900"}`}
                >
                  {rawThrows}
                </span>
                {isJunior && (
                  <p className="text-blue-400 text-[9px] leading-none mt-0.5">
                    {adj} adj
                  </p>
                )}
              </div>
              <button
                onClick={() =>
                  updateScore(player.id, currentHole.id, rawThrows + 1)
                }
                className={`w-9 h-9 rounded-lg font-bold text-lg flex items-center justify-center transition-all active:scale-90 ${d ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
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
          className={`flex items-center gap-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-30 ${d ? "bg-[#1a3d28] text-white hover:bg-[#254d35]" : "bg-white border border-gray-200 text-gray-700"}`}
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
            onClick={submitRound}
            disabled={!allScored || submitting}
            className="flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm bg-green-600 hover:bg-green-500 text-white disabled:opacity-40 transition-all"
          >
            <CheckCircle size={16} />
            {submitting ? "Saving..." : "Finish Round"}
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
                const total = getRunningTotal(player.id);
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
                      {player.division === "junior" && (
                        <span className="ml-1 text-blue-400 text-[9px]">
                          JNR
                        </span>
                      )}
                    </td>
                    {holes.map((h, i) => {
                      const rawThrows = scores[player.id]?.[h.id];
                      const adj =
                        rawThrows != null
                          ? adjustedScore(rawThrows, player)
                          : undefined;
                      return (
                        <td
                          key={h.id}
                          onClick={() => goToHole(i)}
                          className={`text-center px-1.5 py-2 cursor-pointer transition-colors ${i === currentHoleIdx ? (d ? "bg-green-900/40" : "bg-green-50") : ""} ${cellStyle(adj, h.par, dark)}`}
                        >
                          {rawThrows ?? "·"}
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

        {/* Cancel modal */}
        {showCancel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setShowCancel(false)}
            />
            <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
              <h2 className="font-bold text-gray-900 text-lg">
                Leave Scoring?
              </h2>
              <p className="text-gray-500 text-sm">
                Your scores have been saved. You can return to this round later.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancel(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 font-semibold text-sm text-gray-700 hover:bg-gray-50"
                >
                  Keep Scoring
                </button>
                <button
                  onClick={() => router.push(`/tournaments/${tournamentId}`)}
                  className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 font-semibold text-sm text-white"
                >
                  Leave
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
