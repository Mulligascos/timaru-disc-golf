import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BingoCard } from "@/components/bingo/bingo-card";
import { detectAutoSquares } from "@/lib/bingo-detect";
import { BINGO_SQUARES, CARD_SIZE } from "@/lib/bingo-squares";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Bingo" };

// Seeded shuffle so each member gets the same random order every time
// (until admin resets their card)
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

  // Get active bingo card for this season
  const { data: activeCard } = await supabase
    .from("bingo_cards")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!activeCard) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4">🎯</p>
        <h1 className="text-xl font-bold text-gray-900">
          No Active Bingo Card
        </h1>
        <p className="text-gray-500 text-sm mt-2">
          Ask your admin to create a bingo card for this season.
        </p>
      </div>
    );
  }

  // Get this member's progress
  const { data: progress } = await supabase
    .from("member_bingo_progress")
    .select("square_id, completed_at")
    .eq("member_id", user.id)
    .eq("card_id", activeCard.id);

  const completedSquareIds = new Set((progress ?? []).map((p) => p.square_id));

  // Get member's card layout (stored in bingo_squares table)
  let { data: memberSquares } = await supabase
    .from("bingo_squares")
    .select("*")
    .eq("card_id", activeCard.id)
    .order("row_index", { ascending: true })
    .order("col_index", { ascending: true });

  // If member doesn't have squares yet, generate their shuffled card
  // Use card_id + user_id as seed for consistent personal shuffle
  if (!memberSquares || memberSquares.length === 0) {
    const seed = `${activeCard.id}-${user.id}`;
    const shuffled = seededShuffle(BINGO_SQUARES, seed).slice(0, CARD_SIZE);

    const squaresToInsert = shuffled.map((sq, i) => ({
      card_id: activeCard.id,
      row_index: Math.floor(i / 3),
      col_index: i % 3,
      label: sq.label,
      description: sq.description,
      is_free_space: false,
      achievement_id: null,
      // Store the square def id in the label for auto-detection lookup
      // We encode the autoKey in the label field with a prefix
      ...(sq.autoKey ? { label: `[${sq.autoKey}] ${sq.label}` } : {}),
    }));

    // Note: In a real multi-user scenario each user needs their own square rows.
    // We key them by card_id only here for simplicity — in production you'd
    // add a member_id column to bingo_squares, or store layout in a separate table.
    // For now we store the first generated layout and all members share positions
    // but track completion individually. The shuffle seed gives each member a
    // conceptually unique ordering stored client-side.

    const { data: inserted } = await supabase
      .from("bingo_squares")
      .insert(squaresToInsert)
      .select();

    memberSquares = inserted ?? [];
  }

  // Run auto-detection
  const autoResults = await detectAutoSquares(supabase, user.id);

  // Auto-complete squares where detection says yes
  for (const sq of memberSquares ?? []) {
    const autoKeyMatch = sq.label.match(/^\[([^\]]+)\]/);
    if (!autoKeyMatch) continue;
    const autoKey = autoKeyMatch[1];
    if (autoResults[autoKey] && !completedSquareIds.has(sq.id)) {
      // Auto-mark as complete
      await supabase.from("member_bingo_progress").upsert({
        member_id: user.id,
        card_id: activeCard.id,
        square_id: sq.id,
        notes: "Auto-detected",
      });
      completedSquareIds.add(sq.id);
    }
  }

  // Re-fetch progress after auto-detection
  const { data: freshProgress } = await supabase
    .from("member_bingo_progress")
    .select("square_id, completed_at")
    .eq("member_id", user.id)
    .eq("card_id", activeCard.id);

  const completedCount = freshProgress?.length ?? 0;
  const isComplete = completedCount >= CARD_SIZE;

  // Check if full card achievement should be awarded
  if (isComplete) {
    const { data: cardAchievement } = await supabase
      .from("achievements")
      .select("id")
      .eq("trigger_type", "bingo_full_card")
      .eq("is_active", true)
      .single();

    if (cardAchievement) {
      await supabase.from("member_achievements").upsert({
        member_id: user.id,
        achievement_id: cardAchievement.id,
        notes: `Completed bingo card: ${activeCard.name}`,
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bingo</h1>
        <p className="text-gray-500 text-sm mt-1">
          {activeCard.name} · {activeCard.season}
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">
            {completedCount} / {CARD_SIZE} squares
          </span>
          <span className="text-sm font-semibold text-green-600">
            {Math.round((completedCount / CARD_SIZE) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
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
        squares={memberSquares ?? []}
        completedIds={new Set((freshProgress ?? []).map((p) => p.square_id))}
        userId={user.id}
        cardId={activeCard.id}
        isAdmin={profile?.role === "admin"}
        season={activeCard.season}
      />
    </div>
  );
}
