import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/profile-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Profile" };

export default async function ProfilePage() {
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

  const { data: achievements } = await supabase
    .from("member_achievements")
    .select("*, achievements(name, description, badge_colour, icon_url)")
    .eq("member_id", user.id)
    .order("awarded_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your club profile and details
        </p>
      </div>

      <ProfileForm
        profile={profile}
        userId={user.id}
        email={user.email ?? ""}
      />

      {/* Achievements */}
      {achievements && achievements.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Achievements</h2>
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
