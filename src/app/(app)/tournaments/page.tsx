import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  Plus,
  Calendar,
  MapPin,
  Users,
  ChevronRight,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tournaments" };

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

const formatLabel: Record<string, string> = {
  stroke_play: "Stroke Play",
  match_play: "Match Play",
  league: "League",
};

export default async function TournamentsPage() {
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

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select(`*, courses(name), tournament_registrations(count)`)
    .neq("status", "cancelled")
    .order("start_date", { ascending: false });

  const active =
    (tournaments as any[])?.filter((t: any) =>
      ["open", "in_progress"].includes(t.status),
    ) ?? [];
  const past = tournaments?.filter((t: any) => t.status === "completed") ?? [];
  const drafts = tournaments?.filter((t: any) => t.status === "draft") ?? [];

  function TournamentCard({ t }: { t: any }) {
    return (
      <Link
        href={`/tournaments/${(t as any).id}`}
        className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 active:scale-[0.98] transition-all"
      >
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            t.status === "in_progress"
              ? "bg-green-100"
              : t.status === "completed"
                ? "bg-purple-100"
                : "bg-blue-100"
          }`}
        >
          <Trophy
            size={22}
            className={
              t.status === "in_progress"
                ? "text-green-600"
                : t.status === "completed"
                  ? "text-purple-600"
                  : "text-blue-600"
            }
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 text-sm truncate">
              {t.name}
            </p>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColour[t.status]}`}
            >
              {statusLabel[t.status]}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {new Date(t.start_date).toLocaleDateString("en-NZ", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            {t.courses?.name && (
              <span className="flex items-center gap-1">
                <MapPin size={11} /> {t.courses.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users size={11} /> {formatLabel[t.format]}
            </span>
          </div>
        </div>
        <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
      </Link>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tournaments</h1>
          <p className="text-gray-500 text-sm mt-1">
            Club events and league play
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/tournaments/new"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={16} /> New
          </Link>
        )}
      </div>

      {active.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Active & Open
          </h2>
          <div className="space-y-2">
            {active.map((t) => (
              <TournamentCard key={(t as any).id} t={t} />
            ))}
          </div>
        </section>
      )}

      {isAdmin && drafts.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Drafts
          </h2>
          <div className="space-y-2">
            {drafts.map((t) => (
              <TournamentCard key={(t as any).id} t={t} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Past Events
          </h2>
          <div className="space-y-2">
            {past.map((t) => (
              <TournamentCard key={(t as any).id} t={t} />
            ))}
          </div>
        </section>
      )}

      {(!tournaments || tournaments.length === 0) && (
        <div className="text-center py-16">
          <Trophy size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="font-semibold text-gray-600">No tournaments yet</p>
          {isAdmin && (
            <Link
              href="/tournaments/new"
              className="mt-4 inline-flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl"
            >
              <Plus size={16} /> Create First Tournament
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
