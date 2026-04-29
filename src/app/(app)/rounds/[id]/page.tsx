import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { CasualScorecardEntry } from "@/components/rounds/casual-scorecard-entry";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Round Scoring" };

export default async function CasualRoundPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: round } = await supabase
    .from("casual_rounds")
    .select(
      "id, played_on, notes, is_complete, status, course_id, starting_hole, layout_id, courses(id, name, hole_count)",
    )
    .eq("id", id)
    .single();

  if (!round || (round as any).status === "cancelled") notFound();

  const roundData = round as any;

  // ── Build hole list ──
  // If a layout is selected, use layout_holes (which may repeat or reorder holes)
  // Otherwise fall back to course holes ordered by hole_number
  let scoringHoles: {
    id: string;
    hole_number: number;
    par: number;
    distance_m: number | null;
  }[] = [];

  if (roundData.layout_id) {
    // Fetch layout holes with their source hole data
    const { data: layoutHoles } = await supabase
      .from("layout_holes")
      .select(
        "hole_number, par_override, distance_override_m, source_hole:holes!layout_holes_source_hole_id_fkey(id, hole_number, par, distance_m)",
      )
      .eq("layout_id", roundData.layout_id)
      .order("hole_number", { ascending: true });

    if (layoutHoles && layoutHoles.length > 0) {
      scoringHoles = (layoutHoles as any[]).map((lh: any) => ({
        id: `${lh.source_hole.id}_${lh.hole_number}`, // unique key for React/scoring state
        source_hole_id: lh.source_hole.id, // ← add this — real UUID for DB saves
        hole_number: lh.hole_number,
        par: lh.par_override ?? lh.source_hole.par,
        distance_m: lh.distance_override_m ?? lh.source_hole.distance_m,
      }));
    }
  }

  // Fall back to course holes if no layout or layout has no holes
  if (scoringHoles.length === 0) {
    const { data: courseHoles } = await supabase
      .from("holes")
      .select("*")
      .eq("course_id", roundData.course_id)
      .order("hole_number", { ascending: true });

    if (!courseHoles || courseHoles.length === 0) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-black">
          <p className="text-4xl mb-4">⚠️</p>
          <p className="font-semibold text-white">
            No holes set up for this course.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Ask your admin to add holes first.
          </p>
        </div>
      );
    }

    // Apply starting hole offset for non-layout rounds
    const startingHole = roundData.starting_hole ?? 1;
    const startIdx = (courseHoles as any[]).findIndex(
      (h: any) => h.hole_number === startingHole,
    );
    scoringHoles =
      startIdx > 0
        ? [...courseHoles.slice(startIdx), ...courseHoles.slice(0, startIdx)]
        : (courseHoles as any[]);
  }

  // ── Build player list ──
  const { data: scorecards } = await supabase
    .from("scorecards")
    .select(
      "id, player_id, scores(throws, hole_id), profiles(id, full_name, username, nickname, division)",
    )
    .eq("casual_round_id", roundData.id);

  if (!scorecards || scorecards.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-black">
        <p className="text-4xl mb-4">👥</p>
        <p className="font-semibold text-white">
          No players found for this round.
        </p>
      </div>
    );
  }

  const players = (scorecards as any[]).map((sc: any) => {
    const profile = sc.profiles as any;
    const existingScores: Record<string, number> = {};
    for (const s of sc.scores ?? []) {
      // Find which layout position this hole maps to
      const layoutHole = scoringHoles.find(
        (h: any) => (h.source_hole_id ?? h.id) === s.hole_id,
      );
      if (layoutHole) {
        existingScores[layoutHole.id] = s.throws; // key by composite ID
      }
    }
    return {
      id: sc.player_id,
      name:
        profile?.nickname ??
        profile?.full_name ??
        profile?.username ??
        "Player",
      scorecardId: sc.id,
      existingScores,
      division: profile?.division ?? "mixed",
    };
  });

  const { data: allMembers } = await supabase
    .from("profiles")
    .select("id, full_name, username, nickname")
    .eq("is_active", true);

  const currentPlayerIds = (scorecards as any[]).map((sc: any) => sc.player_id);
  let layoutName: string | null = null;
  if (roundData.layout_id) {
    const { data: layoutData } = await supabase
      .from("course_layouts")
      .select("name")
      .eq("id", roundData.layout_id)
      .single();
    layoutName = (layoutData as any)?.name ?? null;
  }
  return (
    <CasualScorecardEntry
      players={players}
      holes={scoringHoles}
      roundId={roundData.id}
      roundDate={roundData.played_on}
      courseName={
        layoutName
          ? `${roundData.courses?.name} · ${layoutName}`
          : (roundData.courses?.name ?? "Course")
      }
      notes={roundData.notes}
      isComplete={roundData.is_complete}
      startingHole={roundData.starting_hole ?? 1}
      allMembers={allMembers ?? []}
      currentPlayerIds={currentPlayerIds}
    />
  );
}
