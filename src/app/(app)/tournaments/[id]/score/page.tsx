import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ScorecardEntry } from "@/components/tournaments/scorecard-entry";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Enter Scores" };

export default async function ScorePage({
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

  const { data: tournamentRaw } = await supabase
    .from("tournaments")
    .select("*, courses(id, name)")
    .eq("id", id)
    .single();

  const tournament = tournamentRaw as any;
  if (!tournament || tournament.status !== "in_progress") notFound();

  const { data: roundsRaw } = await supabase
    .from("tournament_rounds")
    .select("*")
    .eq("tournament_id", id)
    .eq("is_complete", false)
    .order("round_number", { ascending: true })
    .limit(1);

  const currentRound = (roundsRaw as any[])?.[0];

  if (!currentRound) {
    return (
      <div className="min-h-screen bg-[#0d2818] flex flex-col items-center justify-center text-center p-6">
        <p className="text-4xl mb-4">✅</p>
        <p className="font-semibold text-white">All rounds complete!</p>
      </div>
    );
  }

  const courseId = currentRound.course_id ?? tournament.courses?.id;
  const { data: holesRaw } = await supabase
    .from("holes")
    .select("*")
    .eq("course_id", courseId)
    .order("hole_number", { ascending: true });

  const holes = (holesRaw as any[]) ?? [];

  if (holes.length === 0) {
    return (
      <div className="min-h-screen bg-[#0d2818] flex flex-col items-center justify-center text-center p-6">
        <p className="text-4xl mb-4">⚠️</p>
        <p className="font-semibold text-white">
          No holes set up for this course.
        </p>
      </div>
    );
  }

  // ← Added nickname and division to the select
  const { data: registrationsRaw } = await supabase
    .from("tournament_registrations")
    .select("player_id, profiles(id, full_name, username, nickname, division)")
    .eq("tournament_id", id);

  const registrations = (registrationsRaw as any[]) ?? [];

  if (registrations.length === 0) {
    return (
      <div className="min-h-screen bg-[#0d2818] flex flex-col items-center justify-center text-center p-6">
        <p className="text-4xl mb-4">👥</p>
        <p className="font-semibold text-white">No players registered.</p>
      </div>
    );
  }

  const players: {
    id: string;
    name: string;
    scorecardId: string;
    existingScores: Record<string, number>;
    division: string;
  }[] = [];
  for (const reg of registrations) {
    const profile = reg.profiles as any;
    if (!profile) continue;

    let { data: scorecardRaw } = await supabase
      .from("scorecards")
      .select("id, scores(throws, hole_id)")
      .eq("round_id", currentRound.id)
      .eq("player_id", reg.player_id)
      .single();

    let scorecard = scorecardRaw as any;

    if (!scorecard) {
      const { data: newCard } = await supabase
        .from("scorecards")
        .insert({ round_id: currentRound.id, player_id: reg.player_id } as any)
        .select("id, scores(throws, hole_id)")
        .single();
      scorecard = newCard as any;
    }

    const existingScores: Record<string, number> = {};
    for (const s of scorecard?.scores ?? []) {
      existingScores[(s as any).hole_id] = (s as any).throws;
    }

    players.push({
      id: reg.player_id,
      // Display name: nickname > full_name > username
      name:
        profile.nickname ?? profile.full_name ?? profile.username ?? "Player",
      scorecardId: scorecard?.id ?? "",
      existingScores,
      division: profile.division ?? "mixed", // ← added
    });
  }

  return (
    <ScorecardEntry
      players={players}
      holes={holes}
      tournamentId={id}
      roundId={currentRound.id}
      roundNumber={currentRound.round_number}
      courseName={tournament.courses?.name ?? "Course"}
    />
  );
}
