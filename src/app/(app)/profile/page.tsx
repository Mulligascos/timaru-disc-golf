import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/profile-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Profile" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const currentSeason = new Date().getFullYear().toString();

  const [{ data: profile }, { data: bagTag }, { data: achievements }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("bag_tags")
        .select("tag_number")
        .eq("holder_id", user.id)
        .eq("is_active", true)
        .eq("season", currentSeason)
        .maybeSingle(),
      supabase
        .from("member_achievements")
        .select("*, achievements(name, description, badge_colour, icon_url)")
        .eq("member_id", user.id)
        .order("awarded_at", { ascending: false }),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          My Profile
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Manage your club profile and details
        </p>
      </div>

      <ProfileForm
        profile={profile}
        userId={user.id}
        email={user.email ?? ""}
        bagTagNumber={(bagTag as any)?.tag_number ?? null}
      />

      {achievements && achievements.length > 0 && (
        <div
          className="rounded-2xl border p-5"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-colour)",
          }}
        >
          <h2
            className="font-semibold mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Achievements
          </h2>
          <div className="flex flex-wrap gap-3">
            {(achievements as any[]).map((ma: any) => (
              <div
                key={ma.id}
                title={ma.achievements?.description ?? ""}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-white"
                style={{
                  backgroundColor: ma.achievements?.badge_colour ?? "#22c55e",
                }}
              >
                {ma.achievements?.icon_url ? (
                  <img
                    src={ma.achievements.icon_url}
                    className="w-4 h-4"
                    alt=""
                  />
                ) : (
                  <span>🏆</span>
                )}
                {ma.achievements?.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
