"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import WzLogo from "./WzLogo";
import NLPulse from "../NLPulse";
import { useSession } from "@/lib/session-context";

const LINKS: Array<{ key: string; label: string; href: string }> = [
  { key: "piet", label: "Mijn Weer", href: "/jouwweer" },
  { key: "reed", label: "Waarschuwingen", href: "/waarschuwingen" },
  { key: "steve", label: "Zakelijk", href: "/zakelijk" },
  { key: "prijzen", label: "Prijzen", href: "/prijzen" },
];

function isActive(pathname: string, key: string): boolean {
  if (key === "piet") return pathname.startsWith("/jouwweer");
  if (key === "reed") return pathname.startsWith("/waarschuwingen");
  if (key === "steve") return pathname.startsWith("/zakelijk");
  if (key === "prijzen") return pathname.startsWith("/prijzen");
  return false;
}

const AUTH_PATHS = ["/app/login", "/app/signup", "/app/reset", "/app/verify", "/auth"];

export default function WzNavbar() {
  const pathname = usePathname() ?? "/";
  const { user, isFounder } = useSession();
  const [open, setOpen] = useState(false);

  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) return null;

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderColor: "var(--wz-border)",
      }}
    >
      <NLPulse />

      {/* Desktop: 3-column grid — nav | logo | auth */}
      <div className="hidden md:grid max-w-[1200px] mx-auto px-6 py-3" style={{ gridTemplateColumns: "1fr auto 1fr" }}>
        {/* Left: nav links */}
        <nav className="flex items-center gap-1">
          {LINKS.map((l) => {
            const active = isActive(pathname, l.key);
            return (
              <Link
                key={l.key}
                href={l.href}
                className="px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={{
                  color: active ? "var(--wz-brand)" : "var(--wz-text-soft)",
                  background: active ? "var(--wz-brand-soft)" : "transparent",
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Center: logo */}
        <div className="flex items-center justify-center">
          <WzLogo />
        </div>

        {/* Right: auth */}
        <div className="flex items-center justify-end gap-2">
          {user ? (
            <>
              <Link href="/app" className="btn btn-ghost btn-sm font-bold">
                Mijn Weerzone
              </Link>
              <button
                onClick={async () => {
                  const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
                  const supabase = createSupabaseBrowserClient();
                  await supabase.auth.signOut();
                  window.location.href = "/";
                }}
                className="btn btn-primary btn-sm"
              >
                Log uit
              </button>
            </>
          ) : (
            <>
              <Link href="/app/login" className="btn btn-ghost btn-sm">
                Inloggen
              </Link>
              <Link href="/app/signup" className="btn btn-primary btn-sm">
                Aanmelden
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile: 3-column grid so logo center is truly clickable */}
      <div className="md:hidden grid items-center px-4 py-3" style={{ gridTemplateColumns: "1fr auto 1fr" }}>
        <div />
        <WzLogo />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="inline-flex items-center justify-center w-10 h-10 rounded-[10px] border"
            style={{ borderColor: "var(--wz-border)", color: "var(--wz-text)" }}
          >
            {open ? <X className="w-[18px] h-[18px]" /> : <Menu className="w-[18px] h-[18px]" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden border-t bg-white px-5 pt-3 pb-5"
          style={{ borderColor: "var(--wz-border)" }}
        >
          <nav className="grid gap-0.5">
            {LINKS.map((l) => {
              const active = isActive(pathname, l.key);
              return (
                <Link
                  key={l.key}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="px-3.5 py-3 rounded-[10px] text-[15px] font-semibold"
                  style={{
                    color: active ? "var(--wz-brand)" : "var(--wz-text)",
                    background: active ? "var(--wz-brand-soft)" : "transparent",
                  }}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
          <div className="grid gap-2 mt-3 pt-3 border-t" style={{ borderColor: "var(--wz-border)" }}>
            {user ? (
              <>
                <Link href="/app" onClick={() => setOpen(false)} className="btn btn-ghost btn-block">
                  Mijn Weerzone
                </Link>
                <button
                  onClick={async () => {
                    const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
                    const supabase = createSupabaseBrowserClient();
                    await supabase.auth.signOut();
                    window.location.href = "/";
                  }}
                  className="btn btn-primary btn-block"
                >
                  Log uit
                </button>
              </>
            ) : (
              <>
                <Link href="/app/login" onClick={() => setOpen(false)} className="btn btn-ghost btn-block">
                  Inloggen
                </Link>
                <Link href="/app/signup" onClick={() => setOpen(false)} className="btn btn-primary btn-block">
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
