import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Tag, Trophy, Medal } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Bag Tags" };
export const dynamic = "force-dynamic";

export default async function BagTagsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const currentSeason = new Date().getFullYear().toString();

  const [
    { data: profile },
    { data: myTag },
    { data: tags },
    { data: history },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("bag_tags")
      .select("id, tag_number, season")
      .eq("holder_id", user.id)
      .eq("is_active", true)
      .eq("season", currentSeason)
      .maybeSingle(),
    supabase
      .from("bag_tags")
      .select(
        "*, holder:profiles!bag_tags_holder_id_fkey(id, username, full_name, nickname, avatar_url)",
      )
      .eq("is_active", true)
      .eq("season", currentSeason)
      .order("tag_number", { ascending: true }),
    supabase
      .from("tag_history")
      .select(
        "*, bag_tags(tag_number), from_profile:profiles!tag_history_from_holder_id_fkey(username, full_name, nickname), to_profile:profiles!tag_history_to_holder_id_fkey(username, full_name, nickname)",
      )
      .order("transferred_at", { ascending: false })
      .limit(10),
  ]);

  const allTags = (tags as any[]) ?? [];
  const claimed = allTags.filter((t) => t.holder_id);
  const unclaimed = allTags.filter((t) => !t.holder_id);

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Bag Tags
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
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
                (myTag as any).tag_number === 1
                  ? "bg-yellow-400"
                  : (myTag as any).tag_number <= 3
                    ? "bg-gray-300"
                    : "bg-green-500"
              }`}
            >
              <span
                className={`text-2xl font-black ${
                  (myTag as any).tag_number === 1
                    ? "text-yellow-900"
                    : (myTag as any).tag_number <= 3
                      ? "text-gray-700"
                      : "text-white"
                }`}
              >
                #{(myTag as any).tag_number}
              </span>
            </div>
            <div>
              <p className="text-white font-bold text-xl">
                Tag #{(myTag as any).tag_number}
              </p>
              <p className="text-gray-400 text-sm mt-0.5">
                {(myTag as any).season} Season
              </p>
              <p className="text-gray-400 text-xs mt-1">
                {(myTag as any).tag_number === 1
                  ? "👑 Club Champion!"
                  : (myTag as any).tag_number <= 3
                    ? "🔥 Top 3!"
                    : "Play rounds to move up"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="rounded-2xl border border-dashed p-6 text-center"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-colour)",
          }}
        >
          <Tag
            size={32}
            className="mx-auto mb-2"
            style={{ color: "var(--border-colour)" }}
          />
          <p
            className="font-semibold text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            No tag assigned yet
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: "var(--text-secondary)" }}
          >
            Contact your admin to get a bag tag for this season.
          </p>
        </div>
      )}

      {/* Leaderboard */}
      <section>
        <h2
          className="text-sm font-semibold uppercase tracking-wide mb-3"
          style={{ color: "var(--text-secondary)" }}
        >
          Current Leaderboard
        </h2>
        {claimed.length === 0 ? (
          <div
            className="rounded-2xl border p-8 text-center"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-colour)",
            }}
          >
            <Tag
              size={40}
              className="mx-auto mb-3"
              style={{ color: "var(--border-colour)" }}
            />
            <p
              className="font-semibold"
              style={{ color: "var(--text-secondary)" }}
            >
              No tags assigned yet
            </p>
            <p
              className="text-sm mt-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Admin assigns tags to members.
            </p>
          </div>
        ) : (
          <div
            className="rounded-2xl border overflow-hidden"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-colour)",
            }}
          >
            {claimed.map((tag: any, i: number) => {
              const isMe = tag.holder_id === user.id;
              const name =
                tag.holder?.nickname ??
                tag.holder?.full_name ??
                tag.holder?.username ??
                "Unknown";
              const initials = name.charAt(0).toUpperCase();

              return (
                <div
                  key={tag.id}
                  className="flex items-center gap-3 px-4 py-3 border-b last:border-0"
                  style={{
                    borderColor: "var(--border-colour)",
                    background: isMe ? "var(--accent-50)" : undefined,
                  }}
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
                      <span
                        className="text-xs font-bold"
                        style={{ color: "var(--text-secondary)" }}
                      >
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
                      {tag.holder?.avatar_url ? (
                        <img
                          src={tag.holder.avatar_url}
                          className="w-full h-full rounded-full object-cover"
                          alt=""
                        />
                      ) : (
                        initials
                      )}
                    </div>
                    <p
                      className="text-sm font-semibold truncate"
                      style={{
                        color: isMe
                          ? "var(--accent-600)"
                          : "var(--text-primary)",
                      }}
                    >
                      {name}
                      {isMe && (
                        <span
                          className="text-xs ml-1"
                          style={{ color: "var(--accent-500)" }}
                        >
                          (you)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Unclaimed tags */}
            {unclaimed.length > 0 && (
              <div
                className="px-4 py-3 border-t"
                style={{
                  borderColor: "var(--border-colour)",
                  background: "var(--bg-primary)",
                }}
              >
                <p
                  className="text-xs font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
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
          <h2
            className="text-sm font-semibold uppercase tracking-wide mb-3"
            style={{ color: "var(--text-secondary)" }}
          >
            Recent Tag Transfers
          </h2>
          <div className="space-y-2">
            {(history as any[]).map((h: any) => {
              const toName =
                h.to_profile?.nickname ??
                h.to_profile?.full_name ??
                h.to_profile?.username;
              const fromName =
                h.from_profile?.nickname ??
                h.from_profile?.full_name ??
                h.from_profile?.username;
              return (
                <div
                  key={h.id}
                  className="rounded-xl border p-3 flex items-center gap-3"
                  style={{
                    background: "var(--bg-card)",
                    borderColor: "var(--border-colour)",
                  }}
                >
                  <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-black text-orange-700">
                      #{h.bag_tags?.tag_number}
                    </span>
                  </div>
                  <div
                    className="flex-1 min-w-0 text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {h.from_profile ? (
                      <span>
                        <strong style={{ color: "var(--text-primary)" }}>
                          {toName}
                        </strong>{" "}
                        took tag from{" "}
                        <strong style={{ color: "var(--text-primary)" }}>
                          {fromName}
                        </strong>
                      </span>
                    ) : (
                      <span>
                        Tag assigned to{" "}
                        <strong style={{ color: "var(--text-primary)" }}>
                          {toName}
                        </strong>
                      </span>
                    )}
                    <p
                      className="mt-0.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {new Date(h.transferred_at).toLocaleDateString("en-NZ", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      {h.notes && ` · ${h.notes}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
