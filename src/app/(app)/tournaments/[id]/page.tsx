import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  ChevronLeft,
  Edit,
} from "lucide-react";
import { RegisterButton } from "@/components/tournaments/register-button";
import { Leaderboard } from "@/components/tournaments/leaderboard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tournament" };

const statusColour: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-green-100 text-green-700",
  completed: "bg-purple-100 text-purple-700",
  cancelled: "bg-red-100 text-red-600",
};
const statusLabel: Record<string, string> = {
  draft: "Draft",
  open: "Open",
  in_progress: "Live",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default async function TournamentDetailPage({
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isAdmin = (profile as any)?.role === "admin";

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("*, courses(id, name, city)")
    .eq("id", id)
    .single();

  if (!tournament) notFound();

  const t = tournament as any;

  const { data: registrations } = await supabase
    .from("tournament_registrations")
    .select("*, profiles(id, username, full_name, avatar_url)")
    .eq("tournament_id", id)
    .order("registered_at", { ascending: true });

  const { data: rounds } = await supabase
    .from("tournament_rounds")
    .select("*, courses(name)")
    .eq("tournament_id", id)
    .order("round_number", { ascending: true });

  const isRegistered =
    (registrations as any[])?.some((r: any) => r.player_id === user.id) ??
    false;
  const canRegister = t.status === "open";
  const canScore = t.status === "in_progress" && isRegistered;

  let scorecards: any[] = [];
  if (
    ["in_progress", "completed"].includes(t.status) &&
    rounds &&
    rounds.length > 0
  ) {
    const roundIds = (rounds as any[]).map((r: any) => r.id);
    const { data } = await supabase
      .from("scorecards")
      .select("*, profiles(id, username, full_name)")
      .in("round_id", roundIds);
    scorecards = (data as any[]) ?? [];
  }

  return (
    <div className="space-y-6">
      <Link
        href="/tournaments"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ChevronLeft size={16} /> Tournaments
      </Link>

      {/* Header */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusColour[t.status]}`}
            >
              {statusLabel[t.status]}
            </span>
            <h1 className="text-xl font-bold mt-2">{t.name}</h1>
            {t.description && (
              <p className="text-gray-300 text-sm mt-1">{t.description}</p>
            )}
          </div>
          {isAdmin && (
            <Link
              href={`/tournaments/${t.id}/edit`}
              className="flex-shrink-0 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <Edit size={16} />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-gray-400 text-xs">Date</p>
            <p className="text-white text-sm font-semibold mt-0.5 flex items-center gap-1">
              <Calendar size={13} />
              {new Date(t.start_date).toLocaleDateString("en-NZ", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-gray-400 text-xs">Format</p>
            <p className="text-white text-sm font-semibold mt-0.5 capitalize">
              {t.format?.replace("_", " ")}
            </p>
          </div>
          {t.courses?.name && (
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-gray-400 text-xs">Course</p>
              <p className="text-white text-sm font-semibold mt-0.5 flex items-center gap-1">
                <MapPin size={13} /> {t.courses.name}
              </p>
            </div>
          )}
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-gray-400 text-xs">Players</p>
            <p className="text-white text-sm font-semibold mt-0.5 flex items-center gap-1">
              <Users size={13} />
              {(registrations as any[])?.length ?? 0}
              {t.max_players ? ` / ${t.max_players}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {canRegister && (
          <RegisterButton
            tournamentId={t.id}
            userId={user.id}
            isRegistered={isRegistered}
          />
        )}
        {canScore && rounds && (rounds as any[]).length > 0 && (
          <Link
            href={`/tournaments/${t.id}/score`}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            <Trophy size={18} /> Enter Scores
          </Link>
        )}
      </div>

      {/* Leaderboard */}
      {["in_progress", "completed"].includes(t.status) &&
        scorecards.length > 0 && (
          <Leaderboard
            scorecards={scorecards}
            rounds={(rounds as any[]) ?? []}
            format={t.format}
          />
        )}

      {/* Rounds — admin only */}
      {isAdmin && rounds && (rounds as any[]).length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Rounds</h2>
          <div className="space-y-2">
            {(rounds as any[]).map((r: any) => (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-sm text-gray-900">
                    Round {r.round_number}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {r.played_on
                      ? new Date(r.played_on).toLocaleDateString("en-NZ", {
                          day: "numeric",
                          month: "short",
                        })
                      : "Date TBC"}
                    {r.courses?.name && ` · ${r.courses.name}`}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    r.is_complete
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {r.is_complete ? "Complete" : "In Progress"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Players */}
      {registrations && (registrations as any[]).length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Registered Players ({(registrations as any[]).length})
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {(registrations as any[]).map((r: any) => (
              <div key={r.id} className="flex items-center gap-3 p-3">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {r.profiles?.full_name?.charAt(0)?.toUpperCase() ??
                    r.profiles?.username?.charAt(0)?.toUpperCase() ??
                    "?"}
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {r.profiles?.full_name ?? r.profiles?.username}
                  {r.player_id === user.id && (
                    <span className="text-green-600 text-xs ml-1">(you)</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
