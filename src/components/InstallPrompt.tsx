"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed or already installed
    if (typeof window === "undefined") return;
    if (localStorage.getItem("wz_install_dismissed")) return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show after 3 seconds on site to maximize visibility
      setTimeout(() => setShow(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem("wz_install_dismissed", "1");
  };

  if (!show || dismissed || !deferredPrompt) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto animate-fade-in drop-shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl border-2 border-accent-orange p-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#4a9ee8] to-[#2980b9] flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">WEERZONE installeren?</p>
          <p className="text-xs text-gray-500 mt-0.5">Direct weer op je homescreen. Geen app store nodig.</p>
        </div>
        <button
          onClick={handleInstall}
          className="px-4 py-2 bg-accent-orange text-text-primary text-xs font-bold rounded-full hover:brightness-90 transition-colors shrink-0"
        >
          Installeer
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Sluiten"
          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
