"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Briefcase, MessageSquare, AlertTriangle, Mail } from "lucide-react";

/**
 * Sticky navbar in glass/cloud-style passend bij de cards op de site.
 * 5 items: Locatie — Zakelijk — Piet — Reed — Contact.
 *
 * - Locatie: trigger GPS (fires `wz:locate` event, WeatherDashboard luistert)
 * - Zakelijk: /zakelijk
 * - Piet: scroll naar #piet (uitgebreide nu/straks/vandaag/vannacht/morgen)
 * - Reed: scroll naar #reed (extremen — leeg als er niks is)
 * - Contact: mailto
 *
 * Op andere pagina's dan homepage/stadpagina gaan Piet/Reed naar `/#piet` etc.
 */
export default function NavBar() {
  const pathname = usePathname() || "/";
  // Piet/Reed ankers bestaan alleen op pagina's met WeatherDashboard
  const onDashboard = pathname === "/" || pathname.startsWith("/weer/");
  const pietHref = onDashboard ? "#piet" : "/#piet";
  const reedHref = onDashboard ? "#reed" : "/#reed";

  const triggerLocate = () => {
    window.dispatchEvent(new CustomEvent("wz:locate"));
    // scroll naar boven zodat je het dashboard ziet updaten
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav
      aria-label="Hoofdnavigatie"
      className="sticky top-0 z-40 w-full px-3 pt-3 pb-2"
    >
      <ul className="max-w-3xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
        <li className="flex-1">
          <button
            type="button"
            onClick={triggerLocate}
            className="nav-pill w-full"
            aria-label="Bepaal mijn locatie"
          >
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="label">Locatie</span>
          </button>
        </li>
        <li className="flex-1">
          <Link href="/zakelijk" className="nav-pill w-full">
            <Briefcase className="w-3.5 h-3.5 shrink-0" />
            <span className="label">Zakelijk</span>
          </Link>
        </li>
        <li className="flex-1">
          <a href={pietHref} className="nav-pill w-full">
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span className="label">Piet</span>
          </a>
        </li>
        <li className="flex-1">
          <a href={reedHref} className="nav-pill w-full">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="label">Reed</span>
          </a>
        </li>
        <li className="flex-1">
          <a href="mailto:info@weerzone.nl" className="nav-pill w-full">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span className="label">Contact</span>
          </a>
        </li>
      </ul>
    </nav>
  );
}
