// ============================================================
// ADMIN COMPONENTS
// Save each export as its own file in src/components/admin/
// ============================================================

// ── member-role-toggle.tsx ──────────────────────────────────
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function MemberRoleToggle({
  memberId,
  currentRole,
}: {
  memberId: string;
  currentRole: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isAdmin = currentRole === "admin";

  async function toggle() {
    setLoading(true);
    await (supabase as any)
      .from("profiles")
      .update({ role: isAdmin ? "member" : "admin" })
      .eq("id", memberId);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
        isAdmin
          ? "bg-red-50 text-red-600 hover:bg-red-100"
          : "bg-green-50 text-green-600 hover:bg-green-100"
      }`}
    >
      {loading ? "..." : isAdmin ? "Remove Admin" : "Make Admin"}
    </button>
  );
}
