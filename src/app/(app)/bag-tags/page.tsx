import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TagLeaderboard } from "@/components/bag-tags/tag-leaderboard";
import { ClaimTag } from "@/components/bag-tags/claim-tag";
import { StartRoundButton } from "@/components/bag-tags/start-round-button";
import { RoundHistory } from "@/components/bag-tags/round-history";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Bag Tags" };

export default async function BagTagsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, bag_tags(id, tag_number)")
    .eq("id", user.id)
    .single();

  // All active tags with holder info
  const { data: tags } = await supabase
    .from("bag_tags")
    .select("*, profiles(id, username, full_name, avatar_url)")
    .eq("is_active", true)
    .order("tag_number", { ascending: true });

  // All active members (for round setup)
  const { data: allMembers } = await supabase
    .from("profiles")
    .select("id, username, full_name, current_tag_id, bag_tags(id, tag_number)")
    .eq("is_active", true);

  // Courses
  const { data: courses } = await supabase
    .from("courses")
    .select("id, name")
    .eq("is_active", true);

  // Recent tag history (completed rounds)
  const { data: history } = await supabase
    .from("tag_challenges")
    .select(
      `
      *,
      challenger:profiles!tag_challenges_challenger_id_fkey(id, username, full_name),
      courses(name)
    `,
    )
    .eq("status", "completed")
    .order("played_on", { ascending: false })
    .limit(10);

  const myTag = (profile as any)?.bag_tags;
  const unclaimedTags = tags?.filter((t) => !(t as any).holder_id) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bag Tags</h1>
          <p className="text-gray-500 text-sm mt-1">
            Play rounds, earn lower numbers
          </p>
        </div>
        <StartRoundButton
          userId={user.id}
          members={allMembers ?? []}
          courses={courses ?? []}
          tags={tags ?? []}
        />
      </div>

      {/* My tag */}
      {myTag ? (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">
            Your Bag Tag
          </p>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-green-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-2xl font-black">
                #{myTag.tag_number}
              </span>
            </div>
            <div>
              <p className="text-white font-bold text-xl">
                Tag #{myTag.tag_number}
              </p>
              <p className="text-gray-400 text-sm mt-0.5">
                {myTag.tag_number === 1
                  ? "👑 Club champion!"
                  : myTag.tag_number <= 3
                    ? "🔥 Top 3 — keep it up!"
                    : "Play rounds to move up the leaderboard"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <ClaimTag unclaimedTags={unclaimedTags} userId={user.id} />
      )}

      {/* Leaderboard */}
      <TagLeaderboard tags={tags ?? []} currentUserId={user.id} />

      {/* Round history */}
      {history && history.length > 0 && <RoundHistory history={history} />}
    </div>
  );
}
