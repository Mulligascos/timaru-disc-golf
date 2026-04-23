"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus, X, Camera, MapPin } from "lucide-react";

interface ReportHazardButtonProps {
  userId: string;
  courses: { id: string; name: string }[];
}

export function ReportHazardButton({
  userId,
  courses,
}: ReportHazardButtonProps) {
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [courseId, setCourseId] = useState("");
  const [holeNumber, setHoleNumber] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  function reset() {
    setDescription("");
    setSeverity("medium");
    setCourseId("");
    setHoleNumber("");
    setPhotoUrl("");
    setError("");
    setLat(null);
    setLng(null);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${userId}/${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await (supabase as any).storage
      .from("hazard-photos")
      .upload(path, file);
    if (!error) {
      const { data } = (supabase as any).storage
        .from("hazard-photos")
        .getPublicUrl(path);
      setPhotoUrl(data.publicUrl);
    }
    setUploading(false);
  }

  function getLocation() {
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setGettingLocation(false);
      },
      () => {
        setGettingLocation(false);
      },
    );
  }

  async function handleSubmit() {
    if (!description.trim()) {
      setError("Please describe the hazard.");
      return;
    }
    setSaving(true);
    setError("");

    const { error } = await (supabase as any).from("hazard_reports").insert({
      reported_by: userId,
      description: description.trim(),
      severity,
      course_id: courseId || null,
      hole_number: holeNumber ? parseInt(holeNumber) : null,
      photo_url: photoUrl || null,
      lat: lat ?? null,
      lng: lng ?? null,
      status: "open",
    });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }
    setSaving(false);
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
      >
        <Plus size={16} /> Report
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => {
              setOpen(false);
              reset();
            }}
          />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="font-bold text-gray-900 text-lg">
                Report a Hazard
              </h2>
              <button
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Severity */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Severity
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      value: "low",
                      label: "🟡 Low",
                      colour: "border-yellow-400 bg-yellow-50 text-yellow-700",
                    },
                    {
                      value: "medium",
                      label: "🟠 Medium",
                      colour: "border-orange-400 bg-orange-50 text-orange-700",
                    },
                    {
                      value: "high",
                      label: "🔴 High",
                      colour: "border-red-400 bg-red-50 text-red-700",
                    },
                  ].map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSeverity(s.value)}
                      className={`py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                        severity === s.value
                          ? s.colour
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe the hazard — what is it, where exactly is it, what's the risk?"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                />
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Course
                  </label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  >
                    <option value="">Select...</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Hole #
                  </label>
                  <input
                    type="number"
                    value={holeNumber}
                    onChange={(e) => setHoleNumber(e.target.value)}
                    placeholder="e.g. 7"
                    min={1}
                    max={27}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              {/* GPS */}
              <div>
                <button
                  onClick={getLocation}
                  disabled={gettingLocation}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                >
                  <MapPin size={15} />
                  {gettingLocation
                    ? "Getting location..."
                    : lat
                      ? `📍 Location captured (${lat.toFixed(4)}, ${lng?.toFixed(4)})`
                      : "Capture GPS location"}
                </button>
                <p className="text-xs text-gray-400 mt-1">
                  Optional — helps admin find the exact location
                </p>
              </div>

              {/* Photo */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Photo
                </label>
                <div className="flex items-center gap-3">
                  {photoUrl && (
                    <img
                      src={photoUrl}
                      alt="Hazard"
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                    />
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Camera size={15} />
                    {uploading
                      ? "Uploading..."
                      : photoUrl
                        ? "Change Photo"
                        : "Add Photo"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>
              </div>

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {saving ? "Submitting..." : "⚠️ Submit Hazard Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
