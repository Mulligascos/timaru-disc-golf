import { Trophy, Medal } from "lucide-react";

interface LeaderboardProps {
  scorecards: any[];
  rounds: any[];
  format: string;
}

export function Leaderboard({ scorecards, rounds, format }: LeaderboardProps) {
  // Aggregate total scores per player across all rounds
  const playerMap: Record<
    string,
    { profile: any; total: number; rounds: number; dnf: boolean }
  > = {};

  for (const sc of scorecards) {
    const pid = sc.player_id;
    if (!playerMap[pid]) {
      playerMap[pid] = {
        profile: sc.profiles,
        total: 0,
        rounds: 0,
        dnf: false,
      };
    }
    if (sc.dnf) {
      playerMap[pid].dnf = true;
    } else if (sc.total_score != null) {
      playerMap[pid].total += sc.total_score;
      playerMap[pid].rounds += 1;
    }
  }

  const entries = Object.entries(playerMap)
    .map(([pid, data]) => ({ pid, ...data }))
    .sort((a, b) => {
      if (a.dnf && !b.dnf) return 1;
      if (!a.dnf && b.dnf) return -1;
      return a.total - b.total;
    });

  const positionIcon = (i: number) => {
    if (i === 0) return <Trophy size={16} className="text-yellow-500" />;
    if (i === 1) return <Medal size={16} className="text-gray-400" />;
    if (i === 2) return <Medal size={16} className="text-amber-600" />;
    return (
      <span className="text-sm font-bold text-gray-400 w-4 text-center">
        {i + 1}
      </span>
    );
  };

  if (entries.length === 0) return null;

  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-900 mb-3">Leaderboard</h2>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto] gap-0 divide-y divide-gray-100">
          {entries.map((entry, i) => (
            <div
              key={entry.pid}
              className={`contents ${i === 0 ? "font-bold" : ""}`}
            >
              <div
                className={`flex items-center justify-center w-10 pl-4 py-3 ${i < 3 ? "" : ""}`}
              >
                {positionIcon(i)}
              </div>
              <div className="flex items-center gap-2 py-3 px-2">
                <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {(entry.profile as any)?.full_name
                    ?.charAt(0)
                    ?.toUpperCase() ??
                    (entry.profile as any)?.username
                      ?.charAt(0)
                      ?.toUpperCase() ??
                    "?"}
                </div>
                <span
                  className={`text-sm ${i === 0 ? "font-bold text-gray-900" : "text-gray-700"}`}
                >
                  {entry.profile?.full_name ?? entry.profile?.username}
                </span>
              </div>
              <div className="flex items-center pr-4 py-3">
                {entry.dnf ? (
                  <span className="text-xs text-red-500 font-medium">DNF</span>
                ) : (
                  <span
                    className={`text-sm font-bold tabular-nums ${i === 0 ? "text-green-600" : "text-gray-700"}`}
                  >
                    {entry.total}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
