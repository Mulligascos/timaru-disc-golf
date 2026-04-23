"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Save, Plus, Trash2 } from "lucide-react";

interface TournamentFormProps {
  courses: { id: string; name: string; city: string | null }[];
  tournament?: any;
}

export function TournamentForm({ courses, tournament }: TournamentFormProps) {
  const supabase = createClient();
  const router = useRouter();
  const isEdit = !!tournament;

  const [name, setName] = useState(tournament?.name ?? "");
  const [description, setDescription] = useState(tournament?.description ?? "");
  const [format, setFormat] = useState(tournament?.format ?? "stroke_play");
  const [courseId, setCourseId] = useState(tournament?.course_id ?? "");
  const [startDate, setStartDate] = useState(tournament?.start_date ?? "");
  const [endDate, setEndDate] = useState(tournament?.end_date ?? "");
  const [rounds, setRounds] = useState(tournament?.rounds ?? 1);
  const [maxPlayers, setMaxPlayers] = useState(tournament?.max_players ?? "");
  const [entryFee, setEntryFee] = useState(tournament?.entry_fee ?? "");
  const [isLeague, setIsLeague] = useState(tournament?.is_league ?? false);
  const [leagueSeason, setLeagueSeason] = useState(
    tournament?.league_season ?? "",
  );
  const [status, setStatus] = useState(tournament?.status ?? "draft");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!name || !startDate) {
      setError("Name and start date are required.");
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      name,
      description: description || null,
      format,
      course_id: courseId || null,
      start_date: startDate,
      end_date: endDate || null,
      rounds: Number(rounds),
      max_players: maxPlayers ? Number(maxPlayers) : null,
      entry_fee: entryFee ? Number(entryFee) : null,
      is_league: isLeague,
      league_season: leagueSeason || null,
      status,
    };

    if (isEdit) {
      const { error } = await (supabase as any)
        .from("tournaments")
        .update(payload)
        .eq("id", tournament.id);
      if (error) {
        setError(error.message);
        setSaving(false);
        return;
      }

      // Ensure correct number of round records exist
      const { data: existingRounds } = await (supabase as any)
        .from("tournament_rounds")
        .select("id, round_number")
        .eq("tournament_id", tournament.id)
        .order("round_number");

      const existingCount = existingRounds?.length ?? 0;
      if (Number(rounds) > existingCount) {
        for (let i = existingCount + 1; i <= Number(rounds); i++) {
          await (supabase as any).from("tournament_rounds").insert({
            tournament_id: tournament.id,
            round_number: i,
            course_id: courseId || null,
            played_on: startDate,
          });
        }
      }
      router.push(`/tournaments/${tournament.id}`);
    } else {
      const { data, error } = await (supabase as any)
        .from("tournaments")
        .insert(payload)
        .select()
        .single();
      if (error || !data) {
        setError(error?.message ?? "Failed to create");
        setSaving(false);
        return;
      }

      // Create round records
      for (let i = 1; i <= Number(rounds); i++) {
        await (supabase as any).from("tournament_rounds").insert({
          tournament_id: data.id,
          round_number: i,
          course_id: courseId || null,
          played_on: startDate,
        });
      }
      router.push(`/tournaments/${data.id}`);
    }
    setSaving(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Tournament Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="e.g. Timaru Club Championship 2025"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          placeholder="Optional details about the event..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Format *
          </label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="stroke_play">Stroke Play</option>
            <option value="match_play">Match Play</option>
            <option value="league">League</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Course
        </label>
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        >
          <option value="">Select a course...</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.city ? ` — ${c.city}` : ""}
            </option>
          ))}
        </select>
        {courses.length === 0 && (
          <p className="text-xs text-orange-500 mt-1">
            ⚠️ No courses found. Add courses in Admin → Courses first.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Start Date *
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Rounds
          </label>
          <input
            type="number"
            min={1}
            max={10}
            value={rounds}
            onChange={(e) => setRounds(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Max Players
          </label>
          <input
            type="number"
            min={1}
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(e.target.value)}
            placeholder="∞"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Entry Fee ($)
          </label>
          <input
            type="number"
            min={0}
            step="0.50"
            value={entryFee}
            onChange={(e) => setEntryFee(e.target.value)}
            placeholder="Free"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isLeague"
          checked={isLeague}
          onChange={(e) => setIsLeague(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
        />
        <label htmlFor="isLeague" className="text-sm font-medium text-gray-700">
          This is a league event
        </label>
      </div>

      {isLeague && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            League Season
          </label>
          <input
            type="text"
            value={leagueSeason}
            onChange={(e) => setLeagueSeason(e.target.value)}
            placeholder="e.g. 2025 Winter League"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
      >
        <Save size={16} />
        {saving
          ? "Saving..."
          : isEdit
            ? "Update Tournament"
            : "Create Tournament"}
      </button>
    </div>
  );
}
