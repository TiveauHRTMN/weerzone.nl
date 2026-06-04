"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoFull } from "./Logo";

const SOCIALS = [
  { label: "X", href: "https://x.com/weerzone" },
  { label: "Instagram", href: "https://www.instagram.com/weerzonenl" },
  { label: "YouTube", href: "https://youtube.com/@weerzone" },
  { label: "TikTok", href: "https://www.tiktok.com/@weerzonenl" },
  { label: "Reddit", href: "https://www.reddit.com/r/weerzone" },
  { label: "Wikidata", href: "https://www.wikidata.org/wiki/Q139675943" },
];

const NAV_ITEMS = [
  { label: "Hooikoorts", href: "/weer/themas/hooikoorts" },
  { label: "Amsterdam", href: "/weer/noord-holland/amsterdam" },
  { label: "Den Haag", href: "/weer/zuid-holland/den-haag" },
  { label: "BBQ weer", href: "/weer/themas/bbq-weer" },
];

export default function Footer() {
  const pathname = usePathname() ?? "/";
  const isHome = pathname === "/";

  // Stand-alone routes met eigen chrome tonen de WEERZONE-footer niet.
  if (pathname.startsWith("/hartmanwk2026")) return null;

  return (
    <footer className="w-full flex flex-col items-center pb-10 mt-12 relative z-10">
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6">
        {!isHome && (
          <Link
            href="/"
            className="mb-4 inline-flex rounded-2xl px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-transform hover:scale-[1.01]"
            style={{ background: "#3b7ff0" }}
          >
            Terug naar home
          </Link>
        )}

        <div className="card-blue w-full px-6 sm:px-8 py-8">
          <div className="space-y-6 text-center">
            <div className="space-y-3 flex flex-col items-center">
              <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
                <LogoFull height={28} />
              </Link>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white/90 leading-tight">
                Weer voor jouw plek.
                <br />
                Vandaag en morgen.
              </p>
            </div>

            <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-[13px] font-black uppercase tracking-[0.08em] text-white/90 transition-opacity hover:opacity-70"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <p className="mx-auto max-w-md text-[11px] font-semibold leading-relaxed text-white/55">
              WEERZONE combineert actuele weergegevens met heldere uitleg voor jouw locatie. De officiele bronnen behouden hun eigen credits.
            </p>

            <div className="space-y-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              <p>WEERZONE © {new Date().getFullYear()}</p>
              <p>Powered by Tiveau</p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              {SOCIALS.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] uppercase font-black tracking-widest text-white/65 transition-opacity hover:opacity-90"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
