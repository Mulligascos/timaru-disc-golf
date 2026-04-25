import { PageSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="px-4 py-6 max-w-4xl mx-auto">
      <PageSkeleton />
    </div>
  );
}
