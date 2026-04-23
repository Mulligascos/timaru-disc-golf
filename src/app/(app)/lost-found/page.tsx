import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Disc,
  Plus,
  MapPin,
  Calendar,
  ChevronRight,
  Search,
} from "lucide-react";
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
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex gap-3 p-4">
          {/* Photo or placeholder */}
          <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
            {disc.photo_url ? (
              <img
                src={disc.photo_url}
                alt="Disc"
                className="w-full h-full object-cover"
              />
            ) : (
              <Disc size={24} className="text-gray-300" />
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
                <span className="text-xs text-green-600 font-medium">
                  Your report
                </span>
              )}
            </div>

            <p className="font-semibold text-gray-900 text-sm">
              {[disc.disc_brand, disc.disc_mold, disc.disc_colour]
                .filter(Boolean)
                .join(" · ") || "Unknown disc"}
            </p>

            {disc.markings && (
              <p className="text-xs text-gray-500 mt-0.5">
                Markings: {disc.markings}
              </p>
            )}

            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 flex-wrap">
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

            <p className="text-xs text-gray-400 mt-1">Reported by {name}</p>
          </div>
        </div>

        {/* Contact / actions */}
        {type === "found" && (
          <div
            className={`border-t border-gray-100 px-4 py-2.5 flex items-center justify-between`}
          >
            <p className="text-xs text-gray-500">Is this your disc?</p>
            <ContactButton disc={disc} reportedBy={disc.profiles} />
          </div>
        )}
        {type === "lost" && (profile as any)?.role === "admin" && (
          <div className="border-t border-gray-100 px-4 py-2.5">
            <MarkReunitedButton discId={disc.id} type="lost" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lost & Found</h1>
          <p className="text-gray-500 text-sm mt-1">
            {lostDiscs?.length ?? 0} lost · {foundDiscs?.length ?? 0} found
          </p>
        </div>
        <ReportDiscButton userId={user.id} courses={courses ?? []} />
      </div>

      {/* Found discs */}
      {foundDiscs && foundDiscs.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Found Discs 🔵
          </h2>
          <div className="space-y-3">
            {foundDiscs.map((d) => (
              <DiscCard key={d.id} disc={d} type="found" />
            ))}
          </div>
        </section>
      )}

      {/* Lost discs */}
      {lostDiscs && lostDiscs.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Lost Discs 🔴
          </h2>
          <div className="space-y-3">
            {lostDiscs.map((d) => (
              <DiscCard key={d.id} disc={d} type="lost" />
            ))}
          </div>
        </section>
      )}

      {/* Recently reunited */}
      {reunitedDiscs && reunitedDiscs.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Recently Reunited ✅
          </h2>
          <div className="space-y-3">
            {reunitedDiscs.map((d) => (
              <DiscCard key={d.id} disc={d} type="lost" />
            ))}
          </div>
        </section>
      )}

      {(!lostDiscs || lostDiscs.length === 0) &&
        (!foundDiscs || foundDiscs.length === 0) && (
          <div className="text-center py-16">
            <Disc size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="font-semibold text-gray-600">
              No lost or found discs
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Lost a disc? Report it here and the club can help.
            </p>
          </div>
        )}
    </div>
  );
}

function ContactButton({ disc, reportedBy }: { disc: any; reportedBy: any }) {
  const name = reportedBy?.full_name ?? reportedBy?.username ?? "the finder";
  return (
    <a
      href={`mailto:?subject=Found disc at ${disc.courses?.name ?? "the course"}`}
      className="text-xs text-blue-600 font-semibold hover:text-blue-700"
    >
      Contact {name} →
    </a>
  );
}

function MarkReunitedButton({
  discId,
  type,
}: {
  discId: string;
  type: "lost" | "found";
}) {
  return (
    <form
      action={async () => {
        "use server";
        const { createClient } = await import("@/lib/supabase/server");
        const supabase = await createClient();
        const table = type === "lost" ? "lost_discs" : "found_discs";
        await supabase
          .from(table)
          .update({ status: "reunited" })
          .eq("id", discId);
      }}
    >
      <button
        type="submit"
        className="text-xs text-green-600 font-semibold hover:text-green-700"
      >
        ✓ Mark as reunited
      </button>
    </form>
  );
}
