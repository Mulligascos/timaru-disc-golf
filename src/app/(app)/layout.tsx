import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Trophy,
  Tag,
  Grid3x3,
  Award,
  Disc,
  Megaphone,
  MapPin,
  AlertTriangle,
  Lightbulb,
  Settings,
  User,
  Shield,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/bag-tags", label: "Bag Tags", icon: Tag },
  { href: "/bingo", label: "Bingo", icon: Grid3x3 },
  { href: "/achievements", label: "Achievements", icon: Award },
  { href: "/lost-found", label: "Lost & Found", icon: Disc },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
  { href: "/courses", label: "Courses", icon: MapPin },
  { href: "/hazards", label: "Hazards", icon: AlertTriangle },
  { href: "/improvements", label: "Improvements", icon: Lightbulb },
  { href: "/settings", label: "Settings", icon: Settings },
];

// Bottom tab bar — 5 most important items
const bottomTabs = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/tournaments", label: "Events", icon: Trophy },
  { href: "/bag-tags", label: "Bag Tags", icon: Tag },
  { href: "/profile", label: "Profile", icon: User },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, role, avatar_url, full_name")
    .eq("id", user.id)
    .single();

  const isAdmin = (profile as any)?.role === "admin";

  async function signOut() {
    "use server";
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col z-40">
        <div className="flex flex-col flex-1 bg-gray-900 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
            <span className="text-2xl">🥏</span>
            <div>
              <p className="font-bold text-white text-sm leading-tight">
                Timaru
              </p>
              <p className="text-green-400 text-xs font-medium">
                Disc Golf Club
              </p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-sm font-medium group"
              >
                <Icon
                  size={18}
                  className="group-hover:text-green-400 transition-colors"
                />
                {label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-green-400 hover:text-white hover:bg-gray-800 transition-colors text-sm font-medium group mt-4 border border-green-800"
              >
                <Shield size={18} />
                Admin Panel
              </Link>
            )}
          </nav>

          {/* Profile footer */}
          <div className="px-3 py-4 border-t border-gray-800">
            <Link
              href="/profile"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {(profile as any)?.full_name?.charAt(0)?.toUpperCase() ??
                  (profile as any)?.username?.charAt(0)?.toUpperCase() ??
                  "U"}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {profile?.full_name ?? profile?.username}
                </p>
                {isAdmin && <p className="text-green-400 text-xs">Admin</p>}
              </div>
            </Link>
            <form action={signOut} className="mt-1">
              <button
                type="submit"
                className="w-full text-left px-3 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <header className="lg:hidden sticky top-0 z-40 bg-gray-900 text-white px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl">🥏</span>
          <span className="font-bold text-sm">Timaru Disc Golf</span>
        </Link>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link href="/admin" className="text-green-400">
              <Shield size={18} />
            </Link>
          )}
          <Link href="/profile">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
              {(profile as any)?.full_name?.charAt(0)?.toUpperCase() ??
                (profile as any)?.username?.charAt(0)?.toUpperCase() ??
                "U"}
            </div>
          </Link>
        </div>
      </header>

      {/* ── Main content ── */}
      <div className="lg:pl-64">
        <main className="px-4 py-6 pb-24 lg:pb-8 lg:px-8 max-w-4xl mx-auto">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-gray-900 border-t border-gray-800 flex">
        {bottomTabs.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-1 text-gray-400 hover:text-green-400 transition-colors active:scale-95"
          >
            <Icon size={22} />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        ))}
        {/* More menu — links to the rest */}
        <Link
          href="/announcements"
          className="flex-1 flex flex-col items-center justify-center py-2 gap-1 text-gray-400 hover:text-green-400 transition-colors"
        >
          <Megaphone size={22} />
          <span className="text-xs font-medium">More</span>
        </Link>
      </nav>
    </div>
  );
}
