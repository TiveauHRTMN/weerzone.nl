"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
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

// SVG Flag Components
const FlagNL = () => (
  <svg viewBox="0 0 640 480" className="w-full h-full"><rect width="640" height="480" fill="#21468b"/><rect width="640" height="320" fill="#fff"/><rect width="640" height="160" fill="#ae1c28"/></svg>
);
const FlagBE = () => (
  <svg viewBox="0 0 640 480" className="w-full h-full"><rect width="640" height="480" fill="#ed2939"/><rect width="426.7" height="480" fill="#fae042"/><rect width="213.3" height="480" fill="#000"/></svg>
);
const FlagDE = () => (
  <svg viewBox="0 0 640 480" className="w-full h-full"><rect width="640" height="480" fill="#ffce00"/><rect width="640" height="320" fill="#d00"/><rect width="640" height="160" fill="#000"/></svg>
);
const FlagFR = () => (
  <svg viewBox="0 0 640 480" className="w-full h-full"><rect width="640" height="480" fill="#ed2939"/><rect width="426.7" height="480" fill="#fff"/><rect width="213.3" height="480" fill="#002395"/></svg>
);
const FlagLU = () => (
  <svg viewBox="0 0 640 480" className="w-full h-full"><rect width="640" height="480" fill="#00a3e0"/><rect width="640" height="320" fill="#fff"/><rect width="640" height="160" fill="#ea1423"/></svg>
);

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

  const flags = [
    { code: 'nl', component: <FlagNL />, label: 'NL', href: '/' },
    { code: 'be', component: <FlagBE />, label: 'BE', href: '/weer/wallonie' },
    { code: 'de', component: <FlagDE />, label: 'DE', href: '/de' },
    { code: 'fr', component: <FlagFR />, label: 'FR', href: '/fr' },
    { code: 'lu', component: <FlagLU />, label: 'LU', href: '/fr/meteo/luxembourg' }
  ];

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
          <div className="flex bg-black/5 rounded-lg p-0.5 border border-black/10">
            {flags.map((loc) => {
                const active = (loc.code === 'nl' && !isDE && !isFR && !pathname.includes('wallonie') && !pathname.includes('luxembourg')) || 
                             (loc.code === 'de' && isDE && !pathname.includes('luxembourg')) || 
                             (loc.code === 'fr' && isFR && !pathname.includes('wallonie') && !pathname.includes('luxembourg')) ||
                             (loc.code === 'be' && pathname.includes('wallonie')) ||
                             (loc.code === 'lu' && pathname.includes('luxembourg'));
                return (
                  <Link 
                    key={loc.code}
                    href={loc.href} 
                    className={`w-9 h-8 flex items-center justify-center rounded-md p-1.5 transition-all ${active ? 'bg-white shadow-sm grayscale-0' : 'grayscale opacity-50 hover:opacity-100 hover:grayscale-0'}`}
                    title={loc.label}
                  >
                    <div className="w-full h-full rounded-[1px] overflow-hidden">
                      {loc.component}
                    </div>
                  </Link>
                );
            })}
          </div>

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
              <div className="flex lg:hidden bg-black/5 rounded-xl p-1 border border-black/10 mb-6 justify-between">
                {flags.map((loc) => {
                    const active = (loc.code === 'nl' && !isDE && !isFR && !pathname.includes('wallonie') && !pathname.includes('luxembourg')) || 
                                 (loc.code === 'de' && isDE && !pathname.includes('luxembourg')) || 
                                 (loc.code === 'fr' && isFR && !pathname.includes('wallonie') && !pathname.includes('luxembourg')) ||
                                 (loc.code === 'be' && pathname.includes('wallonie')) ||
                                 (loc.code === 'lu' && pathname.includes('luxembourg'));
                    return (
                      <Link 
                        key={loc.code}
                        href={loc.href} 
                        className={`flex-1 h-10 flex items-center justify-center rounded-lg transition-all ${active ? 'bg-white shadow-sm grayscale-0' : 'grayscale opacity-40 hover:opacity-100 hover:grayscale-0'}`}
                      >
                        <div className="w-6 h-5 rounded-[1px] overflow-hidden">
                          {loc.component}
                        </div>
                      </Link>
                    );
                })}
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
