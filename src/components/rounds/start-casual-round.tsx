"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Play,
  Plus,
  Minus,
  X,
  Users,
  MapPin,
  ChevronRight,
  Layout,
} from "lucide-react";

interface Member {
  id: string;
  full_name: string | null;
  username: string;
  nickname?: string | null;
}

interface Course {
  id: string;
  name: string;
  hole_count: number;
}

interface CourseLayout {
  id: string;
  name: string;
  hole_count: number;
  is_default: boolean;
}

interface StartCasualRoundProps {
  userId: string;
  members: Member[];
  courses: Course[];
}

export function StartCasualRound({
  userId,
  members,
  courses,
}: StartCasualRoundProps) {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"course" | "layout" | "players">("course");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [layouts, setLayouts] = useState<CourseLayout[]>([]);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);
  const [loadingLayouts, setLoadingLayouts] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([userId]);
  const [starting, setStarting] = useState(false);
  const [search, setSearch] = useState("");

  const displayName = (m: Member) => m.nickname ?? m.full_name ?? m.username;

  async function selectCourse(course: Course) {
    setSelectedCourse(course);
    setLoadingLayouts(true);

    const { data: layoutData } = await (supabase as any)
      .from("course_layouts")
      .select("id, name, hole_count, is_default")
      .eq("course_id", course.id)
      .order("is_default", { ascending: false })
      .order("name");

    setLayouts(layoutData ?? []);
    setLoadingLayouts(false);

    if (!layoutData || layoutData.length === 0) {
      // No layouts — skip layout step
      setSelectedLayoutId(null);
      setStep("players");
    } else {
      // Pre-select default layout
      const def =
        layoutData.find((l: CourseLayout) => l.is_default) ?? layoutData[0];
      setSelectedLayoutId(def.id);
      setStep("layout");
    }
  }

  function togglePlayer(id: string) {
    if (id === userId) return; // can't remove yourself
    setSelectedPlayers((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  async function handleStart() {
    if (!selectedCourse) return;
    setStarting(true);

    const { data: round, error: roundErr } = await (supabase as any)
      .from("casual_rounds")
      .insert({
        course_id: selectedCourse.id,
        layout_id: selectedLayoutId,
        created_by: userId,
        played_on: new Date().toISOString().split("T")[0],
        status: "in_progress", // ← fix here
        is_complete: false,
      })
      .select()
      .single();

    if (roundErr || !round) {
      console.error("Failed to create round:", roundErr);
      setStarting(false);
      return;
    }

    for (const playerId of selectedPlayers) {
      await (supabase as any).from("scorecards").insert({
        casual_round_id: round.id,
        player_id: playerId,
      });
    }

    setOpen(false);
    router.push(`/rounds/${round.id}`);
  }

  const filteredMembers = members.filter(
    (m) =>
      displayName(m).toLowerCase().includes(search.toLowerCase()) ||
      m.username.toLowerCase().includes(search.toLowerCase()),
  );

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors"
      >
        <Play size={14} fill="white" /> Start Round
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => {
          setOpen(false);
          setStep("course");
          setSelectedCourse(null);
        }}
      />
      <div
        className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] flex flex-col"
        style={{ background: "var(--bg-card)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <div>
            <h2
              className="font-bold text-lg"
              style={{ color: "var(--text-primary)" }}
            >
              {step === "course"
                ? "Select Course"
                : step === "layout"
                  ? "Select Layout"
                  : "Add Players"}
            </h2>
            {selectedCourse && (
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--text-secondary)" }}
              >
                {selectedCourse.name}
                {selectedLayoutId && layouts.length > 0 && (
                  <> · {layouts.find((l) => l.id === selectedLayoutId)?.name}</>
                )}
              </p>
            )}
          </div>
          <button
            onClick={() => {
              setOpen(false);
              setStep("course");
              setSelectedCourse(null);
            }}
            className="p-1.5 rounded-lg"
            style={{ color: "var(--text-secondary)" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1 px-5 pb-3 flex-shrink-0">
          {[
            "course",
            ...(layouts.length > 0 || step === "layout" ? ["layout"] : []),
            "players",
          ].map((s, i, arr) => (
            <div key={s} className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full transition-colors ${step === s ? "bg-green-500" : arr.indexOf(s) < arr.indexOf(step) ? "bg-green-300" : "bg-gray-200"}`}
              />
              {i < arr.length - 1 && <div className="w-4 h-px bg-gray-200" />}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {/* Step 1: Course */}
          {step === "course" && (
            <div className="space-y-2">
              {courses.length === 0 ? (
                <p
                  className="text-sm text-center py-8"
                  style={{ color: "var(--text-secondary)" }}
                >
                  No courses set up yet.
                </p>
              ) : (
                courses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => selectCourse(course)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors hover:border-green-400"
                    style={{
                      borderColor: "var(--border-colour)",
                      background: "var(--bg-primary)",
                    }}
                  >
                    <div className="w-9 h-9 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin size={16} className="text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-semibold text-sm"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {course.name}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {course.hole_count} holes
                      </p>
                    </div>
                    <ChevronRight
                      size={16}
                      style={{ color: "var(--text-secondary)" }}
                    />
                  </button>
                ))
              )}
            </div>
          )}

          {/* Step 2: Layout */}
          {step === "layout" && (
            <div className="space-y-2">
              {loadingLayouts ? (
                <p
                  className="text-sm text-center py-8"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Loading layouts...
                </p>
              ) : (
                <>
                  {layouts.map((layout) => (
                    <button
                      key={layout.id}
                      onClick={() => setSelectedLayoutId(layout.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        selectedLayoutId === layout.id
                          ? "border-green-500 bg-green-500/5"
                          : "hover:border-green-300"
                      }`}
                      style={
                        selectedLayoutId !== layout.id
                          ? {
                              borderColor: "var(--border-colour)",
                              background: "var(--bg-primary)",
                            }
                          : undefined
                      }
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedLayoutId === layout.id ? "bg-green-500" : "bg-gray-100"}`}
                      >
                        <Layout
                          size={16}
                          className={
                            selectedLayoutId === layout.id
                              ? "text-white"
                              : "text-gray-500"
                          }
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className="font-semibold text-sm"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {layout.name}
                          </p>
                          {layout.is_default && (
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {layout.hole_count} holes
                        </p>
                      </div>
                      {selectedLayoutId === layout.id && (
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                  <button
                    onClick={() => setStep("players")}
                    className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm mt-2 transition-colors"
                  >
                    Continue →
                  </button>
                  <button
                    onClick={() => setStep("course")}
                    className="w-full py-2 text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    ← Back
                  </button>
                </>
              )}
            </div>
          )}

          {/* Step 3: Players */}
          {step === "players" && (
            <div className="space-y-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search members..."
                className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                style={{
                  background: "var(--bg-primary)",
                  borderColor: "var(--border-colour)",
                  color: "var(--text-primary)",
                }}
              />

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {filteredMembers.map((m) => {
                  const selected = selectedPlayers.includes(m.id);
                  const isMe = m.id === userId;
                  return (
                    <button
                      key={m.id}
                      onClick={() => togglePlayer(m.id)}
                      disabled={isMe}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        selected
                          ? "border-green-500 bg-green-500/5"
                          : "hover:border-green-300"
                      } ${isMe ? "opacity-70" : ""}`}
                      style={
                        !selected
                          ? {
                              borderColor: "var(--border-colour)",
                              background: "var(--bg-primary)",
                            }
                          : undefined
                      }
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${selected ? "bg-green-500" : "bg-gray-400"}`}
                      >
                        {displayName(m).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-semibold text-sm truncate"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {displayName(m)}{" "}
                          {isMe && (
                            <span className="text-xs opacity-60">(you)</span>
                          )}
                        </p>
                      </div>
                      {selected && (
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 space-y-2">
                <p
                  className="text-xs text-center"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {selectedPlayers.length} player
                  {selectedPlayers.length > 1 ? "s" : ""} selected
                </p>
                <button
                  onClick={handleStart}
                  disabled={starting || !selectedCourse}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  <Play size={16} fill="white" />
                  {starting ? "Starting..." : "Start Round"}
                </button>
                <button
                  onClick={() =>
                    setStep(layouts.length > 0 ? "layout" : "course")
                  }
                  className="w-full py-2 text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  ← Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ManageRound component (unchanged — kept for scorecard page)
export function ManageRound({
  roundId,
  members,
  currentPlayerIds,
  courseName,
}: {
  roundId: string;
  members: any[];
  currentPlayerIds: string[];
  courseName: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  const available = members.filter((m) => !currentPlayerIds.includes(m.id));

  async function addPlayer(playerId: string) {
    setAdding(true);
    await (supabase as any)
      .from("scorecards")
      .insert({ casual_round_id: roundId, player_id: playerId });
    setAdding(false);
    setOpen(false);
    router.refresh();
  }

  const displayName = (m: any) => m.nickname ?? m.full_name ?? m.username;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 transition-colors"
      >
        <Users size={16} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div
            className="relative rounded-2xl w-full max-w-sm p-5 space-y-3"
            style={{ background: "var(--bg-card)" }}
          >
            <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>
              Add Player to Round
            </h3>
            {available.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                All members are already in this round.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {available.map((m: any) => (
                  <button
                    key={m.id}
                    onClick={() => addPlayer(m.id)}
                    disabled={adding}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border text-left hover:border-green-400 transition-colors"
                    style={{
                      borderColor: "var(--border-colour)",
                      background: "var(--bg-primary)",
                    }}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {displayName(m).charAt(0).toUpperCase()}
                    </div>
                    <p
                      className="font-semibold text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {displayName(m)}
                    </p>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setOpen(false)}
              className="w-full py-2.5 rounded-xl border text-sm font-semibold"
              style={{
                borderColor: "var(--border-colour)",
                color: "var(--text-secondary)",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
