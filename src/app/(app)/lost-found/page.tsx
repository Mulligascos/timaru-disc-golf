import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Disc, MapPin, Calendar } from "lucide-react";
import { ReportDiscButton } from "@/components/lost-found/report-disc-button";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Lost & Found" };

const statusColour: Record<string, string> = {
  lost: "bg-red-100 text-red-700",
  found: "bg-blue-100 text-blue-700",
  reunited: "bg-green-100 text-green-700",
};

export default async function LostFoundPage() {
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
  const { data: courses } = await supabase
    .from("courses")
    .select("id, name")
    .eq("is_active", true);
  const { data: lostDiscs } = await supabase
    .from("lost_discs")
    .select("*, profiles(username, full_name), courses(name)")
    .neq("status", "reunited")
    .order("created_at", { ascending: false });
  const { data: foundDiscs } = await supabase
    .from("found_discs")
    .select("*, profiles(username, full_name), courses(name)")
    .neq("status", "reunited")
    .order("created_at", { ascending: false });
  const { data: reunitedDiscs } = await supabase
    .from("lost_discs")
    .select("*, profiles(username, full_name), courses(name)")
    .eq("status", "reunited")
    .order("updated_at", { ascending: false })
    .limit(5);

  function DiscCard({ disc, type }: { disc: any; type: "lost" | "found" }) {
    const name =
      disc.profiles?.full_name ?? disc.profiles?.username ?? "Unknown";
    const isOwn = disc.reported_by === user!.id;

    return (
      <div
        className="rounded-xl border overflow-hidden"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-colour)",
        }}
      >
        <div className="flex gap-3 p-4">
          <div
            className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center"
            style={{ background: "var(--bg-primary)" }}
          >
            {disc.photo_url ? (
              <img
                src={disc.photo_url}
                alt="Disc"
                className="w-full h-full object-cover"
              />
            ) : (
              <Disc size={24} style={{ color: "var(--border-colour)" }} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColour[disc.status]}`}
              >
                {disc.status.charAt(0).toUpperCase() + disc.status.slice(1)}
              </span>
              {isOwn && (
                <span
                  className="text-xs font-medium"
                  style={{ color: "var(--accent-600)" }}
                >
                  Your report
                </span>
              )}
            </div>
            <p
              className="font-semibold text-sm"
              style={{ color: "var(--text-primary)" }}
            >
              {[disc.disc_brand, disc.disc_mold, disc.disc_colour]
                .filter(Boolean)
                .join(" · ") || "Unknown disc"}
            </p>
            {disc.markings && (
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Markings: {disc.markings}
              </p>
            )}
            <div
              className="flex items-center gap-3 mt-1.5 text-xs flex-wrap"
              style={{ color: "var(--text-secondary)" }}
            >
              {disc.courses?.name && (
                <span className="flex items-center gap-1">
                  <MapPin size={10} /> {disc.courses.name}
                  {disc.hole_number && ` · Hole ${disc.hole_number}`}
                </span>
              )}
              {(disc.lost_on ?? disc.found_on) && (
                <span className="flex items-center gap-1">
                  <Calendar size={10} />
                  {new Date(disc.lost_on ?? disc.found_on).toLocaleDateString(
                    "en-NZ",
                    { day: "numeric", month: "short" },
                  )}
                </span>
              )}
            </div>
            <p
              className="text-xs mt-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Reported by {name}
            </p>
          </div>
        </div>
        {type === "found" && (
          <div
            className="border-t px-4 py-2.5 flex items-center justify-between"
            style={{ borderColor: "var(--border-colour)" }}
          >
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Is this your disc?
            </p>
            <a
              href={`mailto:?subject=Found disc at ${disc.courses?.name ?? "the course"}`}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Contact{" "}
              {disc.profiles?.full_name ?? disc.profiles?.username ?? "finder"}{" "}
              →
            </a>
          </div>
        )}
        {type === "lost" && (profile as any)?.role === "admin" && (
          <div
            className="border-t px-4 py-2.5"
            style={{ borderColor: "var(--border-colour)" }}
          >
            <form
              action={async () => {
                "use server";
                const { createClient } = await import("@/lib/supabase/server");
                const supabase = await createClient();
                await (supabase as any)
                  .from("lost_discs")
                  .update({ status: "reunited" })
                  .eq("id", disc.id);
              }}
            >
              <button
                type="submit"
                className="text-xs text-green-600 font-semibold hover:text-green-700"
              >
                ✓ Mark as reunited
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Lost & Found
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--text-secondary)" }}
          >
            {lostDiscs?.length ?? 0} lost · {foundDiscs?.length ?? 0} found
          </p>
        </div>
        <ReportDiscButton userId={user.id} courses={courses ?? []} />
      </div>

      {foundDiscs && foundDiscs.length > 0 && (
        <section>
          <h2
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: "var(--text-secondary)" }}
          >
            Found Discs 🔵
          </h2>
          <div className="space-y-3">
            {(foundDiscs as any[]).map((d: any) => (
              <DiscCard key={d.id} disc={d} type="found" />
            ))}
          </div>
        </section>
      )}

      {lostDiscs && lostDiscs.length > 0 && (
        <section>
          <h2
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: "var(--text-secondary)" }}
          >
            Lost Discs 🔴
          </h2>
          <div className="space-y-3">
            {(lostDiscs as any[]).map((d: any) => (
              <DiscCard key={d.id} disc={d} type="lost" />
            ))}
          </div>
        </section>
      )}

      {reunitedDiscs && reunitedDiscs.length > 0 && (
        <section>
          <h2
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: "var(--text-secondary)" }}
          >
            Recently Reunited ✅
          </h2>
          <div className="space-y-3">
            {(reunitedDiscs as any[]).map((d: any) => (
              <DiscCard key={d.id} disc={d} type="lost" />
            ))}
          </div>
        </section>
      )}

      {(!lostDiscs || lostDiscs.length === 0) &&
        (!foundDiscs || foundDiscs.length === 0) && (
          <div className="text-center py-16">
            <Disc
              size={48}
              className="mx-auto mb-4"
              style={{ color: "var(--border-colour)" }}
            />
            <p
              className="font-semibold"
              style={{ color: "var(--text-secondary)" }}
            >
              No lost or found discs
            </p>
            <p
              className="text-sm mt-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Lost a disc? Report it here and the club can help.
            </p>
          </div>
        )}
    </div>
  );
}
