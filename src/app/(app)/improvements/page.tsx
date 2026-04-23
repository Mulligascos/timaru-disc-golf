import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Lightbulb } from "lucide-react";
import { NewImprovementButton } from "@/components/improvements/new-improvement-button";
import { UpvoteButton } from "@/components/improvements/upvote-button";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Improvements" };

const statusConfig: Record<string, { colour: string; label: string }> = {
  open: { colour: "bg-blue-100 text-blue-700", label: "Open" },
  in_review: { colour: "bg-yellow-100 text-yellow-700", label: "In Review" },
  resolved: { colour: "bg-green-100 text-green-700", label: "Done ✓" },
  closed: { colour: "bg-gray-100 text-gray-500", label: "Closed" },
};

export default async function ImprovementsPage() {
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

  const { data: courses } = await supabase
    .from("courses")
    .select("id, name")
    .eq("is_active", true);

  const { data: requests } = await supabase
    .from("improvement_requests")
    .select(
      "*, profiles(full_name, username), courses(name), improvement_upvotes(member_id)",
    )
    .order("upvote_count", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Improvements</h1>
          <p className="text-gray-500 text-sm mt-1">
            Suggest and vote on course improvements
          </p>
        </div>
        <NewImprovementButton userId={user.id} courses={courses ?? []} />
      </div>

      {requests && requests.length > 0 ? (
        <div className="space-y-3">
          {(requests as any[]).map((r: any) => {
            const sta = statusConfig[r.status] ?? statusConfig.open;
            const hasUpvoted = (r.improvement_upvotes ?? []).some(
              (u: any) => u.member_id === user.id,
            );
            const submitter =
              r.profiles?.full_name ?? r.profiles?.username ?? "Unknown";

            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
              >
                {r.photo_url && (
                  <img
                    src={r.photo_url}
                    alt="Improvement"
                    className="w-full h-40 object-cover"
                  />
                )}
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    {/* Upvote */}
                    <UpvoteButton
                      requestId={r.id}
                      userId={user.id}
                      count={r.upvote_count}
                      hasUpvoted={hasUpvoted}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-gray-900 text-sm">
                          {r.title}
                        </h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${sta.colour}`}
                        >
                          {sta.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {r.description}
                      </p>
                      <div className="text-xs text-gray-400 mt-2 space-y-0.5">
                        {r.courses?.name && <p>📍 {r.courses.name}</p>}
                        <p>
                          By {submitter} ·{" "}
                          {new Date(r.created_at).toLocaleDateString("en-NZ", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {r.admin_notes && (
                    <div className="bg-green-50 rounded-xl p-3 text-xs text-green-700">
                      <span className="font-semibold">Admin note: </span>
                      {r.admin_notes}
                    </div>
                  )}

                  {isAdmin &&
                    r.status !== "resolved" &&
                    r.status !== "closed" && (
                      <AdminImprovementActions
                        requestId={r.id}
                        currentStatus={r.status}
                      />
                    )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <Lightbulb size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="font-semibold text-gray-600">No suggestions yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Have an idea to improve the course? Share it here.
          </p>
        </div>
      )}
    </div>
  );
}

function AdminImprovementActions({
  requestId,
  currentStatus,
}: {
  requestId: string;
  currentStatus: string;
}) {
  const next =
    currentStatus === "open"
      ? "in_review"
      : currentStatus === "in_review"
        ? "resolved"
        : null;
  if (!next) return null;

  return (
    <form
      action={async () => {
        "use server";
        const { createClient } = await import("@/lib/supabase/server");
        const supabase = await createClient();
        await (supabase as any)
          .from("improvement_requests")
          .update({
            status: next,
            ...(next === "resolved"
              ? { resolved_at: new Date().toISOString() }
              : {}),
          })
          .eq("id", requestId);
      }}
    >
      <button
        type="submit"
        className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
      >
        → Mark as {next === "in_review" ? "In Review" : "Done"}
      </button>
    </form>
  );
}
