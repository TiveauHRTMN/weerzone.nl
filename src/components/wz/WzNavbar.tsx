"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import WzLogo from "./WzLogo";
import NLPulse from "../NLPulse";
import { useSession } from "@/lib/session-context";
import { LOCALES, detectLocale, type NavLink } from "@/config/locales";

function isActive(pathname: string, link: NavLink): boolean {
  return pathname === link.href || pathname.startsWith(link.href + "/");
}

const AUTH_PATHS = ["/app/login", "/app/signup", "/app/reset", "/app/verify", "/auth"];

export default function WzNavbar() {
  const pathname = usePathname() ?? "/";
  const { user } = useSession();
  const [open, setOpen] = useState(false);

  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) return null;

  const locale = detectLocale(pathname);
  const { nav } = LOCALES[locale];
  const isDE = locale === "de";

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
      {!isDE && <NLPulse />}

      {/* Desktop: 3-column grid — nav | logo | auth */}
      <div className="hidden md:grid max-w-[1200px] mx-auto px-6 py-3" style={{ gridTemplateColumns: "1fr auto 1fr" }}>
        {/* Left: nav links */}
        <nav className="flex items-center gap-1">
          {nav.map((l) => {
            const active = isActive(pathname, l);
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

        {/* Right: auth + locale switcher */}
        <div className="flex items-center justify-end gap-2">
          <Link
            href={isDE ? "/" : "/de"}
            className="px-2 py-1 rounded text-xs font-bold border transition-colors hover:border-current"
            style={{ borderColor: "var(--wz-border)", color: "var(--wz-text-soft)" }}
            title={isDE ? "Naar Nederland" : "Für Deutschland"}
          >
            {isDE ? "🇳🇱 NL" : "🇩🇪 DE"}
          </Link>

          {user ? (
            <>
              <Link href="/app" className="btn btn-ghost btn-sm font-bold">
                {isDE ? "Mein Konto" : "Mijn Weerzone"}
              </Link>
              <button
                onClick={async () => {
                  const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
                  const supabase = createSupabaseBrowserClient();
                  await supabase.auth.signOut();
                  window.location.href = isDE ? "/de" : "/";
                }}
                className="btn btn-primary btn-sm"
              >
                {isDE ? "Abmelden" : "Log uit"}
              </button>
            </>
          ) : (
            <>
              <Link href="/app/login" className="btn btn-ghost btn-sm">
                {isDE ? "Anmelden" : "Inloggen"}
              </Link>
              <Link href={isDE ? "/app/signup?lang=de" : "/app/signup"} className="btn btn-primary btn-sm">
                {isDE ? "Jetzt starten" : "Aanmelden"}
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile */}
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
            {nav.map((l) => {
              const active = isActive(pathname, l);
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
            <Link
              href={isDE ? "/" : "/de"}
              onClick={() => setOpen(false)}
              className="btn btn-ghost btn-block text-sm"
            >
              {isDE ? "🇳🇱 Naar Nederland" : "🇩🇪 Für Deutschland"}
            </Link>
            {user ? (
              <>
                <Link href="/app" onClick={() => setOpen(false)} className="btn btn-ghost btn-block">
                  {isDE ? "Mein Konto" : "Mijn Weerzone"}
                </Link>
                <button
                  onClick={async () => {
                    const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
                    const supabase = createSupabaseBrowserClient();
                    await supabase.auth.signOut();
                    window.location.href = isDE ? "/de" : "/";
                  }}
                  className="btn btn-primary btn-block"
                >
                  {isDE ? "Abmelden" : "Log uit"}
                </button>
              </>
            ) : (
              <>
                <Link href="/app/login" onClick={() => setOpen(false)} className="btn btn-ghost btn-block">
                  {isDE ? "Anmelden" : "Inloggen"}
                </Link>
                <Link href={isDE ? "/app/signup?lang=de" : "/app/signup"} onClick={() => setOpen(false)} className="btn btn-primary btn-block">
                  {isDE ? "Jetzt starten" : "Aanmelden"}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
