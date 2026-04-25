"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MoreHorizontal,
  X,
  Grid3x3,
  Award,
  Disc,
  Megaphone,
  MapPin,
  AlertTriangle,
  Lightbulb,
  Settings,
  Shield,
} from "lucide-react";

const moreLinks = [
  {
    href: "/announcements",
    label: "Announcements",
    icon: Megaphone,
    colour: "bg-pink-500",
  },
  { href: "/bingo", label: "Bingo", icon: Grid3x3, colour: "bg-purple-500" },
  {
    href: "/achievements",
    label: "Achievements",
    icon: Award,
    colour: "bg-yellow-500",
  },
  {
    href: "/lost-found",
    label: "Lost & Found",
    icon: Disc,
    colour: "bg-red-500",
  },
  { href: "/courses", label: "Courses", icon: MapPin, colour: "bg-green-600" },
  {
    href: "/hazards",
    label: "Hazards",
    icon: AlertTriangle,
    colour: "bg-orange-500",
  },
  {
    href: "/improvements",
    label: "Improvements",
    icon: Lightbulb,
    colour: "bg-teal-500",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    colour: "bg-gray-500",
  },
];

export function MoreMenu({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* More tab button */}
      <button
        onClick={() => setOpen(true)}
        className="flex-1 flex flex-col items-center justify-center py-2 gap-1 text-gray-400 hover:text-green-400 transition-colors active:scale-95"
      >
        <MoreHorizontal size={22} />
        <span className="text-xs font-medium">More</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-up sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Handle */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
          <p className="font-semibold text-gray-900 text-base">More</p>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-4 gap-3 px-4 py-3">
          {moreLinks.map(({ href, label, icon: Icon, colour }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
            >
              <div
                className={`w-12 h-12 ${colour} rounded-xl flex items-center justify-center`}
              >
                <Icon size={22} className="text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                {label}
              </span>
            </Link>
          ))}
        </div>

        {/* Admin link */}
        {isAdmin && (
          <div className="px-4 pb-3">
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 bg-gray-900 rounded-xl px-4 py-3"
            >
              <div className="w-9 h-9 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Admin Panel</p>
                <p className="text-gray-400 text-xs">Manage your club</p>
              </div>
            </Link>
          </div>
        )}

        {/* Safe area spacer */}
        <div className="h-6" />
      </div>
    </>
  );
}
