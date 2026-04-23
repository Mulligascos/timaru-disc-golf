import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TournamentForm } from "@/components/tournaments/tournament-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Tournament" };

export default async function NewTournamentPage() {
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
  if ((profile as any)?.role !== "admin") redirect("/tournaments");

  const { data: courses } = await supabase
    .from("courses")
    .select("id, name, city")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Tournament</h1>
        <p className="text-gray-500 text-sm mt-1">Set up a new club event</p>
      </div>
      <TournamentForm courses={(courses as any[]) ?? []} />
    </div>
  );
}
