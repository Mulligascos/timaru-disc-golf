import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Achievements" };

export default async function AchievementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: myAchievements } = await supabase
    .from("member_achievements")
    .select(
      "*, achievement(id, name, description, badge_colour, icon_url, trigger_type)",
    )
    .eq("member_id", user.id)
    .order("awarded_at", { ascending: false });

  const { data: allAchievements } = await supabase
    .from("achievements")
    .select("*")
    .eq("is_active", true)
    .order("name");

const earnedIds = new Set(
  (myAchievements ?? []).map((a: any) => a.achievement_id),
)
const unearnedAchievements = (allAchievements ?? []).filter(
  (a: any) => !earnedIds.has(a.id),
)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Achievements</h1>
        <p className="text-gray-500 text-sm mt-1">
          {myAchievements?.length ?? 0} earned · {unearnedAchievements.length}{" "}
          remaining
        </p>
      </div>

      {/* Earned */}
      {myAchievements && myAchievements.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Earned
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {myAchievements.map((ma) => (
              <div
                key={ma.id}
                className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{
                    backgroundColor:
                      (ma.achievements?.badge_colour ?? "#22c55e") + "20",
                  }}
                >
                  {ma.achievements?.icon_url ? (
                    <img
                      src={ma.achievements.icon_url}
                      className="w-8 h-8"
                      alt=""
                    />
                  ) : (
                    "🏆"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">
                    {ma.achievements?.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                    {ma.achievements?.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(ma.awarded_at).toLocaleDateString("en-NZ", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Unearned */}
      {unearnedAchievements.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Still to earn
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {unearnedAchievements.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4 opacity-50"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl grayscale flex-shrink-0">
                  🔒
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-700 text-sm">
                    {a.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                    {a.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {(!myAchievements || myAchievements.length === 0) &&
        unearnedAchievements.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🥇</p>
            <p className="font-semibold text-gray-600">
              No achievements set up yet
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Ask your admin to create achievements.
            </p>
          </div>
        )}
    </div>
  );
}
