"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function getDeferredPrompt(): BeforeInstallPromptEvent | null {
  if (typeof window === "undefined") return null;
  return (
    ((window as unknown as { __wzInstallPrompt?: BeforeInstallPromptEvent }).__wzInstallPrompt) ?? null
  );
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * "Zet Weerzone op je telefoon" (spec agent-headsup §3D). Op iPhone werkt
 * push allleen vanaf het beginscherm; op Android/Chrome tonen we de echte
 * install-prompt. Al standalone → niets tonen.
 */
export default function PwaInstallCard({
  compact = false,
  tone = "dark",
  onDone,
}: {
  compact?: boolean;
  tone?: "dark" | "light";
  onDone?: () => void;
}) {
  const [mode, setMode] = useState<"hidden" | "android" | "ios">("hidden");
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    if (isIOS()) {
      setMode("ios");
      return;
    }
    if (getDeferredPrompt()) {
      setMode("android");
      return;
    }
    const onReady = () => setMode("android");
    window.addEventListener("wz-install-ready", onReady);
    return () => window.removeEventListener("wz-install-ready", onReady);
  }, []);

  async function install() {
    const prompt = getDeferredPrompt();
    if (!prompt) return;
    trackEvent("pwa_install_prompted", {});
    await prompt.prompt();
    const choice = await prompt.userChoice;
    trackEvent("pwa_install_choice", { outcome: choice.outcome });
    if (choice.outcome === "accepted") {
      setInstalled(true);
      onDone?.();
    }
  }

  if (installed) {
    if (compact) return null;
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
        Weerzone staat op je beginscherm — meldingen kunnen je overal bereiken.
      </div>
    );
  }
  if (mode === "hidden") return null;

  if (compact) {
    const isLight = tone === "light";
    return (
      <div
        className={
          isLight
            ? "mt-3 rounded-2xl border p-3.5 text-[13px] font-semibold"
            : "mt-3 rounded-2xl border border-white/15 bg-white/5 p-3.5 text-[13px] font-semibold text-white/75"
        }
        style={isLight ? { borderColor: "var(--wz-border)", color: "var(--wz-text-mute)" } : undefined}
      >
        {mode === "ios" ? (
          <>
            Meldingen op iPhone werken pas als Weerzone op je beginscherm staat: tik op de deelknop en kies{" "}
            <strong className={isLight ? undefined : "text-white"} style={isLight ? { color: "var(--wz-text)" } : undefined}>
              Zet op beginscherm
            </strong>
            . Open Weerzone daarna vanaf dat icoon.
          </>
        ) : (
          <>Zet Weerzone op je telefoon voor meldingen die je overal bereiken.{" "}
            <button
              type="button"
              onClick={() => void install()}
              className="font-black underline underline-offset-2"
              style={isLight ? { color: "var(--wz-text)" } : undefined}
            >
              Installeer
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: "var(--wz-border)", background: "#fff" }}>
      <p className="text-[15px] font-extrabold" style={{ color: "var(--wz-text)" }}>
        Zet Weerzone op je telefoon
      </p>
      {mode === "ios" ? (
        <ol className="mt-2 grid gap-1.5 text-[13px]" style={{ color: "var(--wz-text-mute)" }}>
          <li>1. Tik onderin op de <strong>deelknop</strong> (vierkant met pijl omhoog).</li>
          <li>2. Kies <strong>Zet op beginscherm</strong>.</li>
          <li>3. Open Weerzone voortaan vanaf dat icoon — dan kunnen mijn seintjes je bereiken.</li>
        </ol>
      ) : (
        <>
          <p className="mt-2 text-[13px]" style={{ color: "var(--wz-text-mute)" }}>
            Eén tik en Weerzone staat tussen je apps — zo bereiken de seintjes je overal.
          </p>
          <button type="button" onClick={() => void install()} className="wz-btn wz-btn-primary mt-3">
            Installeer Weerzone
          </button>
        </>
      )}
    </div>
  );
}
