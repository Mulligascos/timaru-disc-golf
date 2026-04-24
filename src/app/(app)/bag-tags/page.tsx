import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Tag, History, Trophy, Medal } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Bag Tags" };
export const revalidate = 30;

export default async function BagTagsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const currentSeason = new Date().getFullYear().toString();
  const [{ data: profile }, { data: tags }, { data: history }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("*, bag_tags(id, tag_number, season)")
        .eq("id", user.id)
        .single(),
      supabase
        .from("bag_tags")
        .select("*, profiles(id, username, full_name, avatar_url)")
        .eq("is_active", true)
        .eq("season", currentSeason)
        .order("tag_number", { ascending: true }),
      supabase
        .from("tag_history")
        .select(
          "*, bag_tags(tag_number), from_profile:profiles!tag_history_from_holder_id_fkey(username, full_name), to_profile:profiles!tag_history_to_holder_id_fkey(username, full_name)",
        )
        .order("transferred_at", { ascending: false })
        .limit(10),
    ]);

  const myTag = (profile as any)?.bag_tags;
  const allTags = (tags as any[]) ?? [];
  const claimed = allTags.filter((t) => t.holder_id);
  const unclaimed = allTags.filter((t) => !t.holder_id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bag Tags</h1>
        <p className="text-gray-500 text-sm mt-1">
          {currentSeason} Season · {claimed.length} active · {unclaimed.length}{" "}
          available
        </p>
      </div>

      {/* My tag */}
      {myTag ? (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">
            Your Tag
          </p>
          <div className="flex items-center gap-4">
            <div
              className={`w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                myTag.tag_number === 1
                  ? "bg-yellow-400"
                  : myTag.tag_number <= 3
                    ? "bg-gray-300"
                    : "bg-green-500"
              }`}
            >
              <span
                className={`text-2xl font-black ${
                  myTag.tag_number === 1
                    ? "text-yellow-900"
                    : myTag.tag_number <= 3
                      ? "text-gray-700"
                      : "text-white"
                }`}
              >
                #{myTag.tag_number}
              </span>
            </div>
            <div>
              <p className="text-white font-bold text-xl">
                Tag #{myTag.tag_number}
              </p>
              <p className="text-gray-400 text-sm mt-0.5">
                {myTag.season} Season
              </p>
              <p className="text-gray-400 text-xs mt-1">
                {myTag.tag_number === 1
                  ? "👑 Club Champion!"
                  : myTag.tag_number <= 3
                    ? "🔥 Top 3!"
                    : "Play rounds to move up"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-6 text-center">
          <Tag size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="font-semibold text-gray-600 text-sm">
            No tag assigned yet
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Contact your admin to get a bag tag for this season.
          </p>
        </div>
      )}

      {/* How tags work */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800 space-y-1">
        <p className="font-semibold">How Bag Tags Work</p>
        <p>
          Tags are played for in every round. At the end of each round, tag
          holders are ranked by score — lowest score earns the lowest tag
          number.
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Season runs October 1st → September 30th each year.
        </p>
      </div>

      {/* Leaderboard */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Current Leaderboard
        </h2>
        {claimed.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <Tag size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="font-semibold text-gray-600">No tags assigned yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Admin assigns tags to members.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {claimed.map((tag: any, i: number) => {
                const isMe = tag.holder_id === user.id;
                const name =
                  tag.holder?.full_name ?? tag.holder?.username ?? "Unknown";
                const initials = name.charAt(0).toUpperCase();

                return (
                  <div
                    key={tag.id}
                    className={`flex items-center gap-3 px-4 py-3 ${isMe ? "bg-green-50" : ""}`}
                  >
                    {/* Position icon */}
                    <div className="w-7 flex items-center justify-center flex-shrink-0">
                      {i === 0 ? (
                        <Trophy size={16} className="text-yellow-500" />
                      ) : i === 1 ? (
                        <Medal size={16} className="text-gray-400" />
                      ) : i === 2 ? (
                        <Medal size={16} className="text-amber-600" />
                      ) : (
                        <span className="text-xs font-bold text-gray-400">
                          {i + 1}
                        </span>
                      )}
                    </div>

                    {/* Tag badge */}
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm ${
                        i === 0
                          ? "bg-yellow-400 text-yellow-900"
                          : i === 1
                            ? "bg-gray-200 text-gray-700"
                            : i === 2
                              ? "bg-amber-200 text-amber-800"
                              : isMe
                                ? "bg-green-500 text-white"
                                : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      #{tag.tag_number}
                    </div>

                    {/* Avatar + name */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${isMe ? "bg-green-500" : "bg-gray-400"}`}
                      >
                        {tag.profiles?.avatar_url ? (
                          <img
                            src={tag.profiles.avatar_url}
                            className="w-full h-full rounded-full object-cover"
                            alt=""
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <p
                        className={`text-sm font-semibold truncate ${isMe ? "text-green-700" : "text-gray-900"}`}
                      >
                        {name}
                        {isMe && (
                          <span className="text-green-500 text-xs ml-1">
                            (you)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Unclaimed tags */}
            {unclaimed.length > 0 && (
              <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                <p className="text-xs text-gray-400 font-medium">
                  {unclaimed.length} unassigned tag
                  {unclaimed.length > 1 ? "s" : ""}:{" "}
                  {unclaimed
                    .slice(0, 8)
                    .map((t: any) => `#${t.tag_number}`)
                    .join(", ")}
                  {unclaimed.length > 8 ? "..." : ""}
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Recent transfers */}
      {history && (history as any[]).length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Recent Tag Transfers
          </h2>
          <div className="space-y-2">
            {(history as any[]).map((h: any) => (
              <div
                key={h.id}
                className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-black text-orange-700">
                    #{h.bag_tags?.tag_number}
                  </span>
                </div>
                <div className="flex-1 min-w-0 text-xs text-gray-600">
                  {h.from_profile ? (
                    <span>
                      <strong>
                        {h.to_profile?.full_name ?? h.to_profile?.username}
                      </strong>{" "}
                      took tag from{" "}
                      <strong>
                        {h.from_profile?.full_name ?? h.from_profile?.username}
                      </strong>
                    </span>
                  ) : (
                    <span>
                      Tag assigned to{" "}
                      <strong>
                        {h.to_profile?.full_name ?? h.to_profile?.username}
                      </strong>
                    </span>
                  )}
                  <p className="text-gray-400 mt-0.5">
                    {new Date(h.transferred_at).toLocaleDateString("en-NZ", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {h.notes && ` · ${h.notes}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
