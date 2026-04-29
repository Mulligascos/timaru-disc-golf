import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { ReportHazardButton } from "@/components/hazards/report-hazard-button";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Hazard Reports" };

const severityConfig: Record<string, { colour: string; label: string }> = {
  low: { colour: "bg-yellow-100 text-yellow-700", label: "Low" },
  medium: { colour: "bg-orange-100 text-orange-700", label: "Medium" },
  high: { colour: "bg-red-100 text-red-700", label: "High" },
};
const statusConfig: Record<string, { colour: string; label: string }> = {
  open: { colour: "bg-red-100 text-red-700", label: "Open" },
  in_review: { colour: "bg-blue-100 text-blue-700", label: "In Review" },
  resolved: { colour: "bg-green-100 text-green-700", label: "Resolved" },
  closed: { colour: "bg-gray-100 text-gray-500", label: "Closed" },
};

export default async function HazardsPage() {
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
  const { data: hazards } = await supabase
    .from("hazard_reports")
    .select(
      "*, reporter:profiles!hazard_reports_reported_by_fkey(full_name, username, nickname), courses(name)",
    )
    .order("created_at", { ascending: false });

  const open =
    (hazards as any[])?.filter((h: any) =>
      ["open", "in_review"].includes(h.status),
    ) ?? [];
  const resolved =
    (hazards as any[])?.filter((h: any) =>
      ["resolved", "closed"].includes(h.status),
    ) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Hazard Reports
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--text-secondary)" }}
          >
            {open.length} open · {resolved.length} resolved
          </p>
        </div>
        <ReportHazardButton userId={user.id} courses={courses ?? []} />
      </div>

      {open.length > 0 && (
        <section>
          <h2
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: "var(--text-secondary)" }}
          >
            Open Reports
          </h2>
          <div className="space-y-3">
            {open.map((h: any) => (
              <HazardCard key={h.id} hazard={h} isAdmin={isAdmin} />
            ))}
          </div>
        </section>
      )}
      {resolved.length > 0 && (
        <section>
          <h2
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: "var(--text-secondary)" }}
          >
            Resolved
          </h2>
          <div className="space-y-3">
            {resolved.map((h: any) => (
              <HazardCard key={h.id} hazard={h} isAdmin={isAdmin} />
            ))}
          </div>
        </section>
      )}
      {(!hazards || hazards.length === 0) && (
        <div className="text-center py-16">
          <AlertTriangle
            size={48}
            className="mx-auto mb-4"
            style={{ color: "var(--border-colour)" }}
          />
          <p
            className="font-semibold"
            style={{ color: "var(--text-secondary)" }}
          >
            No hazard reports
          </p>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--text-secondary)" }}
          >
            Spot something dangerous on course? Report it here.
          </p>
        </div>
      )}
    </div>
  );
}

function HazardCard({ hazard: h, isAdmin }: { hazard: any; isAdmin: boolean }) {
  const sev = severityConfig[h.severity] ?? severityConfig.medium;
  const sta = statusConfig[h.status] ?? statusConfig.open;
  const reporter =
    h.reporter?.nickname ??
    h.reporter?.full_name ??
    h.reporter?.username ??
    "Unknown";
  const next =
    h.status === "open"
      ? "in_review"
      : h.status === "in_review"
        ? "resolved"
        : null;

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-colour)",
      }}
    >
      {h.photo_url && (
        <img
          src={h.photo_url}
          alt="Hazard"
          className="w-full h-40 object-cover"
        />
      )}
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-2 flex-wrap">
          <span
            className={`text-xs px-2 py-1 rounded-full font-semibold ${sev.colour}`}
          >
            ⚠️ {sev.label} Severity
          </span>
          <span
            className={`text-xs px-2 py-1 rounded-full font-semibold ${sta.colour}`}
          >
            {sta.label}
          </span>
        </div>
        <p
          className="text-sm leading-relaxed"
          style={{ color: "var(--text-primary)" }}
        >
          {h.description}
        </p>
        <div
          className="text-xs space-y-0.5"
          style={{ color: "var(--text-secondary)" }}
        >
          {h.courses?.name && (
            <p>
              📍 {h.courses.name}
              {h.hole_number ? ` · Hole ${h.hole_number}` : ""}
            </p>
          )}
          <p>
            Reported by {reporter} ·{" "}
            {new Date(h.created_at).toLocaleDateString("en-NZ", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        {h.admin_notes && (
          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
            <span className="font-semibold">Admin note: </span>
            {h.admin_notes}
          </div>
        )}
        {isAdmin && next && (
          <form
            action={async () => {
              "use server";
              const { createClient } = await import("@/lib/supabase/server");
              const supabase = await createClient();
              await (supabase as any)
                .from("hazard_reports")
                .update({
                  status: next,
                  ...(next === "resolved"
                    ? { resolved_at: new Date().toISOString() }
                    : {}),
                })
                .eq("id", h.id);
            }}
          >
            <button
              type="submit"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              → Mark as {next === "in_review" ? "In Review" : "Resolved"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
