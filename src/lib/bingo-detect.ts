import type { SupabaseClient } from "@supabase/supabase-js";

export interface AutoDetectResult {
  key: string;
  completed: boolean;
}

export async function detectAutoSquares(
  supabase: SupabaseClient,
  userId: string,
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};

  // ── Fetch all scorecards + scores for this user ──
  const { data: scorecards } = await supabase
    .from("scorecards")
    .select(
      `
      id, total_score, dnf,
      tournament_rounds(course_id, tournament_id),
      scores(throws, hole_id, holes(par, hole_number))
    `,
    )
    .eq("player_id", userId)
    .eq("dnf", false);

  const completedScorecards =
    scorecards?.filter((sc) => sc.total_score != null) ?? [];

  // ── Rounds count ──
  results["rounds_10"] = completedScorecards.length >= 10;
  results["rounds_25"] = completedScorecards.length >= 25;

  // ── Ace & Eagle (single hole scores) ──
  let hasAce = false;
  let hasEagle = false;
  let hasTurkey = false;
  let hasBirdieStreak = false;
  let hasUnderPar = false;
  let personalBest: number | null = null;
  let beatPB = false;
  const playedCourseIds = new Set<string>();

  for (const sc of completedScorecards) {
    const round = sc.tournament_rounds as any;
    if (round?.course_id) playedCourseIds.add(round.course_id);

    const scores = (sc.scores as any[]) ?? [];
    const sortedScores = [...scores].sort((a, b) => {
      const ah = (a.holes as any)?.hole_number ?? 0;
      const bh = (b.holes as any)?.hole_number ?? 0;
      return ah - bh;
    });

    // Ace & Eagle
    for (const s of scores) {
      const par = (s.holes as any)?.par ?? 3;
      if (s.throws === 1) hasAce = true;
      if (s.throws <= par - 2) hasEagle = true;
    }

    // Turkey: 3 consecutive holes at par or better
    for (let i = 0; i <= sortedScores.length - 3; i++) {
      const trio = sortedScores.slice(i, i + 3);
      if (trio.every((s) => s.throws <= (s.holes as any)?.par)) {
        hasTurkey = true;
      }
    }

    // Birdie streak: 3 consecutive holes at birdie or better
    for (let i = 0; i <= sortedScores.length - 3; i++) {
      const trio = sortedScores.slice(i, i + 3);
      if (trio.every((s) => s.throws <= (s.holes as any)?.par - 1)) {
        hasBirdieStreak = true;
      }
    }

    // Under par round
    if (sc.total_score != null) {
      const totalPar = scores.reduce(
        (sum, s) => sum + ((s.holes as any)?.par ?? 3),
        0,
      );
      if (sc.total_score < totalPar) hasUnderPar = true;

      // Beat personal best
      if (personalBest === null || sc.total_score < personalBest) {
        if (personalBest !== null) beatPB = true;
        personalBest = sc.total_score;
      }
    }
  }

  results["ace"] = hasAce;
  results["eagle"] = hasEagle;
  results["turkey"] = hasTurkey;
  results["birdie_streak"] = hasBirdieStreak;
  results["under_par_round"] = hasUnderPar;
  results["beat_pb"] = beatPB;

  // ── All courses ──
  const { data: activeCourses } = await supabase
    .from("courses")
    .select("id")
    .eq("is_active", true);

  const allCourseIds = new Set((activeCourses ?? []).map((c) => c.id));
  results["all_courses"] =
    allCourseIds.size > 0 &&
    [...allCourseIds].every((id) => playedCourseIds.has(id));

  // ── Won a tournament ──
  const { data: leaguePoints } = await supabase
    .from("league_points")
    .select("position")
    .eq("player_id", userId)
    .eq("position", 1);

  // Also check scorecards where player had lowest score (position 1)
  results["won_tournament"] = (leaguePoints?.length ?? 0) > 0;

  // ── Held tag #1 ──
  const { data: tagHistory } = await supabase
    .from("tag_history")
    .select("tag_id, bag_tags(tag_number)")
    .eq("to_holder_id", userId);

  results["held_tag_1"] =
    tagHistory?.some((h) => (h.bag_tags as any)?.tag_number === 1) ?? false;

  return results;
}
