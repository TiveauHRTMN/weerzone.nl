"use client";

import Link from "next/link";
import { MapPin, Briefcase, MessageSquare, AlertTriangle, Mail } from "lucide-react";

type Props = {
  /** Toont de huidige stad in de Locatie-pill (optioneel) */
  activeCity?: string;
  /** Knippert de Locatie-pill terwijl GPS bepaald wordt */
  isLocating?: boolean;
};

/**
 * NavBar = één grote glass-card (zelfde stijl als .card), met 5 items erin.
 *
 * - Locatie → trigger GPS (wz:locate event → WeatherDashboard handelt af)
 * - Zakelijk → /zakelijk (B2B mail-funnel)
 * - Piet → #piet anchor (dagelijkse 08:00-mail sectie)
 * - Reed → #reed anchor (extreem-weer alerts)
 * - Contact → mailto:info@weerzone.nl
 */
export default function NavBar({ activeCity, isLocating }: Props) {
  // Piet en Reed hebben dedicated pagina's met uitgebreide content
  const pietHref = "/piet";
  const reedHref = "/reed";

  const triggerLocate = () => {
    window.dispatchEvent(new CustomEvent("wz:locate"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav aria-label="Hoofdnavigatie" className="card p-1 sm:p-2">
      <ul className="flex items-stretch justify-between gap-0.5 sm:gap-1.5">
        <li className="flex-1">
          <button
            type="button"
            onClick={triggerLocate}
            className={`nav-item w-full ${isLocating ? "animate-pulse" : ""}`}
            aria-label={activeCity ? `Locatie: ${activeCity} — wijzig` : "Bepaal mijn locatie"}
          >
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="label truncate max-w-[64px] sm:max-w-[140px]">
              {isLocating ? "…" : (activeCity || "Locatie")}
            </span>
          </button>
        </li>
        <li className="flex-1">
          <Link href="/zakelijk" className="nav-item w-full">
            <Briefcase className="w-3.5 h-3.5 shrink-0" />
            <span className="label">Zakelijk</span>
          </Link>
        </li>
        <li className="flex-1">
          <Link href={pietHref} className="nav-item w-full">
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span className="label">Piet</span>
          </Link>
        </li>
        <li className="flex-1">
          <Link href={reedHref} className="nav-item w-full">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="label">Reed</span>
          </Link>
        </li>
        <li className="flex-1">
          <Link href="/contact" className="nav-item w-full">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span className="label">Contact</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
