"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Pencil, Trash2, X, Check, Pin } from "lucide-react";

interface AnnouncementActionsProps {
  id: string;
  title: string;
  body: string;
  isPinned: boolean;
  isDraft: boolean;
}

export function AnnouncementActions({
  id,
  title,
  body,
  isPinned,
  isDraft,
}: AnnouncementActionsProps) {
  const supabase = createClient();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editBody, setEditBody] = useState(body);
  const [editPinned, setEditPinned] = useState(isPinned);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    setSaving(true);
    await (supabase as any)
      .from("announcements")
      .update({
        title: editTitle,
        body: editBody,
        is_pinned: editPinned,
        // If draft, publish it now
        ...(isDraft ? { published_at: new Date().toISOString() } : {}),
      })
      .eq("id", id);
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    await (supabase as any).from("announcements").delete().eq("id", id);
    setDeleting(false);
    setConfirmDelete(false);
    router.refresh();
  }

  if (editing) {
    return (
      <>
        {/* Edit modal backdrop */}
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Edit Announcement</h3>
              <button
                onClick={() => setEditing(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Body
              </label>
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={5}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editPinned}
                onChange={(e) => setEditPinned(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700 font-medium">
                Pin this announcement
              </span>
            </label>

            {isDraft && (
              <p className="text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                Saving this draft will publish it immediately.
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editTitle || !editBody}
                className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Check size={14} />
                {saving ? "Saving..." : isDraft ? "Publish" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
        {/* Render nothing in place */}
        <span />
      </>
    );
  }

  if (confirmDelete) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4">
          <h3 className="font-bold text-gray-900">Delete announcement?</h3>
          <p className="text-sm text-gray-500">
            This will permanently delete &ldquo;{title}&rdquo;. This cannot be
            undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white text-sm font-semibold"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setEditing(true)}
        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
        title="Edit"
      >
        <Pencil size={14} />
      </button>
      <button
        onClick={() => setConfirmDelete(true)}
        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        title="Delete"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
