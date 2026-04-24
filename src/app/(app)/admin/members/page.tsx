import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, UserCheck, UserX } from "lucide-react";
import { InviteMemberForm } from "@/components/admin/invite-member-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Members" };
export const dynamic = "force-dynamic";

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
  if ((profile as any)?.role !== "admin") redirect("/dashboard");

  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name, username, email, role, is_active, created_at")
    .order("full_name", { ascending: true });

  const allMembers = (members as any[]) ?? [];
  const activeMembers = allMembers.filter((m) => m.is_active);
  const inactiveMembers = allMembers.filter((m) => !m.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-500 text-sm">
            {activeMembers.length} active · {inactiveMembers.length} inactive
          </p>
        </div>
      </div>

      {/* Invite new member */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-1">Invite New Member</h2>
        <p className="text-xs text-gray-500 mb-4">
          Send an invitation email to a new member. They will receive a link to
          set their password and complete their profile.
        </p>
        <InviteMemberForm />
      </div>

      {/* Active members */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Active Members
          </p>
          <p className="text-xs text-gray-400">{activeMembers.length} total</p>
        </div>
        <div className="divide-y divide-gray-100">
          {activeMembers.length === 0 ? (
            <div className="p-8 text-center">
              <UserCheck size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No active members yet</p>
            </div>
          ) : (
            activeMembers.map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {(m.full_name ?? m.username ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {m.full_name ?? m.username ?? "Unknown"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {m.email ?? `@${m.username}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {m.role === "admin" && (
                    <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                  <ToggleMemberForm
                    memberId={m.id}
                    isActive={true}
                    currentRole={m.role}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Inactive members */}
      {inactiveMembers.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Inactive Members
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {inactiveMembers.map((m: any) => (
              <div
                key={m.id}
                className="flex items-center gap-3 px-4 py-3 opacity-60"
              >
                <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {(m.full_name ?? m.username ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700 truncate">
                    {m.full_name ?? m.username ?? "Unknown"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {m.email ?? `@${m.username}`}
                  </p>
                </div>
                <ToggleMemberForm
                  memberId={m.id}
                  isActive={false}
                  currentRole={m.role}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleMemberForm({
  memberId,
  isActive,
  currentRole,
}: {
  memberId: string;
  isActive: boolean;
  currentRole: string;
}) {
  return (
    <form
      action={async () => {
        "use server";
        const { createClient } = await import("@/lib/supabase/server");
        const supabase = await createClient();
        await (supabase as any)
          .from("profiles")
          .update({ is_active: !isActive })
          .eq("id", memberId);
      }}
    >
      <button
        type="submit"
        className={`text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
          isActive
            ? "text-red-500 hover:text-red-600 hover:bg-red-50"
            : "text-green-600 hover:text-green-700 hover:bg-green-50"
        }`}
      >
        {isActive ? "Deactivate" : "Reactivate"}
      </button>
    </form>
  );
}
