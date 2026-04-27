import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BingoCard } from "@/components/bingo/bingo-card";
import { detectAutoSquares } from "@/lib/bingo-detect";
import { BINGO_SQUARES, CARD_SIZE } from "@/lib/bingo-squares";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Bingo" };

function seededShuffle<T>(arr: T[], seed: string): T[] {
  const copy = [...arr];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  for (let i = copy.length - 1; i > 0; i--) {
    hash = (hash * 1664525 + 1013904223) | 0;
    const j = Math.abs(hash) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default async function BingoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: activeCardRaw } = await supabase
    .from("bingo_cards")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  const activeCard = activeCardRaw as any;

  if (!activeCard) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4">🎯</p>
        <h1
          className="text-xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          No Active Bingo Card
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
          Ask your admin to create a bingo card for this season.
        </p>
      </div>
    );
  }

  const { data: progressRaw } = await supabase
    .from("member_bingo_progress")
    .select("square_id, completed_at")
    .eq("member_id", user.id)
    .eq("card_id", activeCard.id);
  const progress = (progressRaw as any[]) ?? [];
  const completedSquareIds = new Set(progress.map((p: any) => p.square_id));

  let { data: memberSquaresRaw } = await supabase
    .from("bingo_squares")
    .select("*")
    .eq("card_id", activeCard.id)
    .order("row_index", { ascending: true })
    .order("col_index", { ascending: true });
  let memberSquares = (memberSquaresRaw as any[]) ?? [];

  if (memberSquares.length === 0) {
    const seed = `${activeCard.id}-${user.id}`;
    const shuffled = seededShuffle(BINGO_SQUARES, seed).slice(0, CARD_SIZE);
    const squaresToInsert = shuffled.map((sq, i) => ({
      card_id: activeCard.id,
      row_index: Math.floor(i / 3),
      col_index: i % 3,
      label: sq.autoKey ? `[${sq.autoKey}] ${sq.label}` : sq.label,
      description: sq.description,
      is_free_space: false,
      achievement_id: null,
    }));
    const { data: inserted } = await supabase
      .from("bingo_squares" as any)
      .insert(squaresToInsert as any)
      .select();
    memberSquares = (inserted as any[]) ?? [];
  }

  const autoResults = await detectAutoSquares(supabase, user.id);
  for (const sq of memberSquares) {
    const autoKeyMatch = sq.label?.match(/^\[([^\]]+)\]/);
    if (!autoKeyMatch) continue;
    const autoKey = autoKeyMatch[1];
    if (autoResults[autoKey] && !completedSquareIds.has(sq.id)) {
      await (supabase as any).from("member_bingo_progress").upsert({
        member_id: user.id,
        card_id: activeCard.id,
        square_id: sq.id,
        notes: "Auto-detected",
      });
      completedSquareIds.add(sq.id);
    }
  }

  const { data: freshProgressRaw } = await supabase
    .from("member_bingo_progress")
    .select("square_id, completed_at")
    .eq("member_id", user.id)
    .eq("card_id", activeCard.id);
  const freshProgress = (freshProgressRaw as any[]) ?? [];
  const completedCount = freshProgress.length;
  const isComplete = completedCount >= CARD_SIZE;

  if (isComplete) {
    const { data: cardAchievementRaw } = await supabase
      .from("achievements")
      .select("id")
      .eq("trigger_type", "bingo_full_card")
      .eq("is_active", true)
      .single();
    const cardAchievement = cardAchievementRaw as any;
    if (cardAchievement) {
      await (supabase as any).from("member_bingo_progress").upsert({
        member_id: user.id,
        achievement_id: cardAchievement.id,
        notes: `Completed bingo card: ${activeCard.name}`,
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Bingo
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          {activeCard.name} · {activeCard.season}
        </p>
      </div>

      {/* Progress bar */}
      <div
        className="rounded-2xl border p-4"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-colour)",
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {completedCount} / {CARD_SIZE} squares
          </span>
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--accent-600)" }}
          >
            {Math.round((completedCount / CARD_SIZE) * 100)}%
          </span>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: "var(--bg-primary)" }}
        >
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / CARD_SIZE) * 100}%` }}
          />
        </div>
        {isComplete && (
          <div className="mt-3 text-center">
            <p className="text-lg font-bold text-green-600">
              🎉 BINGO! Card Complete!
            </p>
          </div>
        )}
      </div>

      <BingoCard
        squares={memberSquares}
        completedIds={new Set(freshProgress.map((p: any) => p.square_id))}
        userId={user.id}
        cardId={activeCard.id}
        isAdmin={(profile as any)?.role === "admin"}
        season={activeCard.season}
      />
    </div>
  );
}
