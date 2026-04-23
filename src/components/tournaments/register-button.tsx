"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { UserPlus, UserMinus } from "lucide-react";

interface RegisterButtonProps {
  tournamentId: string;
  userId: string;
  isRegistered: boolean;
}

export function RegisterButton({
  tournamentId,
  userId,
  isRegistered: initial,
}: RegisterButtonProps) {
  const supabase = createClient();
  const router = useRouter();
  const [isRegistered, setIsRegistered] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    if (isRegistered) {
      await (supabase as any)
        .from("tournament_registrations")
        .delete()
        .eq("tournament_id", tournamentId)
        .eq("player_id", userId);
      setIsRegistered(false);
    } else {
      await (supabase as any)
        .from("tournament_registrations")
        .insert({ tournament_id: tournamentId, player_id: userId });
      setIsRegistered(true);
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex-1 flex items-center justify-center gap-2 font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 ${
        isRegistered
          ? "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
          : "bg-green-600 hover:bg-green-700 text-white"
      }`}
    >
      {isRegistered ? (
        <>
          <UserMinus size={18} /> Leave Event
        </>
      ) : (
        <>
          <UserPlus size={18} /> Join Event
        </>
      )}
    </button>
  );
}
