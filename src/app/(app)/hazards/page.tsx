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
  const isAdmin = profile?.role === "admin";

  const { data: courses } = await supabase
    .from("courses")
    .select("id, name")
    .eq("is_active", true);

  const { data: hazards } = await supabase
    .from("hazard_reports")
    .select("*, profiles(full_name, username), courses(name)")
    .order("created_at", { ascending: false });

  const open =
    hazards?.filter((h) => ["open", "in_review"].includes(h.status)) ?? [];
  const resolved =
    hazards?.filter((h) => ["resolved", "closed"].includes(h.status)) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hazard Reports</h1>
          <p className="text-gray-500 text-sm mt-1">
            {open.length} open · {resolved.length} resolved
          </p>
        </div>
        <ReportHazardButton userId={user.id} courses={courses ?? []} />
      </div>

      {open.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Open Reports
          </h2>
          <div className="space-y-3">
            {open.map((h) => (
              <HazardCard key={h.id} hazard={h} isAdmin={isAdmin} />
            ))}
          </div>
        </section>
      )}

      {resolved.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Resolved
          </h2>
          <div className="space-y-3">
            {resolved.map((h) => (
              <HazardCard key={h.id} hazard={h} isAdmin={isAdmin} />
            ))}
          </div>
        </section>
      )}

      {(!hazards || hazards.length === 0) && (
        <div className="text-center py-16">
          <AlertTriangle size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="font-semibold text-gray-600">No hazard reports</p>
          <p className="text-sm text-gray-400 mt-1">
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
  const reporter = h.profiles?.full_name ?? h.profiles?.username ?? "Unknown";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
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

        <p className="text-sm text-gray-800 leading-relaxed">{h.description}</p>

        <div className="text-xs text-gray-400 space-y-0.5">
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

        {isAdmin && (
          <AdminHazardActions hazardId={h.id} currentStatus={h.status} />
        )}
      </div>
    </div>
  );
}

function AdminHazardActions({
  hazardId,
  currentStatus,
}: {
  hazardId: string;
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
        await supabase
          .from("hazard_reports")
          .update({
            status: next,
            ...(next === "resolved"
              ? { resolved_at: new Date().toISOString() }
              : {}),
          })
          .eq("id", hazardId);
      }}
    >
      <button
        type="submit"
        className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
      >
        → Mark as {next === "in_review" ? "In Review" : "Resolved"}
      </button>
    </form>
  );
}
