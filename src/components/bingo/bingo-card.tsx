"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { X, Check, Zap, Lock } from "lucide-react";
import { BINGO_SQUARES } from "@/lib/bingo-squares";

interface BingoSquare {
  id: string;
  row_index: number;
  col_index: number;
  label: string;
  description: string | null;
  is_free_space: boolean;
}
interface BingoCardProps {
  squares: BingoSquare[];
  completedIds: Set<string>;
  userId: string;
  cardId: string;
  isAdmin: boolean;
  season: string | null;
}

function getSquareDef(label: string) {
  const autoKeyMatch = label.match(/^\[([^\]]+)\]/);
  if (autoKeyMatch)
    return BINGO_SQUARES.find((s) => s.autoKey === autoKeyMatch[1]) ?? null;
  return BINGO_SQUARES.find((s) => s.label === label) ?? null;
}

function cleanLabel(label: string) {
  return label.replace(/^\[[^\]]+\]\s*/, "");
}

export function BingoCard({
  squares,
  completedIds: initialCompleted,
  userId,
  cardId,
  isAdmin,
  season,
}: BingoCardProps) {
  const supabase = createClient();
  const router = useRouter();
  const [completed, setCompleted] = useState<Set<string>>(
    new Set(initialCompleted),
  );
  const [selectedSquare, setSelectedSquare] = useState<BingoSquare | null>(
    null,
  );
  const [marking, setMarking] = useState(false);

  const grid: (BingoSquare | null)[][] = Array.from({ length: 8 }, () =>
    Array(3).fill(null),
  );
  for (const sq of squares) {
    if (sq.row_index < 8 && sq.col_index < 3)
      grid[sq.row_index][sq.col_index] = sq;
  }

  async function toggleSquare(sq: BingoSquare) {
    const def = getSquareDef(sq.label);
    if (def?.autoDetect) return;
    setMarking(true);
    const isCompleted = completed.has(sq.id);
    if (isCompleted) {
      await (supabase as any)
        .from("member_bingo_progress")
        .delete()
        .eq("member_id", userId)
        .eq("square_id", sq.id);
      setCompleted((prev) => {
        const n = new Set(prev);
        n.delete(sq.id);
        return n;
      });
    } else {
      await (supabase as any)
        .from("member_bingo_progress")
        .insert({ member_id: userId, card_id: cardId, square_id: sq.id });
      setCompleted((prev) => new Set([...prev, sq.id]));
    }
    setMarking(false);
    setSelectedSquare(null);
    router.refresh();
  }

  const selectedDef = selectedSquare
    ? getSquareDef(selectedSquare.label)
    : null;
  const selectedCompleted = selectedSquare
    ? completed.has(selectedSquare.id)
    : false;
  const isAutoSquare = selectedDef?.autoDetect ?? false;

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {grid.flat().map((sq, i) => {
          if (!sq)
            return (
              <div
                key={i}
                className="aspect-square rounded-xl border border-dashed"
                style={{
                  background: "var(--bg-primary)",
                  borderColor: "var(--border-colour)",
                }}
              />
            );
          const isCompleted = completed.has(sq.id);
          const def = getSquareDef(sq.label);
          const isAuto = def?.autoDetect ?? false;
          const label = cleanLabel(sq.label);

          return (
            <button
              key={sq.id}
              onClick={() => setSelectedSquare(sq)}
              className={`relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center p-2 gap-1 transition-all active:scale-95 ${
                isCompleted
                  ? "bg-green-500 border-green-400 text-white shadow-md"
                  : "border-2"
              }`}
              style={
                !isCompleted
                  ? {
                      background: "var(--bg-card)",
                      borderColor: "var(--border-colour)",
                      color: "var(--text-primary)",
                    }
                  : undefined
              }
            >
              {isAuto && (
                <div
                  className={`absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center ${isCompleted ? "bg-green-400" : "bg-blue-100"}`}
                >
                  <Zap
                    size={9}
                    className={isCompleted ? "text-white" : "text-blue-500"}
                  />
                </div>
              )}
              {isCompleted && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Check size={18} className="text-white" strokeWidth={3} />
                  </div>
                </div>
              )}
              <span className="text-xl leading-none">{def?.icon ?? "🎯"}</span>
              <span
                className={`text-center font-semibold leading-tight ${isCompleted ? "text-white" : ""}`}
                style={{
                  fontSize: "9px",
                  color: isCompleted ? undefined : "var(--text-primary)",
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div
        className="flex items-center gap-4 text-xs"
        style={{ color: "var(--text-secondary)" }}
      >
        <span className="flex items-center gap-1">
          <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
            <Zap size={9} className="text-blue-500" />
          </div>
          Auto-detected
        </span>
        <span className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <Check size={9} className="text-white" />
          </div>
          Completed
        </span>
      </div>

      {/* Square detail modal */}
      {selectedSquare && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedSquare(null)}
          />
          <div
            className="relative rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-6"
            style={{
              background: "var(--bg-card)",
              color: "var(--text-primary)",
            }}
          >
            <button
              onClick={() => setSelectedSquare(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:opacity-70"
              style={{ color: "var(--text-secondary)" }}
            >
              <X size={18} />
            </button>
            <div className="text-center mb-5">
              <span className="text-5xl">{selectedDef?.icon ?? "🎯"}</span>
              <h2
                className="text-lg font-bold mt-3"
                style={{ color: "var(--text-primary)" }}
              >
                {cleanLabel(selectedSquare.label)}
              </h2>
              <p
                className="text-sm mt-2 leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {selectedSquare.description ??
                  selectedDef?.description ??
                  "Complete this activity to mark it off."}
              </p>
            </div>

            {isAutoSquare && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700 mb-4">
                <Zap size={16} className="flex-shrink-0" />
                <span>
                  This square is <strong>automatically detected</strong> from
                  your scoring history.
                </span>
              </div>
            )}
            {selectedCompleted && (
              <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 mb-4">
                <Check size={16} />
                <span className="font-semibold">Completed!</span>
              </div>
            )}
            {!isAutoSquare && (
              <button
                onClick={() => toggleSquare(selectedSquare)}
                disabled={marking}
                className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 ${
                  selectedCompleted
                    ? "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {marking
                  ? "Saving..."
                  : selectedCompleted
                    ? "✕ Unmark this square"
                    : "✓ Mark as complete"}
              </button>
            )}
            {isAutoSquare && !selectedCompleted && (
              <div
                className="flex items-center gap-2 rounded-xl p-3 text-sm border"
                style={{
                  background: "var(--bg-primary)",
                  borderColor: "var(--border-colour)",
                  color: "var(--text-secondary)",
                }}
              >
                <Lock size={14} className="flex-shrink-0" />
                <span>
                  Complete the activity in-game and this will update
                  automatically.
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
