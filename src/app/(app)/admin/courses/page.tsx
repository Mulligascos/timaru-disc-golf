import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CourseForm } from "@/components/admin/course-form";
import { HoleEditor } from "@/components/admin/hole-editor";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Courses" };

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
    .select("*, holes(id, hole_number, par, distance_m)")
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-500 text-sm">
            {courses?.length ?? 0} courses
          </p>
        </div>
      </div>

      {/* Add new course */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Add New Course</h2>
        <CourseForm />
      </div>

      {/* Existing courses */}
      {(courses as any[])?.map((course: any) => (
        <div
          key={course.id}
          className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
        >
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">{course.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {course.city && `${course.city} · `}
                {course.hole_count} holes
                {!course.is_active && (
                  <span className="text-red-500 ml-2">Inactive</span>
                )}
              </p>
            </div>
          </div>
          <div className="p-4">
            <HoleEditor
              courseId={course.id}
              holes={(course as any).holes ?? []}
              holeCount={course.hole_count}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
