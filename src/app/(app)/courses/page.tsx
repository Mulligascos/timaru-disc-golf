import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MapPin } from "lucide-react";
import { CourseCard } from "@/components/courses/course-card";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Courses" };
export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: courses } = await supabase
    .from("courses")
    .select(
      "*, holes(id, hole_number, par, distance_m), course_layouts(id, name, hole_count, is_default, description)",
    )
    .eq("is_active", true)
    .order("round_count", { ascending: false })
    .order("name");

  const allCourses = (courses as any[]) ?? [];

  // Fetch average scores per hole for all courses in one query
  // Group by hole_id, calculate avg throws and count
  const { data: scoreStats } = await supabase
    .from("scores")
    .select("hole_id, throws, scorecards(casual_rounds(played_on, course_id))")
    .not("throws", "is", null);

  // Build a map: hole_id -> { allTime: { sum, count }, season: { sum, count } }
  const currentSeason = new Date().getFullYear();
  const statsMap: Record<
    string,
    {
      allTime: { sum: number; count: number };
      season: { sum: number; count: number };
    }
  > = {};

  for (const score of (scoreStats as any[]) ?? []) {
    const holeId = score.hole_id;
    const throws = score.throws;
    const playedOn = score.scorecards?.casual_rounds?.played_on;
    if (!holeId || throws == null) continue;

    if (!statsMap[holeId]) {
      statsMap[holeId] = {
        allTime: { sum: 0, count: 0 },
        season: { sum: 0, count: 0 },
      };
    }

    statsMap[holeId].allTime.sum += throws;
    statsMap[holeId].allTime.count += 1;

    if (playedOn && new Date(playedOn).getFullYear() === currentSeason) {
      statsMap[holeId].season.sum += throws;
      statsMap[holeId].season.count += 1;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Courses
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          {allCourses.length} course{allCourses.length !== 1 ? "s" : ""} ·
          ordered by most played
        </p>
      </div>

      {allCourses.length === 0 ? (
        <div className="text-center py-16">
          <MapPin
            size={48}
            className="mx-auto mb-4"
            style={{ color: "var(--border-colour)" }}
          />
          <p
            className="font-semibold"
            style={{ color: "var(--text-secondary)" }}
          >
            No courses set up yet
          </p>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--text-secondary)" }}
          >
            Ask your admin to add courses.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {allCourses.map((course: any) => {
            const holes = (course.holes ?? []).sort(
              (a: any, b: any) => a.hole_number - b.hole_number,
            );
            // Attach stats to each hole
            const holesWithStats = holes.map((hole: any) => ({
              ...hole,
              stats: statsMap[hole.id] ?? null,
            }));
            return (
              <CourseCard
                key={course.id}
                course={course}
                holes={holesWithStats}
                layouts={course.course_layouts ?? []}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
