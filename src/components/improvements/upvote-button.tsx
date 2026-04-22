"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ChevronUp } from "lucide-react";

interface UpvoteButtonProps {
  requestId: string;
  userId: string;
  count: number;
  hasUpvoted: boolean;
}

export function UpvoteButton({
  requestId,
  userId,
  count,
  hasUpvoted: initial,
}: UpvoteButtonProps) {
  const supabase = createClient();
  const router = useRouter();
  const [hasUpvoted, setHasUpvoted] = useState(initial);
  const [localCount, setLocalCount] = useState(count);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    if (hasUpvoted) {
      await supabase
        .from("improvement_upvotes")
        .delete()
        .eq("request_id", requestId)
        .eq("member_id", userId);
      setHasUpvoted(false);
      setLocalCount((c) => c - 1);
    } else {
      await supabase
        .from("improvement_upvotes")
        .insert({ request_id: requestId, member_id: userId });
      setHasUpvoted(true);
      setLocalCount((c) => c + 1);
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl border-2 transition-all min-w-[44px] flex-shrink-0 disabled:opacity-50 ${
        hasUpvoted
          ? "border-green-400 bg-green-50 text-green-600"
          : "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600"
      }`}
    >
      <ChevronUp size={18} strokeWidth={2.5} />
      <span className="text-xs font-bold tabular-nums">{localCount}</span>
    </button>
  );
}
