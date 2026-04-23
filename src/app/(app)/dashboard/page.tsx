import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  Tag,
  Grid3x3,
  Disc,
  AlertTriangle,
  Lightbulb,
  ChevronRight,
} from "lucide-react";
import { StartCasualRound } from "@/components/rounds/start-casual-round";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, bag_tags(tag_number)")
    .eq("id", user.id)
    .single();

  const { data: announcements } = await supabase
    .from("announcements")
    .select("*")
    .lte("published_at", new Date().toISOString())
    .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(3);

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("*, courses(name)")
    .in("status", ["open", "in_progress"])
    .order("start_date", { ascending: true })
    .limit(3);

  const { data: allMembers } = await supabase
    .from("profiles")
    .select("id, username, full_name")
    .eq("is_active", true);

  const { data: courses } = await supabase
    .from("courses")
    .select("id, name")
    .eq("is_active", true);

  // Recent casual rounds this user was in
  const { data: recentRounds } = await supabase
    .from("casual_rounds")
    .select("id, played_on, is_complete, status, courses(name)")
    .eq("created_by", user.id)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(5);

  const quickLinks = [
    {
      href: "/tournaments",
      label: "Tournaments",
      icon: Trophy,
      colour: "bg-blue-500",
    },
    {
      href: "/bag-tags",
      label: "Bag Tags",
      icon: Tag,
      colour: "bg-orange-500",
    },
    { href: "/bingo", label: "Bingo", icon: Grid3x3, colour: "bg-purple-500" },
    {
      href: "/lost-found",
      label: "Lost & Found",
      icon: Disc,
      colour: "bg-red-500",
    },
    {
      href: "/hazards",
      label: "Hazards",
      icon: AlertTriangle,
      colour: "bg-yellow-500",
    },
    {
      href: "/improvements",
      label: "Suggest",
      icon: Lightbulb,
      colour: "bg-green-500",
    },
  ];

  const firstName =
    (profile as any)?.full_name?.split(" ")[0] ??
    (profile as any)?.username ??
    "there";

  return (
    <div className="space-y-6">
      {/* Hero greeting */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
        <p className="text-green-400 text-sm font-medium">Welcome back</p>
        <h1 className="text-2xl font-bold mt-1">{firstName} 👋</h1>
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          {(profile as any)?.bag_tags?.tag_number ? (
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-sm">
              <Tag size={14} className="text-green-400" />
              <span>
                Bag Tag{" "}
                <span className="font-bold text-green-400">
                  #{(profile as any).bag_tags.tag_number}
                </span>
              </span>
            </div>
          ) : (
            <Link
              href="/bag-tags"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full text-sm transition-colors"
            >
              <Tag size={14} className="text-gray-400" />
              <span className="text-gray-300">Claim a bag tag →</span>
            </Link>
          )}
          {/* Start Round button right in the hero */}
          <StartCasualRound
            userId={user.id}
            members={allMembers ?? []}
            courses={courses ?? []}
          />
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Quick Access
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {quickLinks.map(({ href, label, icon: Icon, colour }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 active:scale-95 transition-all"
            >
              <div
                className={`w-10 h-10 ${colour} rounded-xl flex items-center justify-center`}
              >
                <Icon size={20} className="text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent casual rounds */}
      {recentRounds && recentRounds.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Recent Rounds
          </h2>
          <div className="space-y-2">
            {(recentRounds as any[]).map((round: any) => (
              <Link
                key={round.id}
                href={`/rounds/${round.id}`}
                className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    round.is_complete ? "bg-green-100" : "bg-yellow-100"
                  }`}
                >
                  <Trophy
                    size={20}
                    className={
                      round.is_complete ? "text-green-600" : "text-yellow-600"
                    }
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">
                    {(round as any).courses?.name ?? "Casual Round"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(round.played_on).toLocaleDateString("en-NZ", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                    round.is_complete
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {round.is_complete ? "Complete" : "In progress"}
                </span>
                <ChevronRight
                  size={16}
                  className="text-gray-400 flex-shrink-0"
                />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Announcements */}
      {announcements && announcements.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Announcements
            </h2>
            <Link
              href="/announcements"
              className="text-xs text-green-600 font-medium"
            >
              See all
            </Link>
          </div>
          <div className="space-y-2">
            {(announcements as any[]).map((a: any) => (
              <div
                key={a.id}
                className={`bg-white rounded-xl border p-4 ${a.is_pinned ? "border-green-300" : "border-gray-200"}`}
              >
                {a.is_pinned && (
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full mb-2 inline-block">
                    📌 Pinned
                  </span>
                )}
                <h3 className="font-semibold text-gray-900 text-sm">
                  {a.title}
                </h3>
                <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                  {a.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active tournaments */}
      {tournaments && tournaments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Active Events
            </h2>
            <Link
              href="/tournaments"
              className="text-xs text-green-600 font-medium"
            >
              See all
            </Link>
          </div>
          <div className="space-y-2">
            {(tournaments as any[]).map((t: any) => (
              <Link
                key={(t as any).id}
                href={`/tournaments/${(t as any).id}`}
                className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${t.status === "in_progress" ? "bg-green-100" : "bg-blue-100"}`}
                >
                  <Trophy
                    size={20}
                    className={
                      t.status === "in_progress"
                        ? "text-green-600"
                        : "text-blue-600"
                    }
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {t.name}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {new Date(t.start_date).toLocaleDateString("en-NZ", {
                      day: "numeric",
                      month: "short",
                    })}
                    {(t as any).courses?.name &&
                      ` · ${(t as any).courses.name}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${t.status === "in_progress" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}
                  >
                    {t.status === "in_progress" ? "Live" : "Open"}
                  </span>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
