"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Check, X, ChevronDown } from "lucide-react";

interface HazardActionsProps {
  hazardId: string;
  currentStatus: string;
  adminNotes: string | null;
}

const STATUS_FLOW = ["open", "in_review", "resolved", "closed"];
const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_review: "In Review",
  resolved: "Resolved",
  closed: "Closed",
};
const STATUS_COLOURS: Record<string, string> = {
  open: "bg-red-100 text-red-700 border-red-200",
  in_review: "bg-blue-100 text-blue-700 border-blue-200",
  resolved: "bg-green-100 text-green-700 border-green-200",
  closed: "bg-gray-100 text-gray-500 border-gray-200",
};

export function HazardActions({
  hazardId,
  currentStatus,
  adminNotes: initialNotes,
}: HazardActionsProps) {
  const supabase = createClient();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  async function updateStatus(newStatus: string) {
    setSaving(true);
    setShowStatusMenu(false);
    await (supabase as any)
      .from("hazard_reports")
      .update({
        status: newStatus,
        ...(newStatus === "resolved"
          ? { resolved_at: new Date().toISOString() }
          : {}),
      })
      .eq("id", hazardId);
    setSaving(false);
    router.refresh();
  }

  async function saveNotes() {
    setSavingNotes(true);
    await (supabase as any)
      .from("hazard_reports")
      .update({ admin_notes: notes || null })
      .eq("id", hazardId);
    setSavingNotes(false);
    setShowNotes(false);
    router.refresh();
  }

  const nextStatus =
    STATUS_FLOW[STATUS_FLOW.indexOf(currentStatus) + 1] ?? null;

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Quick next step button */}
        {nextStatus && (
          <button
            onClick={() => updateStatus(nextStatus)}
            disabled={saving}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : `→ Mark as ${STATUS_LABELS[nextStatus]}`}
          </button>
        )}

        {/* Status dropdown for any status */}
        <div className="relative">
          <button
            onClick={() => setShowStatusMenu((v) => !v)}
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors hover:opacity-80"
            style={{
              borderColor: "var(--border-colour)",
              color: "var(--text-secondary)",
              background: "var(--bg-primary)",
            }}
          >
            Status <ChevronDown size={12} />
          </button>
          {showStatusMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowStatusMenu(false)}
              />
              <div
                className="absolute left-0 top-full mt-1 z-20 rounded-xl border shadow-lg overflow-hidden w-36"
                style={{
                  background: "var(--bg-card)",
                  borderColor: "var(--border-colour)",
                }}
              >
                {STATUS_FLOW.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(s)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium hover:opacity-80 transition-colors ${currentStatus === s ? "font-bold" : ""}`}
                    style={{
                      color: "var(--text-primary)",
                      background:
                        currentStatus === s ? "var(--bg-primary)" : undefined,
                    }}
                  >
                    {STATUS_LABELS[s]}
                    {currentStatus === s && (
                      <Check size={12} className="text-green-500" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Add/edit admin note */}
        <button
          onClick={() => setShowNotes((v) => !v)}
          className="text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors hover:opacity-80"
          style={{
            borderColor: "var(--border-colour)",
            color: "var(--text-secondary)",
            background: "var(--bg-primary)",
          }}
        >
          {initialNotes ? "Edit note" : "+ Add note"}
        </button>
      </div>

      {/* Admin notes editor */}
      {showNotes && (
        <div className="space-y-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Add an admin note visible to all members..."
            className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            style={{
              background: "var(--bg-primary)",
              borderColor: "var(--border-colour)",
              color: "var(--text-primary)",
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowNotes(false)}
              className="flex-1 py-1.5 rounded-lg border text-xs font-medium"
              style={{
                borderColor: "var(--border-colour)",
                color: "var(--text-secondary)",
              }}
            >
              Cancel
            </button>
            <button
              onClick={saveNotes}
              disabled={savingNotes}
              className="flex-1 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-xs font-semibold transition-colors"
            >
              {savingNotes ? "Saving..." : "Save Note"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
