import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Megaphone, Pin } from "lucide-react";
import { NewAnnouncementButton } from "@/components/announcements/new-announcement-button";
import { AnnouncementActions } from "@/components/announcements/announcement-actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Announcements" };
export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
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

  const isAdmin = (profile as any)?.role === "admin";

  const { data: announcements } = await supabase
    .from("announcements")
    .select("*, profiles(full_name, username)")
    .lte("published_at", new Date().toISOString())
    .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false });

  const { data: drafts } = isAdmin
    ? await supabase
        .from("announcements")
        .select("*, profiles(full_name, username)")
        .is("published_at", null)
        .order("created_at", { ascending: false })
    : { data: null };

  function AnnouncementCard({
    a,
    isDraft = false,
  }: {
    a: any;
    isDraft?: boolean;
  }) {
    const author = a.profiles?.full_name ?? a.profiles?.username ?? "Admin";
    const date = a.published_at ?? a.created_at;
    return (
      <div
        className={`bg-white rounded-2xl border overflow-hidden ${
          a.is_pinned
            ? "border-green-300"
            : isDraft
              ? "border-dashed border-gray-300"
              : "border-gray-200"
        }`}
      >
        {a.is_pinned && (
          <div className="bg-green-500 px-4 py-1.5 flex items-center gap-1.5">
            <Pin size={12} className="text-white" />
            <span className="text-white text-xs font-semibold">Pinned</span>
          </div>
        )}
        {isDraft && (
          <div className="bg-gray-100 px-4 py-1.5">
            <span className="text-gray-500 text-xs font-semibold">
              Draft — not published
            </span>
          </div>
        )}
        <div className="p-5">
          <h3 className="font-bold text-gray-900">{a.title}</h3>
          <p className="text-gray-600 text-sm mt-2 leading-relaxed whitespace-pre-wrap">
            {a.body}
          </p>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              {author} ·{" "}
              {new Date(date).toLocaleDateString("en-NZ", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
            <div className="flex items-center gap-2">
              {a.expires_at && (
                <p className="text-xs text-orange-500">
                  Expires{" "}
                  {new Date(a.expires_at).toLocaleDateString("en-NZ", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              )}
              {isAdmin && (
                <AnnouncementActions
                  id={a.id}
                  title={a.title}
                  body={a.body}
                  isPinned={a.is_pinned}
                  isDraft={isDraft}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-500 text-sm mt-1">Club news and updates</p>
        </div>
        {isAdmin && <NewAnnouncementButton />}
      </div>

      {isAdmin && drafts && drafts.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Drafts
          </h2>
          <div className="space-y-3">
            {(drafts as any[]).map((a: any) => (
              <AnnouncementCard key={a.id} a={a} isDraft />
            ))}
          </div>
        </section>
      )}

      {announcements && announcements.length > 0 ? (
        <div className="space-y-3">
          {(announcements as any[]).map((a: any) => (
            <AnnouncementCard key={a.id} a={a} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Megaphone size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="font-semibold text-gray-600">No announcements yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Check back later for club news.
          </p>
        </div>
      )}
    </div>
  );
}
