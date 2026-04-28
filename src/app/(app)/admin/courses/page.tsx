import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CourseForm } from "@/components/admin/course-form";
import { HoleEditor } from "@/components/admin/hole-editor";
import { LayoutEditor } from "@/components/admin/layout-editor";
import { CourseAccordion } from "@/components/admin/course-accordion";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Courses" };
export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
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

  const { data: courses } = await supabase
    .from("courses")
    .select(
      "*, holes(id, hole_number, par, distance_m), course_layouts(id, name, description, hole_count, is_default)",
    )
    // .order("round_count", { ascending: false })
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Courses
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {courses?.length ?? 0} courses
          </p>
        </div>
      </div>

      {/* Add new course */}
      <div
        className="rounded-2xl border p-5"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-colour)",
        }}
      >
        <h2
          className="font-semibold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Add New Course
        </h2>
        <CourseForm />
      </div>

      {/* Existing courses — collapsible */}
      <div className="space-y-3">
        {(courses as any[])?.map((course: any) => (
          <CourseAccordion
            key={course.id}
            course={course}
            holes={(course.holes ?? []).sort(
              (a: any, b: any) => a.hole_number - b.hole_number,
            )}
            layouts={course.course_layouts ?? []}
          />
        ))}
      </div>
    </div>
  );
}
