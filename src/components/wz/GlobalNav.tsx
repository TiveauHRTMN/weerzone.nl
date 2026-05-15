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

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "linear-gradient(160deg, #ffe874 0%, #ffd21a 50%, #e8ba00 100%)",
        borderBottom: "1px solid rgba(160,110,0,0.22)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -1px 0 rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.07)",
        color: "#0f1a2c",
      }}
    >
      {isFR ? <FRPulse /> : isDE ? <DEPulse /> : <NLPulse />}

      {/* Main Bar */}
      <div className="flex items-center max-w-[1200px] mx-auto px-4 md:px-6 py-2.5 gap-3 md:gap-4">
        
        {/* Left: Hamburger & Logo */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <button
            onClick={() => setOpen(!open)}
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-all hover:bg-black/5 border border-transparent active:scale-95"
            aria-label="Menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href={homeHref} aria-label="Weerzone home" className="transition-opacity hover:opacity-80">
            <LogoBadge tier={tier} isFounder={isFounder} />
          </Link>
        </div>

        <div className="w-px h-6 bg-black/10 hidden sm:block" />

        {/* Middle: Location Button (Visible on Desktop, hidden or compact on mobile if space is tight) */}
        <div className="flex-1 min-w-0">
          <LocatieButton 
            locale={locale} 
            active={pathname.startsWith(isFR ? "/fr/meteo" : isDE ? "/de/wetter" : "/weer")}
            className="!h-[36px] !px-4 !rounded-xl !text-[10px] !font-black !uppercase !tracking-widest"
          />
        </div>

        {/* Right: Flags & Actions (Desktop) */}
        <div className="hidden lg:flex items-center gap-4 shrink-0">
          <div className="flex bg-black/5 rounded-lg p-0.5 border border-black/10">
            {[
              { code: 'nl', flag: '🇳🇱', label: 'NL', href: '/' },
              { code: 'be', flag: '🇧🇪', label: 'BE', href: '/weer/wallonie' },
              { code: 'de', flag: '🇩🇪', label: 'DE', href: '/de' },
              { code: 'fr', flag: '🇫🇷', label: 'FR', href: '/fr' }
            ].map((loc) => {
                const active = (loc.code === 'nl' && !isDE && !isFR && !pathname.includes('wallonie')) || 
                             (loc.code === 'de' && isDE) || 
                             (loc.code === 'fr' && isFR) ||
                             (loc.code === 'be' && pathname.includes('wallonie'));
                return (
                  <Link 
                    key={loc.code}
                    href={loc.href} 
                    className={`w-9 h-8 flex items-center justify-center rounded-md text-xl transition-all ${active ? 'bg-white shadow-sm grayscale-0' : 'grayscale opacity-50 hover:opacity-100 hover:grayscale-0'}`}
                    title={loc.label}
                  >
                    {loc.flag}
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

        {/* Flags (Mobile only, shown next to menu if desktop right is hidden) */}
        <div className="flex lg:hidden bg-black/5 rounded-lg p-0.5 border border-black/10 shrink-0">
             {[
              { code: 'nl', flag: '🇳🇱', href: '/' },
              { code: 'be', flag: '🇧🇪', href: '/weer/wallonie' },
              { code: 'de', flag: '🇩🇪', href: '/de' },
              { code: 'fr', flag: '🇫🇷', href: '/fr' }
            ].map((loc) => {
                const active = (loc.code === 'nl' && !isDE && !isFR && !pathname.includes('wallonie')) || 
                             (loc.code === 'de' && isDE) || 
                             (loc.code === 'fr' && isFR) ||
                             (loc.code === 'be' && pathname.includes('wallonie'));
                return (
                  <Link 
                    key={loc.code}
                    href={loc.href} 
                    className={`w-7 h-6 flex items-center justify-center rounded-md text-sm transition-all ${active ? 'bg-white shadow-sm grayscale-0' : 'grayscale opacity-40'}`}
                  >
                    {loc.flag}
                  </Link>
                );
            })}
        </div>
      </div>

      {/* Unified Hamburger Menu Overlay */}
      {open && (
        <div
          className="absolute top-full left-0 right-0 bg-white shadow-2xl border-t border-slate-100 z-50 animate-in slide-in-from-top duration-200"
          style={{ background: "rgba(255,255,255,0.98)", backdropFilter: "blur(20px)" }}
        >
          <div className="max-w-[1200px] mx-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Column 1: Main Pages */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-4">Menu</p>
              <nav className="grid gap-1">
                {links.map(l => {
                  const active = isActive(l.href, l.key);
                  return (
                    <Link
                      key={l.key}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="px-4 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-between group"
                      style={{
                        color: active ? "#3b7ff0" : "#0f1a2c",
                        background: active ? "#3b7ff0/5" : "transparent",
                      }}
                    >
                      <span>{l.label}</span>
                      <span className={`w-1.5 h-1.5 rounded-full bg-[#3b7ff0] transition-transform ${active ? 'scale-100' : 'scale-0 group-hover:scale-50'}`} />
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Column 2: Account Actions (especially for mobile/tablet where they might be hidden in the main bar) */}
            <div className="lg:hidden">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-4">Compte</p>
              <div className="grid gap-2">
                {user ? (
                  <>
                    <Link href="/app" onClick={() => setOpen(false)} className="py-4 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest transition-all bg-slate-50 border border-slate-100">
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
                    <Link href={isFR ? "/app/login?lang=fr" : isDE ? "/app/login?lang=de" : "/app/login"} onClick={() => setOpen(false)} className="py-4 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest transition-all bg-slate-50 border border-slate-100">
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
            <div className="hidden lg:block border-l border-slate-100 pl-8">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Weerzone</p>
               <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#ffd21a]/10 border border-[#ffd21a]/20">
                     <p className="text-xs font-bold text-slate-800 leading-relaxed">
                        {isFR ? "Prévisions hyperlocales basées op 5 modèles météorologiques. Précis, honnête et sans fioritures." : "Hyperlokale weersverwachting op basis van 5 weermodellen. Eerlijk, nuchter en zonder poespas."}
                     </p>
                  </div>
                  <nav className="grid gap-2">
                     <Link href={isFR ? "/fr/a-propos" : "/over"} className="text-[10px] font-black uppercase text-slate-400 hover:text-[#0f1a2c] transition-colors">{isFR ? "À Propos" : "Over ons"}</Link>
                     <Link href={isFR ? "/fr/contact" : "/contact"} className="text-[10px] font-black uppercase text-slate-400 hover:text-[#0f1a2c] transition-colors">Contact</Link>
                  </nav>
               </div>
            </div>

          </div>
        </div>
      )}

    </header>
  );
}
