"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import WzLogo from "./WzLogo";
import NLPulse from "@/components/NLPulse";
import LocatieButton from "@/components/wz/LocatieButton";
import { useSession } from "@/lib/session-context";
import type { PersonaTier } from "@/lib/personas";

const LOGO_H = 24;
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
      <WzLogo height={LOGO_H} />
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

const LINKS = [
  { key: "home",    label: "Home",           href: "/homepage" },
  { key: "piet",    label: "Mijn Weer",      href: "/mijnweer" },
  { key: "reed",    label: "Waarschuwingen", href: "/waarschuwingen" },
  { key: "prijzen", label: "Prijzen",        href: "/prijzen" },
  { key: "about",   label: "Over",           href: "/over" },
  { key: "contact", label: "Contact",        href: "/contact" },
];

function isActive(pathname: string, key: string) {
  if (key === "home")    return pathname === "/" || pathname.startsWith("/homepage");
  if (key === "piet")    return pathname.startsWith("/mijnweer") || pathname.startsWith("/jouwweer");
  if (key === "reed")    return pathname.startsWith("/waarschuwingen");
  if (key === "prijzen") return pathname.startsWith("/prijzen");
  if (key === "about")   return pathname.startsWith("/over");
  if (key === "contact") return pathname.startsWith("/contact");
  return false;
}

const HIDDEN_PATHS = ["/app/login", "/app/signup", "/app/reset", "/app/verify", "/auth"];

const GLASS_BTN = {
  background: "rgba(255,255,255,0.6)",
  border: "1px solid rgba(255,255,255,0.8)",
  color: "var(--text-primary)",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
} as const;

export default function GlobalNav() {
  const pathname = usePathname() ?? "/";
  const { user, tier, isFounder } = useSession();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (HIDDEN_PATHS.some(p => pathname.startsWith(p))) return null;

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.5)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.7)",
        color: "var(--text-primary)",
      }}
    >
      <NLPulse />
      {/* Desktop */}
      <div className="hidden md:flex items-center max-w-[1200px] mx-auto px-5 py-2" style={{ gap: 12 }}>

        <Link href="/homepage" aria-label="Weerzone home">
          <LogoBadge tier={tier} isFounder={isFounder} />
        </Link>

        <div className="w-px self-stretch my-1.5" style={{ background: "rgba(0,0,0,0.08)" }} />

        <nav className="flex items-center gap-0.5 flex-1">
          <LocatieButton active={pathname.startsWith("/weer")} />
          {LINKS.map(l => {
            const active = isActive(pathname, l.key);
            return (
              <Link
                key={l.key}
                href={l.href}
                className="px-3 py-1.5 rounded-2xl text-[11px] font-black uppercase transition-all whitespace-nowrap"
                style={{
                  letterSpacing: "0.08em",
                  color: active ? "var(--text-primary)" : "rgba(15,26,44,0.5)",
                  background: active ? "rgba(255,255,255,0.7)" : "transparent",
                  border: active ? "1px solid rgba(255,255,255,0.9)" : "1px solid transparent",
                  boxShadow: active ? "0 1px 4px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)" : "none",
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/app"
                className="inline-flex items-center px-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all hover:brightness-95"
                style={{ height: BTN_H, ...GLASS_BTN }}
              >
                Mijn Weerzone
              </Link>
              <button
                onClick={async () => {
                  const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
                  await createSupabaseBrowserClient().auth.signOut();
                  window.location.href = "/";
                }}
                className="inline-flex items-center px-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--wz-brand)", height: BTN_H }}
              >
                Log uit
              </button>
            </>
          ) : (
            <>
              <Link
                href="/app/login"
                className="inline-flex items-center px-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all hover:brightness-95"
                style={{ height: BTN_H, ...GLASS_BTN }}
              >
                Inloggen
              </Link>
              <Link
                href="/app/signup"
                className="inline-flex items-center px-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--wz-brand)", height: BTN_H }}
              >
                Aanmelden
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex items-center justify-between gap-2 px-4 py-2.5">
        <Link href="/homepage" aria-label="Weerzone home">
          <LogoBadge tier={tier} isFounder={isFounder} />
        </Link>
        <div className="flex items-center gap-2">
          <LocatieButton compact active={pathname.startsWith("/weer")} />
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            aria-label="Menu"
            aria-expanded={open}
            className="w-9 h-9 flex items-center justify-center rounded-2xl transition-all"
            style={open
              ? { background: "rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.08)", color: "var(--text-primary)" }
              : { ...GLASS_BTN }
            }
          >
            {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden px-4 pb-4 pt-2"
          style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
        >
          <nav className="grid gap-0.5 mb-3">
            <LocatieButton active={pathname.startsWith("/weer")} />
            {LINKS.map(l => {
              const active = isActive(pathname, l.key);
              return (
                <Link
                  key={l.key}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="px-3.5 py-3 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all"
                  style={{
                    color: active ? "var(--text-primary)" : "rgba(15,26,44,0.55)",
                    background: active ? "rgba(255,255,255,0.7)" : "transparent",
                    border: active ? "1px solid rgba(255,255,255,0.9)" : "1px solid transparent",
                    boxShadow: active ? "0 1px 4px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)" : "none",
                  }}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
          <div
            className="grid grid-cols-2 gap-2 pt-3"
            style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
          >
            {user ? (
              <>
                <Link
                  href="/app"
                  onClick={() => setOpen(false)}
                  className="py-2.5 rounded-2xl text-center text-[11px] font-black uppercase tracking-widest transition-all hover:brightness-95"
                  style={GLASS_BTN}
                >
                  Mijn Weerzone
                </Link>
                <button
                  onClick={async () => {
                    setOpen(false);
                    const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
                    await createSupabaseBrowserClient().auth.signOut();
                    window.location.href = "/";
                  }}
                  className="py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white"
                  style={{ background: "var(--wz-brand)" }}
                >
                  Log uit
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/app/login"
                  onClick={() => setOpen(false)}
                  className="py-2.5 rounded-2xl text-center text-[11px] font-black uppercase tracking-widest transition-all hover:brightness-95"
                  style={GLASS_BTN}
                >
                  Inloggen
                </Link>
                <Link
                  href="/app/signup"
                  onClick={() => setOpen(false)}
                  className="py-2.5 rounded-2xl text-center text-[11px] font-black uppercase tracking-widest text-white"
                  style={{ background: "var(--wz-brand)" }}
                >
                  Aanmelden
                </Link>
              </>
            )}
          </div>
        </div>
      )}

    </header>
  );
}
