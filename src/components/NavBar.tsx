"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useSession } from "@/lib/session-context";

type Props = {
  /** Toont de huidige stad in de Locatie-pill (optioneel) */
  activeCity?: string;
  /** Knippert de Locatie-pill terwijl GPS bepaald wordt */
  isLocating?: boolean;
};

/**
 * NavBar = één grote glass-card (zelfde stijl als .card), met 5 items erin.
 *
 * - Locatie → GPS alleen voor actieve abonnees. Non-subs zien slotje en
 *   krijgen de PersonaModal te zien via `wz:open-persona-modal`.
 * - Zakelijk → /zakelijk (B2B mail-funnel)
 * - 48 uur → /piet anchor (dagelijkse 07:00-mail sectie)
 * - Waarschuwing → /reed (extreem-weer alerts)
 * - Contact → /contact
 */
export default function NavBar({ activeCity, isLocating }: Props) {
  const { user, tier } = useSession();
  const hasSub = !!tier;

  const handleLocateClick = () => {
    if (!hasSub) {
      window.dispatchEvent(new CustomEvent("wz:open-persona-modal"));
      return;
    }
    window.dispatchEvent(new CustomEvent("wz:locate"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Gate voor premium-routes (/piet = 48 uur, /reed = alerts).
  // Non-subs krijgen de persona-modal te zien in plaats van door te klikken.
  const handleLockedClick = (e: React.MouseEvent) => {
    if (!hasSub) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("wz:open-persona-modal"));
    }
  };

  const locateLabel = isLocating
    ? "…"
    : hasSub
      ? (activeCity || "Locatie")
      : "Locatie";

  return (
    <nav aria-label="Hoofdnavigatie" className="card p-1 sm:p-2">
      <ul className="nav-list flex items-stretch justify-between">
        <li className="flex-1">
          <Link href="/" className="nav-item w-full">
            <span className="label">Home</span>
          </Link>
        </li>
        <li className="nav-divider" aria-hidden="true" />
        <li className="flex-1">
          <button
            type="button"
            onClick={handleLocateClick}
            className={`nav-item w-full ${isLocating ? "animate-pulse" : ""} ${!hasSub ? "opacity-70" : ""}`}
            aria-label={
              hasSub
                ? (activeCity ? `Locatie: ${activeCity} — wijzig` : "Bepaal mijn locatie")
                : "Locatie vergrendeld — meld je aan om GPS te gebruiken"
            }
          >
            <span className="label truncate max-w-[64px] sm:max-w-[140px] flex items-center gap-1 justify-center">
              {!hasSub && <Lock className="w-3 h-3 shrink-0" aria-hidden />}
              {locateLabel}
            </span>
          </button>
        </li>
        <li className="nav-divider" aria-hidden="true" />
        <li className="flex-1">
          <Link
            href="/piet"
            onClick={handleLockedClick}
            className={`nav-item w-full ${!hasSub ? "opacity-70" : ""}`}
            aria-label={hasSub ? "Piet — 48 uur op de meter" : "Piet — alleen voor abonnees"}
          >
            <span className="label flex items-center gap-1 justify-center">
              {!hasSub && <Lock className="w-3 h-3 shrink-0" aria-hidden />}
              Piet
            </span>
          </Link>
        </li>
        <li className="nav-divider" aria-hidden="true" />
        <li className="flex-1">
          <Link
            href="/reed"
            onClick={handleLockedClick}
            className={`nav-item w-full ${!hasSub ? "opacity-70" : ""}`}
            aria-label={hasSub ? "Reed — Extreme Wachter" : "Reed — alleen voor abonnees"}
          >
            <span className="label flex items-center gap-1 justify-center">
              {!hasSub && <Lock className="w-3 h-3 shrink-0" aria-hidden />}
              Reed
            </span>
          </Link>
        </li>
        <li className="nav-divider" aria-hidden="true" />
        <li className="flex-1">
          <Link 
            href="/zakelijk" 
            className="nav-item w-full"
            aria-label="Steve — Zakelijk Strateeg"
          >
            <span className="label">Steve</span>
          </Link>
        </li>
        <li className="nav-divider" aria-hidden="true" />
        <li className="flex-1">
          <Link href="/prijzen" className="nav-item w-full">
            <span className="label">Prijzen</span>
          </Link>
        </li>
        <li className="nav-divider" aria-hidden="true" />
        <li className="flex-1">
          {user ? (
            <button
              onClick={async () => {
                const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
                const supabase = createSupabaseBrowserClient();
                await supabase.auth.signOut();
                window.location.reload();
              }}
              className="nav-item w-full"
            >
              <span className="label">Log uit</span>
            </button>
          ) : (
            <Link href="/app/login" className="nav-item w-full">
              <span className="label">Login</span>
            </Link>
          )}
        </li>
      </ul>
    </nav>
  );
}
