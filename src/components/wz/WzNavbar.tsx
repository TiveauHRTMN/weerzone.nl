"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import WzLogo from "./WzLogo";
import NLPulse from "../NLPulse";
import { useSession } from "@/lib/session-context";

const LINKS: Array<{ key: string; label: string; href: string }> = [
  { key: "weer", label: "Weer", href: "/" },
  { key: "radar", label: "Radar", href: "/radar" },
  { key: "prijzen", label: "Prijzen", href: "/prijzen" },
  { key: "over", label: "Over ons", href: "/over" },
];

function isActive(pathname: string, key: string): boolean {
  if (key === "weer") return pathname === "/";
  if (key === "prijzen") return pathname.startsWith("/prijzen");
  if (key === "radar") return pathname.startsWith("/radar");
  if (key === "over") return pathname.startsWith("/over");
  return false;
}

export default function WzNavbar() {
  const pathname = usePathname() ?? "/";
  const { user } = useSession();
  const [open, setOpen] = useState(false);

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
      <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-5 px-4 sm:px-8 py-3">
        <WzLogo />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
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

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <Link href="/app" className="wz-btn wz-btn-ghost wz-btn-sm font-bold">
                Mijn Weerzone
              </Link>
              <button
                onClick={async () => {
                  const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
                  const supabase = createSupabaseBrowserClient();
                  await supabase.auth.signOut();
                  window.location.href = "/";
                }}
                className="wz-btn wz-btn-primary wz-btn-sm"
              >
                Log uit
              </button>
            </>
          ) : (
            <>
              <Link href="/app/login" className="wz-btn wz-btn-ghost wz-btn-sm">
                Inloggen
              </Link>
              <Link href="/app/signup" className="wz-btn wz-btn-primary wz-btn-sm">
                Aanmelden
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-[10px] border"
          style={{ borderColor: "var(--wz-border)", color: "var(--wz-text)" }}
        >
          {open ? <X className="w-[18px] h-[18px]" /> : <Menu className="w-[18px] h-[18px]" />}
        </button>
      </div>

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
          <div
            className="grid gap-2 mt-3 pt-3 border-t"
            style={{ borderColor: "var(--wz-border)" }}
          >
            {user ? (
              <>
                <Link
                  href="/app"
                  onClick={() => setOpen(false)}
                  className="wz-btn wz-btn-ghost wz-btn-block"
                >
                  Mijn Weerzone
                </Link>
                <button
                  onClick={async () => {
                    const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
                    const supabase = createSupabaseBrowserClient();
                    await supabase.auth.signOut();
                    window.location.href = "/";
                  }}
                  className="wz-btn wz-btn-primary wz-btn-block"
                >
                  Log uit
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/app/login"
                  onClick={() => setOpen(false)}
                  className="wz-btn wz-btn-ghost wz-btn-block"
                >
                  Inloggen
                </Link>
                <Link
                  href="/app/signup"
                  onClick={() => setOpen(false)}
                  className="wz-btn wz-btn-primary wz-btn-block"
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
