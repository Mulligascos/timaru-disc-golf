export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero skeleton */}
      <div className="bg-gray-200 rounded-2xl h-32" />

      {/* Title skeleton */}
      <div className="space-y-2">
        <div className="bg-gray-200 rounded-lg h-4 w-24" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-xl h-20" />
          ))}
        </div>
      </div>

      {/* List skeleton */}
      <div className="space-y-2">
        <div className="bg-gray-200 rounded-lg h-4 w-32" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-xl h-16" />
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="bg-gray-200 rounded-lg h-6 w-40" />
        <div className="bg-gray-200 rounded-lg h-4 w-24" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {[...Array(rows)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="bg-gray-200 rounded h-3.5 w-1/2" />
              <div className="bg-gray-200 rounded h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
