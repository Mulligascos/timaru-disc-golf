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
  if (autoKeyMatch) {
    const def = BINGO_SQUARES.find((s) => s.autoKey === autoKeyMatch[1]);
    return def ?? null;
  }
  const def = BINGO_SQUARES.find((s) => s.label === label);
  return def ?? null;
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

  // Sort squares into 3-col grid order
  const grid: (BingoSquare | null)[][] = Array.from({ length: 8 }, () =>
    Array(3).fill(null),
  );
  for (const sq of squares) {
    if (sq.row_index < 8 && sq.col_index < 3) {
      grid[sq.row_index][sq.col_index] = sq;
    }
  }

  async function toggleSquare(sq: BingoSquare) {
    const def = getSquareDef(sq.label);
    const isAuto = def?.autoDetect ?? false;
    if (isAuto) return; // auto squares can't be manually toggled

    setMarking(true);
    const isCompleted = completed.has(sq.id);

    if (isCompleted) {
      await supabase
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
      await supabase
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
      {/* 3×8 grid */}
      <div className="grid grid-cols-3 gap-2">
        {grid.flat().map((sq, i) => {
          if (!sq)
            return (
              <div
                key={i}
                className="aspect-square bg-gray-50 rounded-xl border border-dashed border-gray-200"
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
                  : "bg-white border-gray-200 hover:border-gray-300 text-gray-700"
              }`}
            >
              {/* Auto badge */}
              {isAuto && (
                <div
                  className={`absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center ${
                    isCompleted ? "bg-green-400" : "bg-blue-100"
                  }`}
                >
                  <Zap
                    size={9}
                    className={isCompleted ? "text-white" : "text-blue-500"}
                  />
                </div>
              )}

              {/* Completed check */}
              {isCompleted && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Check size={18} className="text-white" strokeWidth={3} />
                  </div>
                </div>
              )}

              <span className="text-xl leading-none">{def?.icon ?? "🎯"}</span>
              <span
                className={`text-center font-semibold leading-tight ${
                  isCompleted ? "text-white text-opacity-90" : "text-gray-700"
                }`}
                style={{ fontSize: "9px" }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
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
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-6">
            <button
              onClick={() => setSelectedSquare(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-5">
              <span className="text-5xl">{selectedDef?.icon ?? "🎯"}</span>
              <h2 className="text-lg font-bold text-gray-900 mt-3">
                {cleanLabel(selectedSquare.label)}
              </h2>
              <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                {selectedSquare.description ??
                  selectedDef?.description ??
                  "Complete this activity to mark it off."}
              </p>
            </div>

            {isAutoSquare ? (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700 mb-4">
                <Zap size={16} className="flex-shrink-0" />
                <span>
                  This square is <strong>automatically detected</strong> from
                  your scoring history.
                </span>
              </div>
            ) : null}

            {selectedCompleted ? (
              <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 mb-4">
                <Check size={16} />
                <span className="font-semibold">Completed!</span>
              </div>
            ) : null}

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
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-500">
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
