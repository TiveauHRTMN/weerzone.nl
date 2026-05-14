"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LogIn, Menu, QrCode, Trophy, X } from "lucide-react";
import WkLogo from "./WkLogo";

const LINKS = [
  { key: "today", label: "Vandaag", href: "/wkpoule#speelschema-vandaag", icon: CalendarDays },
  { key: "ranking", label: "Stand", href: "/wkpoule#ranking", icon: Trophy },
  { key: "overall", label: "Schema", href: "/wkpoule#speelschema-overall", icon: CalendarDays },
];

function isActive(pathname: string, hash: string, key: string) {
  if (pathname === "/wkpoule" && !hash && key === "today") return true;
  if (key === "today") return hash === "#speelschema-vandaag";
  if (key === "ranking") return hash === "#ranking";
  if (key === "overall") return hash === "#speelschema-overall";
  return false;
}

export default function WkNav() {
  const pathname = usePathname() ?? "/wkpoule";
  const [open, setOpen] = useState(false);
  const [hash, setHash] = useState("");

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07101d]/78 shadow-[0_10px_40px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
      <div className="mx-auto grid h-16 max-w-6xl items-center gap-3 px-3 sm:px-5 lg:px-6" style={{ gridTemplateColumns: "auto minmax(0,1fr) auto" }}>
        <Link href="/wkpoule" aria-label="Hartman WK 2026 home" className="flex min-w-0 items-center gap-2">
          <WkLogo className="h-10 w-10 shrink-0 rounded-xl" />
          <span className="hidden min-w-0 leading-tight sm:block">
            <span className="block truncate text-sm font-black text-white">Hartman WK</span>
            <span className="block text-[11px] font-semibold text-white/45">2026 Poule</span>
          </span>
        </Link>

        <nav className="mx-auto hidden h-11 items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.07] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] md:flex" aria-label="WK navigatie">
          {LINKS.map((item) => {
            const active = isActive(pathname, hash, item.key);
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${
                  active ? "bg-white text-slate-950 shadow-sm" : "text-white/58 hover:bg-white/8 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-end gap-2">
          <Link
            href="/wkpoule/inloggen"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/12 bg-white/[0.06] px-3 text-sm font-semibold text-white transition hover:bg-white/[0.10]"
          >
            <LogIn className="h-4 w-4 text-slate-300" />
            <span className="hidden sm:inline">Login</span>
          </Link>
          <Link
            href="/wkpoule/inloggen#qr"
            className="hidden h-10 items-center gap-2 rounded-xl bg-white px-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 md:inline-flex"
          >
            <QrCode className="h-4 w-4" />
            QR
          </Link>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label="Menu"
            aria-expanded={open}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/12 bg-white/[0.06] text-white md:hidden"
          >
            {open ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-[#07101d]/96 px-3 py-3 backdrop-blur-2xl md:hidden">
          <nav className="grid gap-1" aria-label="Mobiele WK navigatie">
            {LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-100 hover:bg-white/8"
                >
                  <Icon className="h-4 w-4 text-white/55" />
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/wkpoule/inloggen#qr"
              onClick={() => setOpen(false)}
              className="inline-flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-100 hover:bg-white/8"
            >
              <QrCode className="h-4 w-4 text-white/55" />
              QR-code
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

