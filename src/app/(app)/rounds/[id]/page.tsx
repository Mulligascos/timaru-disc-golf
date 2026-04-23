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
      "id, played_on, notes, is_complete, status, course_id, starting_hole, courses(id, name, hole_count)",
    )
    .eq("id", id)
    .single();

  if (!round || (round as any).status === "cancelled") notFound();

  const { data: holes } = await supabase
    .from("holes")
    .select("*")
    .eq("course_id", (round as any).course_id)
    .order("hole_number", { ascending: true });

  if (!holes || holes.length === 0) {
    return (
      <div className="min-h-screen bg-[#0d2818] flex flex-col items-center justify-center text-center p-6">
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

  // Re-order holes based on starting hole (wrap around)
  const startingHole = (round as any).starting_hole ?? 1;
  const startIdx = (holes as any[]).findIndex(
    (h: any) => h.hole_number === startingHole,
  );
  const orderedHoles =
    startIdx > 0
      ? [...holes.slice(startIdx), ...holes.slice(0, startIdx)]
      : holes;

  const { data: scorecards } = await supabase
    .from("scorecards")
    .select(
      "id, player_id, scores(throws, hole_id), profiles(id, full_name, username)",
    )
    .eq("casual_round_id", (round as any).id);

  if (!scorecards || scorecards.length === 0) {
    return (
      <div className="min-h-screen bg-[#0d2818] flex flex-col items-center justify-center text-center p-6">
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
      existingScores[s.hole_id] = s.throws;
    }
    return {
      id: sc.player_id,
      name: profile?.full_name ?? profile?.username ?? "Player",
      scorecardId: sc.id,
      existingScores,
    };
  });

  const { data: allMembers } = await supabase
    .from("profiles")
    .select("id, full_name, username")
    .eq("is_active", true);

  const currentPlayerIds = (scorecards as any[]).map((sc: any) => sc.player_id);

  return (
    <CasualScorecardEntry
      players={players}
      holes={orderedHoles}
      roundId={(round as any).id}
      roundDate={(round as any).played_on}
      courseName={(round as any).courses?.name ?? "Course"}
      notes={(round as any).notes}
      isComplete={(round as any).is_complete}
      startingHole={startingHole}
      allMembers={allMembers ?? []}
      currentPlayerIds={currentPlayerIds}
    />
  );
}
