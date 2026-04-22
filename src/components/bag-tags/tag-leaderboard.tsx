import { Trophy, Medal, Tag } from "lucide-react";

interface TagLeaderboardProps {
  tags: any[];
  currentUserId: string;
}

export function TagLeaderboard({ tags, currentUserId }: TagLeaderboardProps) {
  const claimed = tags.filter((t) => t.holder_id);
  const unclaimed = tags.filter((t) => !t.holder_id);

  if (tags.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <Tag size={40} className="mx-auto text-gray-300 mb-3" />
        <p className="font-semibold text-gray-600">No bag tags set up yet</p>
        <p className="text-sm text-gray-400 mt-1">
          Ask your admin to create bag tags.
        </p>
      </div>
    );
  }

  const posIcon = (i: number) => {
    if (i === 0) return <Trophy size={16} className="text-yellow-500" />;
    if (i === 1) return <Medal size={16} className="text-gray-400" />;
    if (i === 2) return <Medal size={16} className="text-amber-600" />;
    return null;
  };

  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Tag Leaderboard
      </h2>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {claimed.map((tag, i) => {
            const isMe = tag.holder_id === currentUserId;
            const name =
              tag.profiles?.full_name ?? tag.profiles?.username ?? "Unknown";
            const initials = name.charAt(0).toUpperCase();

            return (
              <div
                key={tag.id}
                className={`flex items-center gap-3 px-4 py-3 ${isMe ? "bg-green-50" : ""}`}
              >
                {/* Position */}
                <div className="w-8 flex items-center justify-center flex-shrink-0">
                  {posIcon(i) ?? (
                    <span className="text-xs font-bold text-gray-400">
                      {i + 1}
                    </span>
                  )}
                </div>

                {/* Tag number badge */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm ${
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
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                      isMe ? "bg-green-500" : "bg-gray-400"
                    }`}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
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
              </div>
            );
          })}
        </div>

        {unclaimed.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
            <p className="text-xs text-gray-400 font-medium">
              {unclaimed.length} unclaimed tag{unclaimed.length > 1 ? "s" : ""}:{" "}
              {unclaimed.map((t) => `#${t.tag_number}`).join(", ")}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
