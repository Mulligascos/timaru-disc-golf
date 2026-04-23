import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Trophy,
  Tag,
  MapPin,
  Megaphone,
  AlertTriangle,
  Lightbulb,
  Grid3x3,
  Award,
  ChevronRight,
  Activity,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Panel" };

export default async function AdminPage() {
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
  if ((profile as any)?.role !== "admin") redirect("/dashboard");

  // Fetch counts for dashboard stats
  const [
    { count: memberCount },
    { count: tournamentCount },
    { count: tagCount },
    { count: hazardCount },
    { count: improvementCount },
    { count: lostCount },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("tournaments")
      .select("*", { count: "exact", head: true })
      .in("status", ["open", "in_progress"]),
    supabase
      .from("bag_tags")
      .select("*", { count: "exact", head: true })
      .is("holder_id", null),
    supabase
      .from("hazard_reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("improvement_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("lost_discs")
      .select("*", { count: "exact", head: true })
      .eq("status", "lost"),
  ]);

  const sections = [
    {
      href: "/admin/members",
      icon: Users,
      label: "Members",
      description: "Manage member profiles and roles",
      colour: "bg-blue-500",
      stat: memberCount,
      statLabel: "active",
    },
    {
      href: "/admin/courses",
      icon: MapPin,
      label: "Courses",
      description: "Add and manage course holes and details",
      colour: "bg-green-500",
      stat: null,
      statLabel: "",
    },
    {
      href: "/admin/tournaments",
      icon: Trophy,
      label: "Tournaments",
      description: "Create and manage tournaments and leagues",
      colour: "bg-purple-500",
      stat: tournamentCount,
      statLabel: "active",
    },
    {
      href: "/admin/bag-tags",
      icon: Tag,
      label: "Bag Tags",
      description: "Create tags and manage assignments",
      colour: "bg-orange-500",
      stat: tagCount,
      statLabel: "unclaimed",
    },
    {
      href: "/admin/announcements",
      icon: Megaphone,
      label: "Announcements",
      description: "Post and manage club announcements",
      colour: "bg-pink-500",
      stat: null,
      statLabel: "",
    },
    {
      href: "/admin/bingo",
      icon: Grid3x3,
      label: "Bingo Cards",
      description: "Manage bingo cards and seasons",
      colour: "bg-indigo-500",
      stat: null,
      statLabel: "",
    },
    {
      href: "/admin/achievements",
      icon: Award,
      label: "Achievements",
      description: "Create and award achievements",
      colour: "bg-yellow-500",
      stat: null,
      statLabel: "",
    },
    {
      href: "/admin/reports",
      icon: AlertTriangle,
      label: "Hazard Reports",
      description: "Review and resolve hazard reports",
      colour: "bg-red-500",
      stat: hazardCount,
      statLabel: "open",
    },
    {
      href: "/admin/improvements",
      icon: Lightbulb,
      label: "Improvements",
      description: "Manage course improvement requests",
      colour: "bg-teal-500",
      stat: improvementCount,
      statLabel: "open",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your disc golf club</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Members",
            value: memberCount ?? 0,
            colour: "text-blue-600",
          },
          {
            label: "Open Hazards",
            value: hazardCount ?? 0,
            colour: "text-red-500",
          },
          {
            label: "Lost Discs",
            value: lostCount ?? 0,
            colour: "text-orange-500",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl border border-gray-200 p-4 text-center"
          >
            <p className={`text-2xl font-black ${s.colour}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Admin sections */}
      <div className="space-y-2">
        {sections.map(
          ({
            href,
            icon: Icon,
            label,
            description,
            colour,
            stat,
            statLabel,
          }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 bg-white rounded-2xl border border-gray-200 p-4 hover:border-gray-300 active:scale-[0.99] transition-all"
            >
              <div
                className={`w-11 h-11 ${colour} rounded-xl flex items-center justify-center flex-shrink-0`}
              >
                <Icon size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {stat != null && stat > 0 && (
                  <span className="text-xs bg-gray-100 text-gray-600 font-semibold px-2 py-1 rounded-full">
                    {stat} {statLabel}
                  </span>
                )}
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </Link>
          ),
        )}
      </div>
    </div>
  );
}
