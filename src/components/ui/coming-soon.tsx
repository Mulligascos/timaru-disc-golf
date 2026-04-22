// ── PLACEHOLDER PAGES ──
// Copy each section below into the matching file path
// These prevent 404s while we build out each feature

// ─────────────────────────────────────────────
// src/app/(app)/tournaments/page.tsx
// ─────────────────────────────────────────────
/*
import { Trophy } from 'lucide-react'
export default function TournamentsPage() {
  return <ComingSoon icon="🏆" title="Tournaments" description="Create and manage club tournaments, leagues, and scorecards." />
}
*/

// ─────────────────────────────────────────────
// src/app/(app)/bag-tags/page.tsx
// ─────────────────────────────────────────────
/*
export default function BagTagsPage() {
  return <ComingSoon icon="🏷️" title="Bag Tags" description="Track physical bag tag challenges and leaderboard." />
}
*/

// Use this shared component in all placeholder pages:
export function ComingSoon({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center py-16">
      <p className="text-5xl mb-4">{icon}</p>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <p className="text-gray-500 mt-2 max-w-sm mx-auto">{description}</p>
      <p className="text-xs text-gray-400 mt-6 bg-gray-100 inline-block px-3 py-1.5 rounded-full">
        Coming soon
      </p>
    </div>
  );
}
