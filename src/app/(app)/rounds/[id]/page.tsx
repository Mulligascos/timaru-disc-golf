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
  let scoringHoles: {
    id: string; // unique key for state (layout_hole_id for layouts, hole_id for plain)
    source_hole_id: string; // real holes.id UUID
    layout_hole_id: string | null; // layout_holes.id UUID (null for non-layout rounds)
    hole_number: number; // position in this round (1, 2, 3... wraps for starting hole)
    display_hole_number: number; // the actual hole label shown on scorecard
    par: number;
    distance_m: number | null;
  }[] = [];

  if (roundData.layout_id) {
    // Layout round — fetch layout holes ordered by position
    const { data: layoutHoles } = await supabase
      .from("layout_holes")
      .select(
        "id, hole_number, par_override, distance_override_m, source_hole:holes!layout_holes_source_hole_id_fkey(id, hole_number, par, distance_m)",
      )
      .eq("layout_id", roundData.layout_id)
      .order("hole_number", { ascending: true });

    if (layoutHoles && layoutHoles.length > 0) {
      scoringHoles = (layoutHoles as any[]).map((lh: any, idx: number) => ({
        id: lh.id, // layout_holes.id is the unique key
        source_hole_id: lh.source_hole.id,
        layout_hole_id: lh.id,
        hole_number: idx + 1, // position in round
        display_hole_number: lh.hole_number, // layout position number
        par: lh.par_override ?? lh.source_hole.par,
        distance_m: lh.distance_override_m ?? lh.source_hole.distance_m,
      }));
    }
  }

  // Fall back to course holes
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

    // Apply starting hole wrap-around
    // e.g. start at hole 6 on 18-hole course: 6,7,8...18,1,2,3,4,5
    const startingHole = roundData.starting_hole ?? 1;
    const startIdx = (courseHoles as any[]).findIndex(
      (h: any) => h.hole_number === startingHole,
    );
    const orderedHoles =
      startIdx > 0
        ? [...courseHoles.slice(startIdx), ...courseHoles.slice(0, startIdx)]
        : (courseHoles as any[]);

    scoringHoles = orderedHoles.map((h: any, idx: number) => ({
      id: h.id,
      source_hole_id: h.id,
      layout_hole_id: null,
      hole_number: idx + 1, // scoring position (1 = first hole played)
      display_hole_number: h.hole_number, // actual hole number on course
      par: h.par,
      distance_m: h.distance_m,
    }));
  }

  // ── Build player list ──
  const { data: scorecards } = await supabase
    .from("scorecards")
    .select(
      "id, player_id, scores(throws, hole_id, layout_hole_id), profiles(id, full_name, username, nickname, division)",
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
      if (s.layout_hole_id) {
        // Layout round — key by layout_hole_id
        existingScores[s.layout_hole_id] = s.throws;
      } else if (s.hole_id) {
        // Non-layout round — key by hole_id
        existingScores[s.hole_id] = s.throws;
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

  const startingHole = roundData.starting_hole ?? 1;

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
      startingHole={startingHole}
      allMembers={allMembers ?? []}
      currentPlayerIds={currentPlayerIds}
      isLayoutRound={!!roundData.layout_id}
    />
  );
}
