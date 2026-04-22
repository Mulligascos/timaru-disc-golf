import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CreateTagsForm } from "@/components/admin/create-tags-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Bag Tags" };

export default async function AdminBagTagsPage() {
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

  const { data: tags } = await supabase
    .from("bag_tags")
    .select("*, profiles(full_name, username)")
    .order("tag_number", { ascending: true });

  const claimed = tags?.filter((t) => t.holder_id) ?? [];
  const unclaimed = tags?.filter((t) => !t.holder_id) ?? [];
  const maxTag = tags?.reduce((max, t) => Math.max(max, t.tag_number), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bag Tags</h1>
          <p className="text-gray-500 text-sm">
            {claimed.length} claimed · {unclaimed.length} unclaimed
          </p>
        </div>
      </div>

      {/* Create tags */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Create Tags</h2>
        <CreateTagsForm currentMax={maxTag} />
      </div>

      {/* All tags */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            All Tags
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {tags?.map((tag) => (
            <div key={tag.id} className="flex items-center gap-3 px-4 py-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                  tag.holder_id
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                #{tag.tag_number}
              </div>
              <div className="flex-1 min-w-0">
                {tag.holder_id ? (
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {(tag as any).profiles?.full_name ??
                      (tag as any).profiles?.username ??
                      "Unknown"}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 italic">Unclaimed</p>
                )}
              </div>
              {tag.holder_id && <ReleaseTagForm tagId={tag.id} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReleaseTagForm({ tagId }: { tagId: string }) {
  return (
    <form
      action={async () => {
        "use server";
        const { createClient } = await import("@/lib/supabase/server");
        const supabase = await createClient();
        const { data: tag } = await supabase
          .from("bag_tags")
          .select("holder_id")
          .eq("id", tagId)
          .single();
        if (tag?.holder_id) {
          await supabase
            .from("profiles")
            .update({ current_tag_id: null })
            .eq("id", tag.holder_id);
        }
        await supabase
          .from("bag_tags")
          .update({ holder_id: null })
          .eq("id", tagId);
      }}
    >
      <button
        type="submit"
        className="text-xs text-red-500 hover:text-red-600 font-medium"
      >
        Release
      </button>
    </form>
  );
}
