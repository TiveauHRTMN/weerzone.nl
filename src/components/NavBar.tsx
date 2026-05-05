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
 * NavBar = één grote glass-card (zelfde stijl als .card), met items erin.
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
    <nav aria-label="Hoofdnavigatie" className="card overflow-hidden">
      <ul className="nav-list flex items-center justify-between overflow-x-auto no-scrollbar py-1">
        <li className="flex-none sm:flex-1">
          <button
            type="button"
            onClick={handleLocateClick}
            className={`nav-item w-full ${isLocating ? "animate-pulse" : ""} ${!hasSub ? "opacity-70" : ""}`}
          >
            <span className="label truncate max-w-[50px] sm:max-w-[140px] flex items-center gap-1 justify-center">
              {!hasSub && <Lock className="w-2.5 h-2.5 shrink-0" />}
              {locateLabel}
            </span>
          </button>
        </li>
        <li className="nav-divider" />
        <li className="flex-none sm:flex-1">
          <Link href="/" className="nav-item w-full">
            <span className="label">Home</span>
          </Link>
        </li>
        <li className="nav-divider" />
        <li className="flex-none sm:flex-1">
          <Link
            href="/mijnweer"
            onClick={handleLockedClick}
            className={`nav-item w-full ${!hasSub ? "opacity-70" : ""}`}
          >
            <span className="label flex items-center gap-1 justify-center">
              {!hasSub && <Lock className="w-2.5 h-2.5 shrink-0" />}
              Mijn Weer
            </span>
          </Link>
        </li>
        <li className="nav-divider" />
        <li className="flex-none sm:flex-1">
          <Link
            href="/waarschuwingen"
            onClick={handleLockedClick}
            className={`nav-item w-full ${!hasSub ? "opacity-70" : ""}`}
          >
            <span className="label flex items-center gap-1 justify-center">
              {!hasSub && <Lock className="w-2.5 h-2.5 shrink-0" />}
              Waarschuwingen
            </span>
          </Link>
        </li>
        <li className="nav-divider" />
        <li className="flex-none sm:flex-1">
          <Link href="/zakelijk" className="nav-item w-full">
            <span className="label">Zakelijk</span>
          </Link>
        </li>
        <li className="nav-divider" />
        <li className="flex-none sm:flex-1">
          <Link href="/prijzen" className="nav-item w-full">
            <span className="label">Prijzen</span>
          </Link>
        </li>
        <li className="nav-divider" />
        <li className="flex-none sm:flex-1">
          <Link href="/over" className="nav-item w-full">
            <span className="label">Over</span>
          </Link>
        </li>
        <li className="nav-divider" />
        <li className="flex-none sm:flex-1">
          <Link href="/contact" className="nav-item w-full">
            <span className="label">Contact</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
