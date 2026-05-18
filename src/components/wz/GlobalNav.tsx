"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Globe2, Menu, X } from "lucide-react";
import WzLogo from "./WzLogo";
import NLPulse from "@/components/NLPulse";
import DEPulse from "@/components/DEPulse";
import FRPulse from "@/components/FRPulse";
import LocatieButton from "@/components/wz/LocatieButton";
import { useSession } from "@/lib/session-context";
import type { PersonaTier } from "@/lib/personas";
import { detectLocale, LOCALES, type Locale } from "@/config/locales";

const LOGO_H = 26;
const BTN_H = 36;

const TIER_COLOR: Record<string, string> = {
  piet:    "#10b981",
  reed:    "#ef4444",
  steve:   "#0ea5e9",
  founder: "#8b5cf6",
};
const TIER_LABEL: Record<string, string> = {
  piet: "P", reed: "R", steve: "S", founder: "★",
};

function LogoBadge({ tier, isFounder }: { tier: PersonaTier | null; isFounder: boolean }) {
  const key = isFounder ? "founder" : (tier ?? null);
  const color = key ? TIER_COLOR[key] : null;
  const label = key ? TIER_LABEL[key] : null;

  return (
    <div className="relative inline-flex shrink-0">
      <WzLogo href={null} height={LOGO_H} />
      {color && label && (
        <span
          className="absolute -right-2 -top-1.5 flex items-center justify-center text-white font-black"
          style={{
            width: 16, height: 16,
            borderRadius: "999px",
            fontSize: 9,
            background: color,
            border: "2px solid rgba(255,255,255,0.9)",
            lineHeight: 1,
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

const HIDDEN_PATHS = ["/app/login", "/app/signup", "/app/reset", "/app/verify", "/auth"];

const COUNTRIES = [
  { code: "nl", label: "NL", href: "/" },
  { code: "be", label: "BE", href: "/weer/wallonie" },
  { code: "de", label: "DE", href: "/de" },
  { code: "fr", label: "FR", href: "/fr" },
  { code: "lu", label: "LU", href: "/fr/meteo/luxembourg" },
  { code: "es", label: "ES", href: "/es" },
] as const;

function activeCountry(pathname: string, locale: Locale) {
  if (pathname.includes("luxembourg")) return "lu";
  if (pathname.includes("wallonie")) return "be";
  if (locale === "de") return "de";
  if (locale === "fr") return "fr";
  if (locale === "es") return "es";
  return "nl";
}

function CountryDropdown({
  value,
  onNavigate,
  compact = false,
}: {
  value: string;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const [countryOpen, setCountryOpen] = useState(false);
  const selected = COUNTRIES.find((country) => country.code === value) ?? COUNTRIES[0];

  return (
    <div className={`relative ${compact ? "w-full" : "w-[112px]"}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={countryOpen}
        onClick={() => setCountryOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-xl px-3 text-[10px] font-black uppercase tracking-widest text-[#0f1a2c] shadow-sm transition-all active:scale-95"
        style={{
          height: BTN_H,
          background: "linear-gradient(180deg, #ffe060 0%, #ffd21a 100%)",
          border: "1px solid rgba(180,130,0,0.35)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6), 0 1px 2px rgba(160,110,0,0.15)",
        }}
      >
        <span className="flex items-center gap-2">
          <Globe2 className="h-3.5 w-3.5 text-black/55" />
          {selected.label}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-black/55" />
      </button>

      {countryOpen && (
        <div
          role="listbox"
          className="absolute right-0 top-[calc(100%+6px)] z-[70] w-full min-w-[112px] overflow-hidden rounded-xl shadow-xl"
          style={{
            background: "linear-gradient(180deg, #ffd21a 0%, #f0c500 100%)",
            border: "1px solid rgba(180,130,0,0.35)",
          }}
        >
          {COUNTRIES.map((country) => (
            <button
              key={country.code}
              type="button"
              role="option"
              aria-selected={country.code === value}
              onClick={() => {
                setCountryOpen(false);
                onNavigate?.();
                window.location.href = country.href;
              }}
              className="flex h-9 w-full items-center px-4 text-left text-[10px] font-black uppercase tracking-widest text-[#0f1a2c] transition-colors hover:bg-black/10"
              style={{ background: country.code === value ? "rgba(0,0,0,0.12)" : undefined }}
            >
              {country.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GlobalNav() {
  const pathname = usePathname() ?? "/";
  const { user, tier, isFounder } = useSession();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (HIDDEN_PATHS.some(p => pathname.startsWith(p))) return null;

  const locale: Locale = detectLocale(pathname);
  const localeConfig = LOCALES[locale];
  const links = localeConfig.nav;
  const homeHref = localeConfig.routes.home;
  const isDE = locale === "de";
  const isFR = locale === "fr";
  const country = activeCountry(pathname, locale);

  function isActive(linkHref: string, key: string) {
    if (key === "piet" || key === "mein-wetter" || key === "ma-meteo") {
      return pathname.startsWith(isFR ? "/fr/ma-meteo" : isDE ? "/de/mein-wetter" : "/mijnweer") || pathname.startsWith(isFR ? "/fr/meteo" : isDE ? "/de/wetter" : "/weer") || pathname.startsWith("/jouwweer");
    }
    if (key === "reed" || key === "warnungen" || key === "waarschuwingen" || key === "alertes") {
      return pathname.startsWith(isFR ? "/fr/alertes" : isDE ? "/de/warnungen" : "/waarschuwingen");
    }
    if (key === "preise" || key === "prijzen" || key === "tarifs") return pathname.startsWith(isFR ? "/fr/tarifs" : isDE ? "/de/preise" : "/prijzen");
    if (key === "uber-uns" || key === "over" || key === "a-propos") return pathname.startsWith(isFR ? "/fr/a-propos" : isDE ? "/de/uber-uns" : "/over");
    if (key === "kontakt" || key === "contact") return pathname.startsWith(isFR ? "/fr/contact" : isDE ? "/de/kontakt" : "/contact");
    return pathname === linkHref || pathname.startsWith(linkHref + "/");
  }

  const actionBtnClass = "inline-flex items-center justify-center px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap min-w-[100px]";

  // Puur WEERZONE-zon gradient: lichter top → kern → diepere onderkant.
  // Radiale sheen bovenaan voor frosted-glow effect. Geen brushed lijnen.
  const headerBg =
    "radial-gradient(ellipse at top, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.08) 40%, transparent 65%)," +
    "linear-gradient(180deg, #ffe060 0%, #ffd21a 55%, #f5c500 100%)";
  const headerOverlayBg = "linear-gradient(180deg, #ffd21a 0%, #f0c500 100%)";

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: headerBg,
        borderBottom: "1px solid rgba(180,130,0,0.25)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.75), inset 0 -1px 0 rgba(160,110,0,0.10), 0 1px 2px rgba(160,110,0,0.10), 0 8px 24px rgba(160,110,0,0.12)",
        color: "#0f1a2c",
      }}
    >
      {isFR ? <FRPulse /> : isDE ? <DEPulse /> : <NLPulse />}

      {/* Main Bar */}
      <div className="flex items-center max-w-[1200px] mx-auto px-4 md:px-6 py-2.5 gap-2 md:gap-3">
        
        {/* Left: Brand & Menu Group (Logo - Hamburger - Context) */}
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          {/* Logo on the far left (Brand Anchor) */}
          <Link href={homeHref} aria-label="Weerzone home" className="transition-opacity hover:opacity-80 pr-1">
            <LogoBadge tier={tier} isFounder={isFounder} />
          </Link>

          {/* Hamburger Menu (Gateway) */}
          <button
            onClick={() => setOpen(!open)}
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-all hover:bg-black/5 border border-transparent active:scale-95"
            aria-label="Menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <div className="w-px h-6 bg-black/10 hidden sm:block mx-1" />

        {/* Middle: Location Button (Context Action - stetching on mobile) */}
        <div className="flex-1 min-w-0 flex justify-end lg:justify-start">
          <LocatieButton 
            locale={locale} 
            active={pathname.startsWith(isFR ? "/fr/meteo" : isDE ? "/de/wetter" : "/weer")}
            className="!h-[36px] !px-4 !rounded-xl !text-[10px] !font-black !uppercase !tracking-widest shadow-sm"
          />
        </div>

        {/* Right: Flags & Actions (Desktop only - 1024px+) */}
        <div className="hidden lg:flex items-center gap-4 shrink-0">
          <CountryDropdown value={country} />

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link href="/app" className={actionBtnClass} style={{ height: BTN_H, background: "rgba(0,0,0,0.08)", border: "1px solid rgba(0,0,0,0.10)", color: "#0f1a2c" }}>
                  Dashboard
                </Link>
                <button
                  onClick={async () => {
                    const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
                    await createSupabaseBrowserClient().auth.signOut();
                    window.location.href = "/";
                  }}
                  className={actionBtnClass}
                  style={{ background: "#0f1a2c", height: BTN_H, color: "white", boxShadow: "0 2px 8px rgba(15,26,44,0.25)" }}
                >
                  {isFR ? "Déconnexion" : isDE ? "Abmelden" : "Log uit"}
                </button>
              </>
            ) : (
              <>
                <Link href={isFR ? "/app/login?lang=fr" : isDE ? "/app/login?lang=de" : "/app/login"} className={actionBtnClass} style={{ height: BTN_H, background: "rgba(0,0,0,0.08)", border: "1px solid rgba(0,0,0,0.10)", color: "#0f1a2c" }}>
                  {isFR ? "Se connecter" : isDE ? "Anmelden" : "Inloggen"}
                </Link>
                <Link href={isFR ? "/fr/tarifs" : isDE ? "/de/preise" : "/app/signup"} className={actionBtnClass} style={{ background: "#0f1a2c", height: BTN_H, color: "white", boxShadow: "0 2px 8px rgba(15,26,44,0.25)" }}>
                  {isFR ? "S'inscrire" : isDE ? "Jetzt starten" : "Aanmelden"}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Unified Hamburger Menu Overlay */}
      {open && (
        <div
          className="absolute top-full left-0 right-0 shadow-2xl border-t border-white/30 z-50 animate-in slide-in-from-top duration-200"
          style={{
            background: headerOverlayBg,
          }}
        >
          <div className="max-w-[1200px] mx-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Column 1: Main Pages & Flags (Flags moved here for mobile/tablet) */}
            <div>
              <div className="lg:hidden mb-6">
                <CountryDropdown value={country} compact onNavigate={() => setOpen(false)} />
              </div>

              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/35 mb-4 px-4">Menu</p>
              <nav className="grid gap-1">
                {[
                  ...links,
                  { key: "a-propos", label: isFR ? "À Propos" : isDE ? "Über uns" : "Over ons", href: isFR ? "/fr/a-propos" : isDE ? "/de/uber-uns" : "/over" },
                  { key: "contact", label: "Contact", href: isFR ? "/fr/contact" : isDE ? "/de/kontakt" : "/contact" }
                ].map(l => {
                  const active = isActive(l.href, l.key);
                  return (
                    <Link
                      key={l.key}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="px-4 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-between group"
                      style={{
                        color: active ? "#0f1a2c" : "rgba(15,26,44,0.60)",
                        background: active ? "rgba(0,0,0,0.08)" : "transparent",
                      }}
                    >
                      <span>{l.label}</span>
                      <span className={`w-1.5 h-1.5 rounded-full bg-[#0f1a2c] transition-transform ${active ? 'scale-100' : 'scale-0 group-hover:scale-50'}`} />
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Column 2: Account Actions (Shown in menu for mobile/tablet) */}
            <div className="lg:hidden">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/35 mb-4 px-4">
                {isFR ? "Compte" : "Account"}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {user ? (
                  <>
                    <Link href="/app" onClick={() => setOpen(false)} className="py-4 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest transition-all bg-black/5 border border-black/5" style={{ color: "#0f1a2c" }}>
                      Dashboard
                    </Link>
                    <button
                      onClick={async () => {
                        setOpen(false);
                        const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
                        await createSupabaseBrowserClient().auth.signOut();
                        window.location.href = "/";
                      }}
                      className="py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white bg-[#0f1a2c]"
                    >
                      {isFR ? "Déconnexion" : isDE ? "Abmelden" : "Log uit"}
                    </button>
                  </>
                ) : (
                  <>
                    <Link href={isFR ? "/app/login?lang=fr" : isDE ? "/app/login?lang=de" : "/app/login"} onClick={() => setOpen(false)} className="py-4 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest transition-all bg-black/5 border border-black/5" style={{ color: "#0f1a2c" }}>
                      {isFR ? "Se connecter" : isDE ? "Anmelden" : "Inloggen"}
                    </Link>
                    <Link href={isFR ? "/fr/tarifs" : isDE ? "/de/preise" : "/app/signup"} onClick={() => setOpen(false)} className="py-4 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest text-white bg-[#0f1a2c]">
                      {isFR ? "S'inscrire" : isDE ? "Jetzt starten" : "Aanmelden"}
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Column 3: Brand/Info */}
            <div className="hidden lg:block border-l border-black/10 pl-8">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/35 mb-4">Weerzone</p>
               <div className="space-y-4">
                  <div className="p-5 rounded-3xl bg-black/5 border border-black/5">
                     <p className="text-base font-black text-slate-900 leading-tight">
                        {isFR ? "Météo hyperlocale. Aujourd'hui et demain." : "Hyperlokaal weer. Vandaag en morgen."}
                     </p>
                  </div>
               </div>
            </div>

          </div>
        </div>
      )}

    </header>
  );
}
