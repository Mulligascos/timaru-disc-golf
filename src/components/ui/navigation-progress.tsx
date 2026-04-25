"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setLoading(false);
    setProgress(100);
    const t = setTimeout(() => setProgress(0), 400);
    return () => clearTimeout(t);
  }, [pathname, searchParams]);

  // Start progress on click of any link
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http")) return;
      setLoading(true);
      setProgress(30);
      // Bump to 70% quickly, then hold until navigation completes
      setTimeout(() => setProgress(70), 200);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <>
      {/* Top progress bar */}
      <div
        className="fixed top-0 left-0 z-[100] h-0.5 bg-green-400 transition-all duration-300 ease-out pointer-events-none"
        style={{
          width: `${progress}%`,
          opacity: progress === 0 ? 0 : 1,
          transitionProperty: progress === 100 ? "width, opacity" : "width",
        }}
      />
      {/* Full page overlay spinner for slow loads */}
      {loading && (
        <div className="fixed inset-0 z-[99] flex items-end justify-center pb-32 pointer-events-none">
          <div className="bg-gray-900/80 backdrop-blur-sm text-white text-xs font-medium px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
            <svg
              className="animate-spin w-3.5 h-3.5 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            Loading...
          </div>
        </div>
      )}
    </>
  );
}
