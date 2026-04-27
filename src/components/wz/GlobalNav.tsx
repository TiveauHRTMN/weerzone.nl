"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import WzLogo from "./WzLogo";
import NLPulse from "@/components/NLPulse";
import LocatieButton from "@/components/wz/LocatieButton";
import { useSession } from "@/lib/session-context";
import type { PersonaTier } from "@/lib/personas";

const TIER_COLOR: Record<string, string> = {
  piet:    "#10b981",
  reed:    "#ef4444",
  steve:   "#0ea5e9",
  founder: "#8b5cf6",
};

const TIER_LABEL: Record<string, string> = {
  piet:    "P",
  reed:    "R",
  steve:   "S",
  founder: "★",
};

function LogoBadge({ tier, isFounder }: { tier: PersonaTier | null; isFounder: boolean }) {
  const key = isFounder ? "founder" : (tier ?? null);
  const color = key ? TIER_COLOR[key] : null;
  const label = key ? TIER_LABEL[key] : null;

  return (
    <div className="relative inline-flex shrink-0">
      <WzLogo height={34} />
      {color && label && (
        <span
          className="absolute -right-2 -top-1.5 flex items-center justify-center text-white font-black"
          style={{
            width: 18,
            height: 18,
            borderRadius: "999px",
            fontSize: 10,
            background: color,
            border: "2px solid white",
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
  { key: "home",     label: "Home",     href: "/" },
  { key: "piet",     label: "Piet",     href: "/piet" },
  { key: "reed",     label: "Reed",     href: "/reed" },
  { key: "steve",    label: "Steve",    href: "/zakelijk" },
  { key: "contact",  label: "Contact",  href: "/contact" },
  ];

  function isActive(pathname: string, key: string) {
  if (key === "home")     return pathname === "/";
  if (key === "piet")     return pathname.startsWith("/piet");
  if (key === "reed")     return pathname.startsWith("/reed");
  if (key === "steve")    return pathname.startsWith("/zakelijk");
  if (key === "contact")  return pathname.startsWith("/contact");
  return false;
  }
const HIDDEN_PATHS = ["/app/login", "/app/signup", "/app/reset", "/app/verify", "/auth"];

export default function GlobalNav() {
  const pathname = usePathname() ?? "/";
  const { user, tier, isFounder } = useSession();
  const [open, setOpen] = useState(false);

  if (HIDDEN_PATHS.some(p => pathname.startsWith(p))) return null;

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--wz-border)",
        boxShadow: "0 2px 12px rgba(15,26,44,.07), 0 1px 3px rgba(15,26,44,.04)",
      }}
    >
      <NLPulse />
      {/* Desktop */}
      <div className="hidden md:flex items-center justify-between max-w-[1200px] mx-auto px-5 py-2.5 gap-4">
        {/* Logo met tier badge */}
        <LogoBadge tier={tier} isFounder={isFounder} />

        {/* Nav + auth rechts */}
        <nav className="flex items-center gap-0.5">
          <LocatieButton active={pathname.startsWith("/weer")} />
          {LINKS.map(l => (
            <Link
              key={l.key}
              href={l.href}
              className="px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors"
              style={{
                color: isActive(pathname, l.key) ? "var(--wz-brand)" : "var(--ink-700)",
                background: isActive(pathname, l.key) ? "var(--wz-brand-soft)" : "transparent",
              }}
            >
              {l.label}
            </Link>
          ))}

          {user ? (
            <>
              <Link
                href="/app"
                className="ml-2 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ color: "var(--ink-700)" }}
              >
                Mijn Weerzone
              </Link>
              <button
                onClick={async () => {
                  const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
                  await createSupabaseBrowserClient().auth.signOut();
                  window.location.href = "/";
                }}
                className="ml-1 px-3 py-1.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--wz-brand)" }}
              >
                Log uit
              </button>
            </>
          ) : (
            <>
              <Link
                href="/app/login"
                className="ml-2 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ color: "var(--ink-700)" }}
              >
                Inloggen
              </Link>
              <Link
                href="/app/signup"
                className="ml-1 px-3 py-1.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--wz-brand)" }}
              >
                Aanmelden
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Mobiel */}
      <div
        className="md:hidden grid items-center px-4 py-2.5"
        style={{ gridTemplateColumns: "1fr auto 1fr" }}
      >
        <div />
        <LogoBadge tier={tier} isFounder={isFounder} />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            aria-label="Menu"
            className="w-9 h-9 flex items-center justify-center rounded-xl border"
            style={{ borderColor: "var(--wz-border)", color: "var(--ink-700)" }}
          >
            {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobiel menu */}
      {open && (
        <div className="md:hidden px-4 pb-4 border-t" style={{ borderColor: "var(--wz-border)" }}>
          <nav className="grid gap-0.5 pt-2">
            <LocatieButton active={pathname.startsWith("/weer")} />
            {LINKS.map(l => (
              <Link
                key={l.key}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-3.5 py-3 rounded-xl text-[15px] font-semibold"
                style={{
                  color: isActive(pathname, l.key) ? "var(--wz-brand)" : "var(--ink-800)",
                  background: isActive(pathname, l.key) ? "var(--wz-brand-soft)" : "transparent",
                }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="grid gap-2 mt-3 pt-3 border-t" style={{ borderColor: "var(--wz-border)" }}>
            {user ? (
              <>
                <Link
                  href="/app"
                  onClick={() => setOpen(false)}
                  className="py-2.5 rounded-xl text-center text-sm font-semibold border"
                  style={{ borderColor: "var(--wz-border)", color: "var(--ink-800)" }}
                >
                  Mijn Weerzone
                </Link>
                <button
                  onClick={async () => {
                    const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
                    await createSupabaseBrowserClient().auth.signOut();
                    window.location.href = "/";
                  }}
                  className="py-2.5 rounded-xl text-sm font-bold text-white"
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
                  className="py-2.5 rounded-xl text-center text-sm font-semibold border"
                  style={{ borderColor: "var(--wz-border)", color: "var(--ink-800)" }}
                >
                  Inloggen
                </Link>
                <Link
                  href="/app/signup"
                  onClick={() => setOpen(false)}
                  className="py-2.5 rounded-xl text-center text-sm font-bold text-white"
                  style={{ background: "var(--wz-brand)" }}
                >
                  Aanmelden
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <NLPulse />
    </header>
  );
}
