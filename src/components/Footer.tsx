"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoFull } from "./Logo";
import { detectLocale, LOCALES, type Locale } from "@/config/locales";

const SOCIALS = [
  { label: "X", href: "https://x.com/weerzone" },
  { label: "Instagram", href: "https://www.instagram.com/weerzonenl" },
  { label: "YouTube", href: "https://youtube.com/@weerzone" },
  { label: "TikTok", href: "https://www.tiktok.com/@weerzonenl" },
  { label: "Reddit", href: "https://www.reddit.com/user/No_Slip_3007/" },
  { label: "Wikidata", href: "https://www.wikidata.org/wiki/Q139675943" },
];

type NavItem = { label: string; href: string };
type FooterCopy = { tagline: [string, string]; credits: string; back: string };

const BE_PROVINCES = new Set(["antwerpen", "limburg-be", "oost-vlaanderen", "vlaams-brabant", "west-vlaanderen"]);

const FOOTER_COPY: Record<Locale, FooterCopy> = {
  nl: {
    tagline: ["Weer voor jouw plek.", "Vandaag en morgen."],
    credits: "WEERZONE combineert actuele weergegevens met heldere uitleg voor jouw locatie. De officiële bronnen behouden hun eigen credits.",
    back: "Terug naar home",
  },
  de: {
    tagline: ["Wetter für deinen Ort.", "Heute und morgen."],
    credits: "WEERZONE verbindet aktuelle Wetterdaten mit klarer Erklärung für deinen Ort. Die offiziellen Quellen behalten ihre eigenen Credits.",
    back: "Zur Startseite",
  },
  fr: {
    tagline: ["Météo pour votre lieu.", "Aujourd'hui et demain."],
    credits: "WEERZONE relie les données météo actuelles à une explication claire pour votre lieu. Les sources officielles gardent leurs propres crédits.",
    back: "Retour à l'accueil",
  },
  es: {
    tagline: ["Tiempo para tu lugar.", "Hoy y mañana."],
    credits: "WEERZONE combina datos actuales del tiempo con una explicación clara para tu lugar. Las fuentes oficiales conservan sus propios créditos.",
    back: "Volver al inicio",
  },
};

function navItems(pathname: string, locale: Locale): NavItem[] {
  if (pathname === "/lu" || pathname.startsWith("/lu/") || pathname.includes("/luxembourg")) {
    return [
      { label: "Luxembourg", href: locale === "de" ? "/de/wetter/luxembourg" : "/fr/meteo/luxembourg" },
      { label: "Esch-sur-Alzette", href: locale === "de" ? "/de/wetter/luxembourg/esch-sur-alzette" : "/fr/meteo/luxembourg/esch-sur-alzette" },
      { label: "Differdange", href: locale === "de" ? "/de/wetter/luxembourg/differdange" : "/fr/meteo/luxembourg/differdange" },
      { label: "Dudelange", href: locale === "de" ? "/de/wetter/luxembourg/dudelange" : "/fr/meteo/luxembourg/dudelange" },
    ];
  }

  if (pathname === "/be" || pathname.startsWith("/be/")) {
    return [
      { label: "Brussel", href: "/weer/vlaams-brabant/brussel" },
      { label: "Antwerpen", href: "/weer/antwerpen/antwerpen" },
      { label: "Gent", href: "/weer/oost-vlaanderen/gent" },
      { label: "Luik", href: "/weer/wallonie/liege" },
    ];
  }

  if (pathname.startsWith("/weer/")) {
    const parts = pathname.split("/").filter(Boolean);
    const province = parts[1];

    if (province === "wallonie" || BE_PROVINCES.has(province)) {
      return [
        { label: "Brussel", href: "/weer/vlaams-brabant/brussel" },
        { label: "Antwerpen", href: "/weer/antwerpen/antwerpen" },
        { label: "Gent", href: "/weer/oost-vlaanderen/gent" },
        { label: "Liège", href: "/weer/wallonie/liege" },
      ];
    }
  }

  if (locale === "de") {
    return [
      { label: "Berlin", href: "/de/wetter/berlin/berlin" },
      { label: "Hamburg", href: "/de/wetter/hamburg/hamburg" },
      { label: "München", href: "/de/wetter/bayern/munchen" },
      { label: "Köln", href: "/de/wetter/nordrhein-westfalen/koln" },
    ];
  }

  if (locale === "fr") {
    return [
      { label: "Paris", href: "/fr/meteo/paris/paris" },
      { label: "Marseille", href: "/fr/meteo/bouches-du-rhone/marseille" },
      { label: "Lyon", href: "/fr/meteo/rhone/lyon" },
      { label: "Toulouse", href: "/fr/meteo/haute-garonne/toulouse" },
    ];
  }

  if (locale === "es") {
    return [
      { label: "Madrid", href: "/es/tiempo/espana/madrid" },
      { label: "Barcelona", href: "/es/tiempo/espana/barcelona" },
      { label: "Valencia", href: "/es/tiempo/espana/valencia" },
      { label: "Sevilla", href: "/es/tiempo/espana/sevilla" },
    ];
  }

  return [
    { label: "Hooikoorts", href: "/weer/themas/hooikoorts" },
    { label: "Amsterdam", href: "/weer/noord-holland/amsterdam" },
    { label: "Den Haag", href: "/weer/zuid-holland/den-haag" },
    { label: "BBQ weer", href: "/weer/themas/bbq-weer" },
  ];
}

export default function Footer() {
  const pathname = usePathname() ?? "/";
  const locale: Locale = detectLocale(pathname);
  const cfg = LOCALES[locale];
  const isHome = pathname === cfg.routes.home;
  const items = navItems(pathname, locale);
  const copy = FOOTER_COPY[locale];

  return (
    <footer className="w-full flex flex-col items-center pb-10 mt-12 relative z-10">
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6">
        {!isHome && (
          <Link
            href={cfg.routes.home}
            className="mb-4 inline-flex rounded-2xl px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-transform hover:scale-[1.01]"
            style={{ background: "#3b7ff0" }}
          >
            {copy.back}
          </Link>
        )}

        <div className="card-blue w-full px-6 sm:px-8 py-8">
          <div className="space-y-6 text-center">
            <div className="space-y-3 flex flex-col items-center">
              <Link href={cfg.routes.home} className="inline-block hover:opacity-80 transition-opacity">
                <LogoFull height={28} />
              </Link>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white/90 leading-tight">
                {copy.tagline[0]}
                <br />
                {copy.tagline[1]}
              </p>
            </div>

            <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2">
              {items.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-[13px] font-black uppercase tracking-[0.08em] text-white/90 transition-opacity hover:opacity-70"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <p className="mx-auto max-w-md text-[11px] font-semibold leading-relaxed text-white/55">
              {copy.credits}
            </p>

            <div className="space-y-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              <p>WEERZONE © {new Date().getFullYear()}</p>
              <p>Powered by Tiveau</p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              {SOCIALS.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] uppercase font-black tracking-widest text-white/65 transition-opacity hover:opacity-90"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
