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

const LOGO_H = 26;
const BTN_H = 38;

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
  { key: "piet",    label: "Mijn Weer",      href: "/mijnweer" },
  { key: "reed",    label: "Waarschuwingen", href: "/waarschuwingen" },
  { key: "prijzen", label: "Prijzen",        href: "/prijzen" },
  { key: "over",    label: "Over",           href: "/over" },
  { key: "contact", label: "Contact",        href: "/contact" },
];

function isActive(pathname: string, key: string) {
  if (key === "piet")    return pathname.startsWith("/mijnweer") || pathname.startsWith("/jouwweer");
  if (key === "reed")    return pathname.startsWith("/waarschuwingen");
  if (key === "prijzen") return pathname.startsWith("/prijzen");
  if (key === "over")    return pathname.startsWith("/over");
  if (key === "contact") return pathname.startsWith("/contact");
  return false;
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
      <NLPulse />

      {/* Desktop */}
      <div className="hidden md:flex items-center max-w-[1200px] mx-auto px-6 py-2.5" style={{ gap: 16 }}>

        <Link href="/" aria-label="Weerzone home" className="shrink-0 transition-opacity hover:opacity-80">
          <LogoBadge tier={tier} isFounder={isFounder} />
        </Link>

        <div className="w-px self-stretch my-1" style={{ background: "rgba(0,0,0,0.10)" }} />

        <nav className="flex items-center gap-1 flex-1">
          <LocatieButton active={pathname.startsWith("/weer")} />
          {LINKS.map(l => {
            const active = isActive(pathname, l.key);
            return (
              <Link
                key={l.key}
                href={l.href}
                className="px-3.5 py-2 rounded-xl text-[11px] font-black uppercase transition-all whitespace-nowrap"
                style={{
                  letterSpacing: "0.07em",
                  color: active ? "#0f1a2c" : "rgba(15,26,44,0.50)",
                  background: active ? "rgba(0,0,0,0.11)" : "transparent",
                  boxShadow: active
                    ? "inset 0 1px 2px rgba(0,0,0,0.08), inset 0 -1px 0 rgba(255,255,255,0.4)"
                    : "none",
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
                className="inline-flex items-center px-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all hover:brightness-95"
                style={{
                  height: BTN_H,
                  background: "rgba(0,0,0,0.08)",
                  border: "1px solid rgba(0,0,0,0.10)",
                  color: "#0f1a2c",
                  letterSpacing: "0.07em",
                }}
              >
                Dashboard
              </Link>
              <button
                onClick={async () => {
                  const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
                  await createSupabaseBrowserClient().auth.signOut();
                  window.location.href = "/";
                }}
                className="inline-flex items-center px-4 rounded-xl text-[11px] font-black uppercase tracking-widest text-white transition-all hover:brightness-110"
                style={{
                  background: "#0f1a2c",
                  height: BTN_H,
                  letterSpacing: "0.07em",
                  boxShadow: "0 2px 8px rgba(15,26,44,0.25), inset 0 1px 0 rgba(255,255,255,0.08)",
                }}
              >
                Log uit
              </button>
            </>
          ) : (
            <>
              <Link
                href="/app/login"
                className="inline-flex items-center px-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all hover:brightness-95"
                style={{
                  height: BTN_H,
                  background: "rgba(0,0,0,0.08)",
                  border: "1px solid rgba(0,0,0,0.10)",
                  color: "#0f1a2c",
                  letterSpacing: "0.07em",
                }}
              >
                Inloggen
              </Link>
              <Link
                href="/app/signup"
                className="inline-flex items-center px-5 rounded-xl text-[11px] font-black uppercase tracking-widest text-white transition-all hover:brightness-110"
                style={{
                  background: "#0f1a2c",
                  height: BTN_H,
                  letterSpacing: "0.07em",
                  boxShadow: "0 2px 8px rgba(15,26,44,0.25), inset 0 1px 0 rgba(255,255,255,0.08)",
                }}
              >
                Aanmelden
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex items-center justify-between gap-2 px-4 py-3">
        <Link href="/" aria-label="Weerzone home">
          <LogoBadge tier={tier} isFounder={isFounder} />
        </Link>
        <div className="flex items-center gap-2">
          <LocatieButton compact active={pathname.startsWith("/weer")} />
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            aria-label="Menu"
            aria-expanded={open}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all"
            style={
              open
                ? { background: "rgba(0,0,0,0.09)", border: "1px solid rgba(0,0,0,0.10)", color: "#0f1a2c" }
                : { background: "rgba(0,0,0,0.08)", border: "1px solid rgba(0,0,0,0.10)", color: "#0f1a2c" }
            }
          >
            {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden px-4 pb-5 pt-2"
          style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}
        >
          <nav className="grid gap-0.5 mb-4">
            <LocatieButton active={pathname.startsWith("/weer")} />
            {LINKS.map(l => {
              const active = isActive(pathname, l.key);
              return (
                <Link
                  key={l.key}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="px-4 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all"
                  style={{
                    color: active ? "#0f1a2c" : "rgba(15,26,44,0.50)",
                    background: active ? "rgba(0,0,0,0.09)" : "transparent",
                    boxShadow: active
                      ? "inset 0 1px 2px rgba(0,0,0,0.06), inset 0 -1px 0 rgba(255,255,255,0.35)"
                      : "none",
                    letterSpacing: "0.07em",
                  }}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
          <div className="grid grid-cols-2 gap-2 pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
            {user ? (
              <>
                <Link
                  href="/app"
                  onClick={() => setOpen(false)}
                  className="py-3 rounded-xl text-center text-[11px] font-black uppercase tracking-widest transition-all"
                  style={{
                    background: "rgba(0,0,0,0.08)",
                    border: "1px solid rgba(0,0,0,0.10)",
                    color: "#0f1a2c",
                    letterSpacing: "0.07em",
                  }}
                >
                  Dashboard
                </Link>
                <button
                  onClick={async () => {
                    setOpen(false);
                    const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
                    await createSupabaseBrowserClient().auth.signOut();
                    window.location.href = "/";
                  }}
                  className="py-3 rounded-xl text-[11px] font-black uppercase tracking-widest text-white"
                  style={{
                    background: "#0f1a2c",
                    letterSpacing: "0.07em",
                    boxShadow: "0 2px 8px rgba(15,26,44,0.25)",
                  }}
                >
                  Log uit
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/app/login"
                  onClick={() => setOpen(false)}
                  className="py-3 rounded-xl text-center text-[11px] font-black uppercase tracking-widest transition-all"
                  style={{
                    background: "rgba(0,0,0,0.08)",
                    border: "1px solid rgba(0,0,0,0.10)",
                    color: "#0f1a2c",
                    letterSpacing: "0.07em",
                  }}
                >
                  Inloggen
                </Link>
                <Link
                  href="/app/signup"
                  onClick={() => setOpen(false)}
                  className="py-3 rounded-xl text-center text-[11px] font-black uppercase tracking-widest text-white"
                  style={{
                    background: "#0f1a2c",
                    letterSpacing: "0.07em",
                    boxShadow: "0 2px 8px rgba(15,26,44,0.25)",
                  }}
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
