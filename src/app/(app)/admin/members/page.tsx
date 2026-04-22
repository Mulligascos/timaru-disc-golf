import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { MemberRoleToggle } from "@/components/admin/member-role-toggle";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Members" };

export default async function AdminMembersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: members } = await supabase
    .from("profiles")
    .select("*, bag_tags(tag_number)")
    .order("full_name", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-500 text-sm">
            {members?.length ?? 0} total members
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        {members?.map((m) => (
          <div key={m.id} className="flex items-center gap-3 p-4">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                m.role === "admin" ? "bg-green-500" : "bg-gray-400"
              }`}
            >
              {(m.full_name ?? m.username)?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">
                {m.full_name ?? m.username}
              </p>
              <p className="text-xs text-gray-400 truncate">{m.username}</p>
              {(m as any).bag_tags?.tag_number && (
                <p className="text-xs text-orange-500 font-medium">
                  Tag #{(m as any).bag_tags.tag_number}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {m.role === "admin" && (
                <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-1 rounded-full">
                  Admin
                </span>
              )}
              {m.id !== user.id && (
                <MemberRoleToggle memberId={m.id} currentRole={m.role} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
