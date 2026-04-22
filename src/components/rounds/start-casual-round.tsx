"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Play, X, Check, UserPlus, Settings } from "lucide-react";

interface StartCasualRoundProps {
  userId: string;
  members: any[];
  courses: any[];
}

export function StartCasualRound({
  userId,
  members,
  courses,
}: StartCasualRoundProps) {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([userId]);
  const [courseId, setCourseId] = useState("");
  const [playedOn, setPlayedOn] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [notes, setNotes] = useState("");
  const [startingHole, setStartingHole] = useState(1);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  function toggleMember(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleStart() {
    if (!courseId) {
      setError("Please select a course.");
      return;
    }
    if (selectedIds.length < 1) {
      setError("Select at least one player.");
      return;
    }
    setCreating(true);
    setError("");

    const { data: round, error: roundError } = await supabase
      .from("casual_rounds")
      .insert({
        course_id: courseId,
        played_on: playedOn,
        created_by: userId,
        notes: notes || null,
        starting_hole: startingHole,
      })
      .select()
      .single();

    if (roundError || !round) {
      setError(roundError?.message ?? "Failed to create round");
      setCreating(false);
      return;
    }

    for (const playerId of selectedIds) {
      await supabase.from("scorecards").insert({
        casual_round_id: round.id,
        player_id: playerId,
      });
    }

    setCreating(false);
    setOpen(false);
    router.push(`/rounds/${round.id}`);
  }

  // Get hole count for selected course to populate starting hole options
  const selectedCourse = courses.find((c) => c.id === courseId);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
      >
        <Play size={16} /> Start Round
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="font-bold text-gray-900 text-lg">
                Start Casual Round
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Course */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Course *
                </label>
                <select
                  value={courseId}
                  onChange={(e) => {
                    setCourseId(e.target.value);
                    setStartingHole(1);
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  <option value="">Select course...</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.hole_count} holes)
                    </option>
                  ))}
                </select>
              </div>

              {/* Date + Starting hole */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={playedOn}
                    onChange={(e) => setPlayedOn(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Starting Hole
                  </label>
                  <select
                    value={startingHole}
                    onChange={(e) => setStartingHole(parseInt(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    disabled={!courseId}
                  >
                    {courseId ? (
                      Array.from(
                        { length: selectedCourse?.hole_count ?? 18 },
                        (_, i) => i + 1,
                      ).map((n) => (
                        <option key={n} value={n}>
                          Hole {n}
                        </option>
                      ))
                    ) : (
                      <option value={1}>Hole 1</option>
                    )}
                  </select>
                  {startingHole > 1 && (
                    <p className="text-xs text-orange-500 mt-1">
                      Starting on hole {startingHole} — scoring will wrap around
                    </p>
                  )}
                </div>
              </div>

              {/* Players */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Players ({selectedIds.length} selected)
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {members.map((m) => {
                    const isSelected = selectedIds.includes(m.id);
                    const isMe = m.id === userId;
                    return (
                      <button
                        key={m.id}
                        onClick={() => !isMe && toggleMember(m.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                          isSelected
                            ? "border-green-400 bg-green-50"
                            : "border-gray-200 hover:border-gray-300"
                        } ${isMe ? "cursor-default" : ""}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                            isSelected ? "bg-green-500" : "bg-gray-300"
                          }`}
                        >
                          {(m.full_name ?? m.username)
                            ?.charAt(0)
                            ?.toUpperCase()}
                        </div>
                        <span className="flex-1 text-sm font-medium text-gray-900 truncate">
                          {m.full_name ?? m.username}
                          {isMe && (
                            <span className="text-green-600 text-xs ml-1">
                              (you)
                            </span>
                          )}
                        </span>
                        {isSelected && (
                          <Check
                            size={16}
                            className="text-green-500 flex-shrink-0"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Tuesday club round"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <button
                onClick={handleStart}
                disabled={creating}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                <Play size={16} />
                {creating ? "Creating..." : "Start Round"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Separate component for managing an in-progress round ──
interface ManageRoundProps {
  roundId: string;
  members: any[];
  currentPlayerIds: string[];
  courseName: string;
}

export function ManageRound({
  roundId,
  members,
  currentPlayerIds,
  courseName,
}: ManageRoundProps) {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const availableMembers = members.filter(
    (m) => !currentPlayerIds.includes(m.id),
  );

  async function addPlayer(memberId: string) {
    setAdding(true);
    setError("");

    const { error } = await supabase.from("scorecards").insert({
      casual_round_id: roundId,
      player_id: memberId,
    });

    if (error) {
      setError(error.message);
    } else {
      setOpen(false);
      router.refresh();
    }
    setAdding(false);
  }

  if (availableMembers.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-colors"
      >
        <UserPlus size={15} /> Add Player
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="font-bold text-gray-900">Add Player</h2>
                <p className="text-xs text-gray-500 mt-0.5">{courseName}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-2">
              <p className="text-xs text-gray-500 px-1 mb-3">
                Select a member to add to this round. Their scorecard will start
                from the current hole.
              </p>

              {availableMembers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => addPlayer(m.id)}
                  disabled={adding}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all text-left disabled:opacity-50"
                >
                  <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-bold flex-shrink-0">
                    {(m.full_name ?? m.username)?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-900">
                    {m.full_name ?? m.username}
                  </span>
                  <UserPlus
                    size={16}
                    className="text-green-500 flex-shrink-0"
                  />
                </button>
              ))}

              {error && <p className="text-red-600 text-sm px-1">{error}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
