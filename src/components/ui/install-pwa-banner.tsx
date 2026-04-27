"use client";

import { useState, useEffect } from "react";
import { X, Share, Plus } from "lucide-react";

export function InstallPWABanner() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    const dismissed = localStorage.getItem("pwa-banner-dismissed");
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000)
      return;

    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) && !(window as any).MSStream;
    const android = /android/i.test(ua);

    setIsIOS(ios);
    setIsAndroid(android);

    if (ios) setShow(true);

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    });
  }, []);

  function dismiss() {
    setShow(false);
    localStorage.setItem("pwa-banner-dismissed", Date.now().toString());
  }

  async function install() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setShow(false);
    }
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-20 inset-x-4 z-50 bg-gray-900 text-white rounded-2xl shadow-2xl p-4 flex items-start gap-3">
      <img
        src="/icons/icon-192.png"
        alt=""
        className="w-12 h-12 rounded-xl flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm">Add to Home Screen</p>
        {isIOS ? (
          <p className="text-xs text-gray-400 mt-0.5">
            Tap <Share size={11} className="inline mx-0.5" /> then{" "}
            <strong>&ldquo;Add to Home Screen&rdquo;</strong> for the best
            experience &mdash; no browser bar!
          </p>
        ) : (
          <p className="text-xs text-gray-400 mt-0.5">
            Install the app for the best experience &mdash; no browser bar!
          </p>
        )}
        {isAndroid && deferredPrompt && (
          <button
            onClick={install}
            className="mt-2 flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={13} /> Install App
          </button>
        )}
      </div>
      <button
        onClick={dismiss}
        className="text-gray-500 hover:text-gray-300 flex-shrink-0 p-1"
      >
        <X size={16} />
      </button>
    </div>
  );
}
