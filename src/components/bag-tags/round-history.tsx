import { History, MapPin } from "lucide-react";

interface RoundHistoryProps {
  history: any[];
}

export function RoundHistory({ history }: RoundHistoryProps) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Recent Rounds
      </h2>
      <div className="space-y-2">
        {history.map((h) => (
          <div
            key={h.id}
            className="bg-white rounded-xl border border-gray-200 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <History
                  size={14}
                  className="text-gray-400 flex-shrink-0 mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Round recorded by{" "}
                    {h.challenger?.full_name ?? h.challenger?.username}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                    {h.played_on && (
                      <span>
                        {new Date(h.played_on).toLocaleDateString("en-NZ", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                    {h.courses?.name && (
                      <span className="flex items-center gap-1">
                        <MapPin size={10} /> {h.courses.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {h.tag_swapped && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                  Tags swapped
                </span>
              )}
            </div>
            {h.notes && (
              <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg p-2 font-mono">
                {h.notes}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
