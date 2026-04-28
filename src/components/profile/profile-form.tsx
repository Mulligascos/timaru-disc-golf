"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Camera,
  Save,
  Tag,
  User,
  Phone,
  FileText,
  Hash,
  Smile,
  Shield,
} from "lucide-react";
import type { Profile } from "@/lib/types";

interface ProfileFormProps {
  profile:
    | (Profile & { nickname?: string | null; division?: string | null })
    | null;
  userId: string;
  email: string;
  bagTagNumber?: number | null;
}

const DIVISIONS = [
  { value: "mixed", label: "Mixed", description: "Open division" },
  { value: "female", label: "Female", description: "Female division" },
  { value: "senior", label: "Senior", description: "Senior division" },
  {
    value: "junior",
    label: "Junior",
    description: "+1 stroke advantage per hole",
  },
];

export function ProfileForm({
  profile,
  userId,
  email,
  bagTagNumber,
}: ProfileFormProps) {
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [nickname, setNickname] = useState((profile as any)?.nickname ?? "");
  const [division, setDivision] = useState(
    (profile as any)?.division ?? "mixed",
  );
  const [pdgaNumber, setPdgaNumber] = useState(profile?.pdga_number ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    const fileExt = file.name.split(".").pop();
    const filePath = `${userId}/avatar.${fileExt}`;
    const { error: uploadError } = await (supabase as any).storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });
    if (uploadError) {
      setError("Failed to upload avatar: " + uploadError.message);
    } else {
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl + "?t=" + Date.now());
    }
    setUploading(false);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setMessage("");
    const { error } = await (supabase as any)
      .from("profiles")
      .update({
        full_name: fullName,
        username: username.replace(/\s/g, ""),
        nickname: nickname || null,
        division,
        pdga_number: pdgaNumber || null,
        phone: phone || null,
        bio: bio || null,
        avatar_url: avatarUrl || null,
      })
      .eq("id", userId);
    if (error) {
      setError(error.message);
    } else {
      setMessage("Profile saved!");
      router.refresh();
      setTimeout(() => setMessage(""), 3000);
    }
    setSaving(false);
  }

  const displayName = nickname || fullName || username;
  const initials = displayName
    ? displayName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const inputClass =
    "w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent";
  const inputStyle = {
    background: "var(--bg-primary)",
    borderColor: "var(--border-colour)",
    color: "var(--text-primary)",
  };

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-colour)",
      }}
    >
      {/* Avatar section */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 px-6 py-8 flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-green-500 flex items-center justify-center ring-4 ring-white/20">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-3xl font-bold">{initials}</span>
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
          >
            <Camera size={14} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold">{displayName}</p>
          {nickname && (
            <p className="text-gray-400 text-xs mt-0.5">@{username}</p>
          )}
          <p className="text-gray-400 text-sm">{email}</p>
          <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
            {bagTagNumber && (
              <div className="inline-flex items-center gap-1.5 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                <Tag size={12} /> Bag Tag #{bagTagNumber}
              </div>
            )}
            {division && (
              <div className="inline-flex items-center gap-1.5 bg-white/10 text-gray-300 px-3 py-1 rounded-full text-xs font-medium capitalize">
                <Shield size={11} /> {division}
              </div>
            )}
          </div>
        </div>
        {uploading && (
          <p className="text-green-400 text-xs">Uploading photo...</p>
        )}
      </div>

      {/* Form fields */}
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              <User size={12} /> Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
              placeholder="Your full name"
              style={inputStyle}
            />
          </div>
          <div>
            <label
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              <Smile size={12} /> Nickname{" "}
              <span className="text-xs normal-case font-normal opacity-60">
                (shown everywhere)
              </span>
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className={inputClass}
              placeholder="e.g. Birdie King"
              style={inputStyle}
            />
          </div>
          <div>
            <label
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              <Hash size={12} /> Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
              className={inputClass}
              placeholder="username"
              style={inputStyle}
            />
          </div>
          <div>
            <label
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              <Tag size={12} /> PDGA Number
            </label>
            <input
              type="text"
              value={pdgaNumber}
              onChange={(e) => setPdgaNumber(e.target.value)}
              className={inputClass}
              placeholder="e.g. 123456"
              style={inputStyle}
            />
          </div>
          <div>
            <label
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              <Phone size={12} /> Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              placeholder="e.g. 021 123 4567"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Division selector */}
        <div>
          <label
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide mb-2"
            style={{ color: "var(--text-secondary)" }}
          >
            <Shield size={12} /> Division
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DIVISIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDivision(d.value)}
                className={`flex flex-col items-start px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                  division === d.value
                    ? "border-green-500 bg-green-500/10"
                    : "border-[var(--border-colour)] hover:border-green-300"
                }`}
                style={
                  division !== d.value
                    ? { borderColor: "var(--border-colour)" }
                    : undefined
                }
              >
                <span
                  className={`text-sm font-semibold ${division === d.value ? "text-green-500" : ""}`}
                  style={
                    division !== d.value
                      ? { color: "var(--text-primary)" }
                      : undefined
                  }
                >
                  {d.label}
                </span>
                <span
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {d.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide mb-1.5"
            style={{ color: "var(--text-secondary)" }}
          >
            <FileText size={12} /> Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className={`${inputClass} resize-none`}
            placeholder="Tell the club a bit about yourself..."
            style={inputStyle}
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg">
            {message}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}
