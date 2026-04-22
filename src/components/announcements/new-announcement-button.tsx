"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus, X, Pin } from "lucide-react";

export function NewAnnouncementButton() {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [publishNow, setPublishNow] = useState(true);
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setTitle("");
    setBody("");
    setIsPinned(false);
    setPublishNow(true);
    setExpiresAt("");
    setError("");
  }

  async function handleSubmit(publish: boolean) {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!body.trim()) {
      setError("Body is required.");
      return;
    }
    setSaving(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("announcements").insert({
      title: title.trim(),
      body: body.trim(),
      is_pinned: isPinned,
      published_at: publish ? new Date().toISOString() : null,
      expires_at: expiresAt || null,
      created_by: user!.id,
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
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
      >
        <Plus size={16} /> New
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
                New Announcement
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
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Club Championship this Saturday!"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Message *
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={5}
                  placeholder="Write your announcement here..."
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Expiry Date (optional)
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Leave blank to keep it visible indefinitely.
                </p>
              </div>

              {/* Pin toggle */}
              <button
                onClick={() => setIsPinned((v) => !v)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  isPinned
                    ? "border-green-400 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Pin
                  size={16}
                  className={isPinned ? "text-green-600" : "text-gray-400"}
                />
                <div className="flex-1 text-left">
                  <p
                    className={`text-sm font-semibold ${isPinned ? "text-green-700" : "text-gray-700"}`}
                  >
                    Pin this announcement
                  </p>
                  <p className="text-xs text-gray-400">
                    Pinned posts appear at the top of the feed
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isPinned
                      ? "border-green-500 bg-green-500"
                      : "border-gray-300"
                  }`}
                >
                  {isPinned && <span className="text-white text-xs">✓</span>}
                </div>
              </button>

              {error && <p className="text-red-600 text-sm">{error}</p>}

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={saving}
                  className="py-3 rounded-xl border border-gray-200 font-semibold text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Save as Draft
                </button>
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={saving}
                  className="py-3 rounded-xl bg-green-600 hover:bg-green-700 font-semibold text-sm text-white transition-colors disabled:opacity-50"
                >
                  {saving ? "Publishing..." : "Publish Now"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
