"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
  Wifi,
  WifiOff,
} from "lucide-react";
import { ManageRound } from "@/components/rounds/start-casual-round";
import { TagResolution } from "@/components/bag-tags/tag-resolution";

interface Hole {
  id: string;
  source_hole_id: string;
  hole_number: number;
  par: number;
  distance_m: number | null;
}
interface Player {
  id: string;
  name: string;
  scorecardId: string;
  existingScores: Record<string, number>;
  division?: string | null;
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

// ── Scoring helpers ──
function adjustedScore(throws: number, player: Player): number {
  return player.division === "junior" ? throws - 1 : throws;
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
  adj: number | undefined,
  par: number,
  dark: boolean,
): string {
  if (adj == null) return dark ? "text-gray-700" : "text-gray-300";
  const diff = adj - par;
  if (adj === 1 || diff <= -2)
    return dark ? "text-yellow-400 font-bold" : "text-yellow-600 font-bold";
  if (diff === -1)
    return dark ? "text-green-400 font-bold" : "text-green-600 font-bold";
  if (diff === 0) return dark ? "text-gray-400" : "text-gray-500";
  if (diff === 1) return dark ? "text-orange-400" : "text-orange-500";
  return dark ? "text-red-400" : "text-red-500";
}

// ── Theme tokens ──
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

// ── localStorage helpers ──
const storageKey = (roundId: string) => `round_scores_${roundId}`;

function loadFromStorage(
  roundId: string,
): Record<string, Record<string, number>> {
  try {
    const raw = localStorage.getItem(storageKey(roundId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveToStorage(
  roundId: string,
  scores: Record<string, Record<string, number>>,
) {
  try {
    localStorage.setItem(storageKey(roundId), JSON.stringify(scores));
  } catch {
    // localStorage full or unavailable — continue silently
  }
}

function clearStorage(roundId: string) {
  try {
    localStorage.removeItem(storageKey(roundId));
  } catch {}
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

  const [dark, setDark] = useState(true);
  const [currentHoleIdx, setCurrentHoleIdx] = useState(0);
  const [isComplete, setIsComplete] = useState(initialComplete);
  const [players] = useState(initialPlayers);
  const [showCancel, setShowCancel] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState("");
  const [showTagResolution, setShowTagResolution] = useState(false);
  const [tagHolders, setTagHolders] = useState<any[]>([]);

  // ── Initialise scores: merge DB scores with any localStorage scores ──
  const [scores, setScores] = useState<Record<string, Record<string, number>>>(
    () => {
      const dbScores: Record<string, Record<string, number>> = {};
      for (const p of initialPlayers) dbScores[p.id] = { ...p.existingScores };

      // Merge with localStorage (localStorage wins for any conflicts — it's more recent)
      const stored = loadFromStorage(roundId);
      const merged = { ...dbScores };
      for (const playerId of Object.keys(stored)) {
        merged[playerId] = { ...dbScores[playerId], ...stored[playerId] };
      }
      return merged;
    },
  );

  const currentHole = holes[currentHoleIdx];
  const t = dark ? dk : lt;

  // ── Score update — localStorage only, no network ──
  function updateScore(playerId: string, holeId: string, val: number) {
    const clamped = Math.max(1, val);
    setScores((prev) => {
      const next = {
        ...prev,
        [playerId]: { ...prev[playerId], [holeId]: clamped },
      };
      saveToStorage(roundId, next); // instant localStorage save
      return next;
    });
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

  function goToHole(idx: number) {
    // Auto-fill par for unscored holes when navigating past them
    const hole = holes[currentHoleIdx];
    if (scores[players[0]?.id]?.[hole.id] == null) {
      setScores((prev) => {
        const next = { ...prev };
        for (const player of players) {
          next[player.id] = { ...next[player.id], [hole.id]: hole.par };
        }
        saveToStorage(roundId, next);
        return next;
      });
    }
    setCurrentHoleIdx(idx);
  }

  // ── Finish round — single bulk save ──
  async function finishRound() {
    setFinishing(true);
    setFinishError("");

    try {
      // 1. Bulk upsert all scores in one call
      const scoreRows: any[] = [];
      for (const player of players) {
        for (const hole of holes) {
          const throws = scores[player.id]?.[hole.id];
          if (throws != null) {
            scoreRows.push({
              scorecard_id: player.scorecardId,
              hole_id: hole.source_hole_id, // real UUID for DB
              hole_number: hole.hole_number,
              throws,
            });
          }
        }
      }

      if (scoreRows.length > 0) {
        const { error: scoresError } = await (supabase as any)
          .from("scores")
          .upsert(scoreRows, { onConflict: "scorecard_id,hole_id" });

        if (scoresError) {
          setFinishError("Failed to save scores. Please try again.");
          setFinishing(false);
          return;
        }
      }

      // 2. Update scorecard totals
      for (const player of players) {
        const rawTotal = holes.reduce(
          (sum, h) => sum + (scores[player.id]?.[h.id] ?? 0),
          0,
        );
        await (supabase as any)
          .from("scorecards")
          .update({ total_score: rawTotal })
          .eq("id", player.scorecardId);
      }

      // 3. Mark round complete
      await (supabase as any)
        .from("casual_rounds")
        .update({ is_complete: true, status: "completed" })
        .eq("id", roundId);

      // 4. Clear localStorage now that DB is updated
      clearStorage(roundId);

      // 5. Check for bag tag resolution
      const playerIds = players.map((p) => p.id);
      const { data: tagData } = await (supabase as any)
        .from("bag_tags")
        .select("id, tag_number, holder_id")
        .in("holder_id", playerIds)
        .eq("is_active", true);

      if (tagData && tagData.length >= 2) {
        const holders = tagData.map((tag: any) => {
          const player = players.find((p) => p.id === tag.holder_id)!;
          return {
            playerId: player.id,
            playerName: player.name,
            tagId: tag.id,
            tagNumber: tag.tag_number,
            score: getRunningTotal(player.id),
            playoffScore: null,
          };
        });
        setTagHolders(holders);
        setShowTagResolution(true);
      } else {
        setIsComplete(true);
      }
    } catch (err) {
      setFinishError("Something went wrong. Please try again.");
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
                      {player.division === "junior" && (
                        <span className="ml-1.5 text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-medium">
                          JNR
                        </span>
                      )}
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
          className={`flex items-center gap-1 text-sm font-medium ${t.textMuted}`}
        >
          <ChevronLeft size={16} /> Cancel
        </button>
        <div className="text-center">
          <div
            className={`flex items-center gap-1 justify-center text-xs ${t.accent}`}
          >
            <MapPin size={11} /> {courseName}
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

      {/* Local-save indicator */}
      <div
        className={`flex items-center justify-center gap-1.5 py-1 text-xs ${t.textMuted}`}
      >
        <WifiOff size={10} />
        <span>Scores saved locally · syncs on finish</span>
      </div>

      {/* Hole header */}
      <div
        className={`mx-4 mt-2 rounded-2xl p-4 ${t.card} border ${t.cardBorder}`}
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
          const rawThrows =
            scores[player.id]?.[currentHole.id] ?? currentHole.par;
          const adj = adjustedScore(rawThrows, player);
          const runningTotal = getRunningTotal(player.id);
          const isJunior = player.division === "junior";

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
                  {isJunior && (
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                      JNR
                    </span>
                  )}
                </div>
                <p className={`text-xs ${t.textSub}`}>
                  {scoreName(adj, currentHole.par)}
                </p>
              </div>
              <button
                onClick={() =>
                  updateScore(player.id, currentHole.id, rawThrows - 1)
                }
                className={`w-9 h-9 rounded-lg font-bold text-lg flex items-center justify-center active:scale-90 transition-all ${t.btnScore}`}
              >
                −
              </button>
              <div className="w-10 text-center">
                <span className={`text-3xl font-black tabular-nums ${t.text}`}>
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
                className={`w-9 h-9 rounded-lg font-bold text-lg flex items-center justify-center active:scale-90 transition-all ${t.btnScore}`}
              >
                +
              </button>
              <div className="w-10 text-right">
                <span
                  className={`text-sm font-bold tabular-nums ${runningTotalColour(runningTotal, dark)}`}
                >
                  {formatTotal(runningTotal)}
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
          <div className="flex flex-col items-end gap-1">
            {finishError && (
              <p className="text-red-400 text-xs">{finishError}</p>
            )}
            <button
              onClick={finishRound}
              disabled={!allScored || finishing}
              className="flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm bg-green-600 hover:bg-green-500 text-white disabled:opacity-40 transition-all"
            >
              <CheckCircle size={16} />
              {finishing ? "Saving..." : "Finish Round"}
            </button>
          </div>
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
                const total = getRunningTotal(player.id);
                return (
                  <tr key={player.id} className={`border-t ${t.divider}`}>
                    <td
                      className={`px-3 py-2 font-semibold whitespace-nowrap sticky left-0 truncate max-w-[80px] ${t.card} ${t.textSub}`}
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
                          className={`text-center px-1.5 py-2 cursor-pointer transition-colors ${i === currentHoleIdx ? t.activeCell : ""} ${cellStyle(adj, h.par, dark)}`}
                        >
                          {rawThrows ?? "·"}
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
              Your scores are saved on this device. You can return to this round
              later from the dashboard.
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
                  clearStorage(roundId);
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
