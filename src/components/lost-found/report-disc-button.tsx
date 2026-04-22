"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus, X, Camera, Disc } from "lucide-react";

interface ReportDiscButtonProps {
  userId: string;
  courses: { id: string; name: string }[];
}

type ReportType = "lost" | "found";

export function ReportDiscButton({ userId, courses }: ReportDiscButtonProps) {
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState<ReportType>("lost");
  const [brand, setBrand] = useState("");
  const [mold, setMold] = useState("");
  const [colour, setColour] = useState("");
  const [weight, setWeight] = useState("");
  const [markings, setMarkings] = useState("");
  const [courseId, setCourseId] = useState("");
  const [holeNumber, setHoleNumber] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setBrand("");
    setMold("");
    setColour("");
    setWeight("");
    setMarkings("");
    setCourseId("");
    setHoleNumber("");
    setDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setPhotoUrl("");
    setError("");
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("disc-photos")
      .upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("disc-photos").getPublicUrl(path);
      setPhotoUrl(data.publicUrl);
    }
    setUploading(false);
  }

  async function handleSubmit() {
    setSaving(true);
    setError("");

    const payload = {
      reported_by: userId,
      disc_brand: brand || null,
      disc_mold: mold || null,
      disc_colour: colour || null,
      markings: markings || null,
      course_id: courseId || null,
      hole_number: holeNumber ? parseInt(holeNumber) : null,
      notes: notes || null,
      photo_url: photoUrl || null,
      status: reportType,
    };

    if (reportType === "lost") {
      const { error } = await supabase.from("lost_discs").insert({
        ...payload,
        disc_weight: weight ? parseInt(weight) : null,
        lost_on: date,
      });
      if (error) {
        setError(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from("found_discs").insert({
        ...payload,
        found_on: date,
      });
      if (error) {
        setError(error.message);
        setSaving(false);
        return;
      }
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
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
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
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="font-bold text-gray-900 text-lg">Report a Disc</h2>
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

            <div className="p-6 space-y-5">
              {/* Lost / Found toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                {(["lost", "found"] as ReportType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setReportType(type)}
                    className={`py-2.5 rounded-lg font-semibold text-sm transition-all ${
                      reportType === type
                        ? type === "lost"
                          ? "bg-red-500 text-white shadow-sm"
                          : "bg-blue-500 text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {type === "lost" ? "🔴 I Lost a Disc" : "🔵 I Found a Disc"}
                  </button>
                ))}
              </div>

              {/* Photo upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Photo
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 rounded-xl bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt="Disc"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Disc size={28} className="text-gray-300" />
                    )}
                  </div>
                  <div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Camera size={15} />
                      {uploading ? "Uploading..." : "Add Photo"}
                    </button>
                    <p className="text-xs text-gray-400 mt-1">
                      Helps identify the disc
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </div>
                </div>
              </div>

              {/* Disc details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Innova, Discraft"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Mold
                  </label>
                  <input
                    type="text"
                    value={mold}
                    onChange={(e) => setMold(e.target.value)}
                    placeholder="e.g. Roc, Buzzz"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Colour
                  </label>
                  <input
                    type="text"
                    value={colour}
                    onChange={(e) => setColour(e.target.value)}
                    placeholder="e.g. Red, Blue/Yellow"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Weight (g)
                  </label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="e.g. 175"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Markings / Name on disc
                </label>
                <input
                  type="text"
                  value={markings}
                  onChange={(e) => setMarkings(e.target.value)}
                  placeholder="e.g. John Smith, 021 123 4567"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    {reportType === "lost" ? "Where lost" : "Where found"}
                  </label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  >
                    <option value="">Select course...</option>
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
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Any other details..."
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={saving}
                className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 ${
                  reportType === "lost"
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                {saving
                  ? "Submitting..."
                  : reportType === "lost"
                    ? "🔴 Report Lost Disc"
                    : "🔵 Report Found Disc"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
