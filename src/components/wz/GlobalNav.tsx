"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import WzLogo from "./WzLogo";
import NLPulse from "@/components/NLPulse";
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
  piet: "P", reed: "R", steve: "S", founder: "*",
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

const HIDDEN_PATHS = ["/app/login", "/app/signup", "/app/reset", "/app/verify", "/auth", "/hartmanwk2026"];

function AnonymousNav({ loading }: { loading: boolean }) {
  const headerBg =
    "radial-gradient(ellipse at top, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.08) 40%, transparent 65%)," +
    "linear-gradient(180deg, #ffe060 0%, #ffd21a 55%, #f5c500 100%)";

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: headerBg,
        borderBottom: "1px solid rgba(180,130,0,0.25)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.75), 0 8px 24px rgba(160,110,0,0.12)",
        color: "#0f1a2c",
      }}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-2.5 md:px-6">
        <Link href="/" aria-label="Weerzone home" className="transition-opacity hover:opacity-80">
          <LogoBadge tier={null} isFounder={false} />
        </Link>
        {!loading && (
          <div className="flex items-center gap-2">
            <Link href="/app/login" className="rounded-xl border border-black/10 bg-white/25 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-950 sm:px-4">
              Inloggen
            </Link>
            <Link href="/app/signup" className="rounded-xl bg-slate-950 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white sm:px-4">
              Account maken
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export default function GlobalNav() {
  const pathname = usePathname() ?? "/";
  const { user, tier, isFounder, agentPreferences, loading } = useSession();
  const [open, setOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<"vandaag" | "morgen" | null>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function toggleMenu() {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) {
      if (pathname.startsWith("/vandaag")) setExpandedSection("vandaag");
      else if (pathname.startsWith("/morgen")) setExpandedSection("morgen");
    }
  }

  if (HIDDEN_PATHS.some(p => pathname.startsWith(p))) return null;
  if (!user) return <AnonymousNav loading={loading} />;

  const locale: Locale = detectLocale(pathname);
  const localeConfig = LOCALES[locale];
  const links = localeConfig.nav;
  const homeHref = localeConfig.routes.home;
  const loginHref = "/app/login";
  const signupHref = "/app/signup";

  function isActive(linkHref: string, key: string) {
    if (key === "over") return pathname.startsWith("/over");
    if (key === "contact") return pathname.startsWith("/contact");
    return pathname === linkHref || pathname.startsWith(linkHref + "/");
  }

  const actionBtnClass = "inline-flex items-center justify-center px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap min-w-[100px]";

  // Puur WEERZONE-zon gradient: lichter boven, warmer midden, diepere onderkant.
  // Radiale glans bovenaan voor een rustig frosted effect.
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
      <NLPulse />

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
            onClick={toggleMenu}
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
            active={pathname.startsWith("/weer")}
            className="!h-[36px] !px-4 !rounded-xl !text-[10px] !font-black !uppercase !tracking-widest shadow-sm"
          />
        </div>

        {/* Right: Flags & Actions (Desktop only - 1024px+) */}
        <div className="hidden lg:flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  href="/mijn-weerzone"
                  className={actionBtnClass}
                  style={{
                    height: BTN_H,
                    background: "linear-gradient(180deg, #ffe060 0%, #ffd21a 100%)",
                    border: "1px solid rgba(180,130,0,0.35)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6), 0 1px 2px rgba(160,110,0,0.15)",
                    color: "#0f1a2c",
                  }}
                >
                  Mijn Weerzone
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
                  Log uit
                </button>
              </>
            ) : (
              <>
                <Link
                  href={loginHref}
                  className={actionBtnClass}
                  style={{
                    height: BTN_H,
                    background: "linear-gradient(180deg, #ffe060 0%, #ffd21a 100%)",
                    border: "1px solid rgba(180,130,0,0.35)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6), 0 1px 2px rgba(160,110,0,0.15)",
                    color: "#0f1a2c",
                  }}
                >
                  Inloggen
                </Link>
                <Link href={signupHref} className={actionBtnClass} style={{ background: "#0f1a2c", height: BTN_H, color: "white", boxShadow: "0 2px 8px rgba(15,26,44,0.25)" }}>
                  Maak een account aan
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
            
            {/* Column 1: Main Pages */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/35 mb-4 px-4">Menu</p>
              <nav className="grid gap-1">
                {(() => {
                  return links.map(l => {
                    const active = isActive(l.href, l.key);
                    const isStrong = l.weight === "strong";
                    const isMuted  = l.weight === "muted";
                    const isDaySection = l.key === "vandaag" || l.key === "morgen";

                    if (isDaySection) {
                      const section = l.key as "vandaag" | "morgen";
                      const expanded = expandedSection === section;
                      const items = [
                        { key: "piet", label: "Piet", detail: "Dagbeeld" },
                        { key: "reed", label: "Reed", detail: "Risico" },
                        { key: "koos", label: "Koos", detail: "Eropuit" },
                      ].filter((item) => agentPreferences[item.key as keyof typeof agentPreferences]);

                      return (
                        <div key={l.key} className="overflow-hidden rounded-2xl" style={{ background: active ? "rgba(0,0,0,0.08)" : "transparent" }}>
                          <div className="flex items-stretch">
                            <Link
                              href={l.href}
                              onClick={() => setOpen(false)}
                              className="min-w-0 flex-1 px-4 py-3 transition-all"
                              style={{ color: active ? "#0f1a2c" : "rgba(15,26,44,0.60)" }}
                            >
                              <span className="block text-sm font-black uppercase tracking-widest">{l.label}</span>
                              {l.sublabel && <span className="mt-1 block text-[11px] font-medium normal-case tracking-normal opacity-65">{l.sublabel}</span>}
                            </Link>
                            <button
                              type="button"
                              onClick={() => setExpandedSection(expanded ? null : section)}
                              disabled={items.length === 0}
                              className="flex w-12 items-center justify-center rounded-xl text-slate-900/60 transition hover:bg-black/5 hover:text-slate-900 disabled:cursor-default disabled:opacity-25"
                              aria-label={`${expanded ? "Verberg" : "Toon"} Piet, Reed en Koos voor ${l.label.toLowerCase()}`}
                              aria-expanded={expanded}
                            >
                              <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
                            </button>
                          </div>
                          {expanded && items.length > 0 && (
                            <div className="grid gap-1 px-2 pb-2">
                              {items.map((item) => (
                                <Link
                                  key={item.key}
                                  href={`${l.href}#${item.key}`}
                                  onClick={() => setOpen(false)}
                                  className="flex items-center justify-between rounded-xl bg-white/35 px-4 py-3 text-slate-900 transition hover:bg-white/60"
                                >
                                  <span className="text-sm font-extrabold">{item.label}</span>
                                  <span className="text-[11px] font-semibold text-slate-600">{item.detail}</span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    if (isStrong) {
                      return (
                        <Link
                          key={l.key}
                          href={l.href}
                          onClick={() => setOpen(false)}
                          className="mt-3 px-4 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-between group"
                          style={{
                            background: "#0f1a2c",
                            color: "white",
                            boxShadow: "0 2px 8px rgba(15,26,44,0.25)",
                          }}
                        >
                          <span>{l.label}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                        </Link>
                      );
                    }

                    return (
                      <Link
                        key={l.key}
                        href={l.href}
                        onClick={() => setOpen(false)}
                        className="px-4 py-3 rounded-2xl transition-all flex items-start justify-between group"
                        style={{
                          color: active ? "#0f1a2c" : "rgba(15,26,44,0.60)",
                          background: active ? "rgba(0,0,0,0.08)" : "transparent",
                        }}
                      >
                        <div className="flex flex-col">
                          <span
                            className={
                              isMuted
                                ? "text-[11px] font-bold uppercase tracking-[0.18em] opacity-70"
                                : "text-sm font-black uppercase tracking-widest"
                            }
                          >
                            {l.label}
                          </span>
                          {l.sublabel && (
                            <span className="text-[11px] font-medium mt-1 normal-case tracking-normal opacity-65">
                              {l.sublabel}
                            </span>
                          )}
                        </div>
                        <span
                          className={`mt-1.5 w-1.5 h-1.5 rounded-full bg-[#0f1a2c] transition-transform ${
                            active ? "scale-100" : "scale-0 group-hover:scale-50"
                          }`}
                        />
                      </Link>
                    );
                  });
                })()}
              </nav>
            </div>

            {/* Column 2: Account Actions (Shown in menu for mobile/tablet) */}
            <div className="lg:hidden">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/35 mb-4 px-4">
                Account
              </p>
              <div className="grid grid-cols-2 gap-2">
                {user ? (
                  <>
                    <Link href="/mijn-weerzone" onClick={() => setOpen(false)} className="py-4 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest transition-all bg-black/5 border border-black/5" style={{ color: "#0f1a2c" }}>
                      Mijn Weerzone
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
                      Log uit
                    </button>
                  </>
                ) : (
                  <>
                    <Link href={loginHref} onClick={() => setOpen(false)} className="py-4 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest transition-all bg-black/5 border border-black/5" style={{ color: "#0f1a2c" }}>
                      Inloggen
                    </Link>
                    <Link href={signupHref} onClick={() => setOpen(false)} className="py-4 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest text-white bg-[#0f1a2c]">
                      Maak een account aan
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
                        Weer voor jouw plek. Vandaag en morgen.
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
