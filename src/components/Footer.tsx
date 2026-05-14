"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoFull } from "./Logo";

const SOCIALS = [
  { label: "X",         href: "https://x.com/weerzone" },
  { label: "Instagram", href: "https://www.instagram.com/weerzonenl" },
  { label: "YouTube",   href: "https://youtube.com/@weerzone" },
  { label: "TikTok",    href: "https://www.tiktok.com/@weerzonenl" },
  { label: "Reddit",    href: "https://www.reddit.com/user/No_Slip_3007/" },
  { label: "Wikidata",  href: "https://www.wikidata.org/wiki/Q139675943" },
];

const SECTIONS = [
  {
    title: "Weerzone",
    links: [
      { label: "Over Weerzone",       href: "/over" },
      { label: "Veelgestelde vragen", href: "/over#faq" },
      { label: "Abonnementen",        href: "/prijzen" },
      { label: "Zakelijk",            href: "/zakelijk" },
      { label: "Contact",             href: "/contact" },
    ],
  },
  {
    title: "Mijn Weer",
    links: [
      { label: "Mijn Weer",           href: "/mijnweer" },
      { label: "Waarschuwingen",      href: "/waarschuwingen" },
      { label: "Prijzen",             href: "/prijzen" },
      { label: "Homepage",            href: "/" },
    ],
  },
  {
    title: "Info",
    links: [
      { label: "Privacybeleid",       href: "/privacy" },
      { label: "Cookie-instellingen", href: "#" },
    ],
  },
];

export default function Footer() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <footer className="w-full flex flex-col items-center pb-12 mt-12 relative z-10">
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 flex flex-col items-center">
        
        {!isHome && (
          <Link 
            href="/" 
            className="mb-8 px-6 py-3 rounded-2xl text-white font-black uppercase tracking-[0.2em] text-[10px] transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-500/20 flex items-center gap-2"
            style={{ background: "#3b7ff0" }}
          >
            <span className="text-sm">←</span> Terug naar home
          </Link>
        )}

        <p className="mb-8 text-center text-white/30 text-[11px] font-medium tracking-wide uppercase px-6">
          Verder dan 48 uur kijken we niet vooruit — dan wordt het gokken.
        </p>

        <div className="card-blue px-8 sm:px-10 pt-14 pb-10 w-full">
          <div className="max-w-6xl mx-auto">
            {/* Main grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">

              {/* Brand */}
              <div className="md:col-span-5">
                <Link href="/" className="inline-block mb-5 hover:opacity-80 transition-opacity">
                  <LogoFull height={28} />
                </Link>
                <p className="text-xs leading-relaxed font-black mb-3 opacity-90 uppercase tracking-wider">
                  HET EERLIJKE WEERBERICHT.<br/>
                  48 UUR VOORUIT. DE REST IS RUIS.
                </p>
                <a
                  href="mailto:info@weerzone.nl"
                  className="text-sm font-black transition-colors hover:opacity-70 text-white"
                >
                  info@weerzone.nl
                </a>
              </div>

              {/* Links */}
              <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6">
                {SECTIONS.map((section) => (
                  <div key={section.title}>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.22em] mb-4 opacity-50 text-white">
                      {section.title}
                    </h4>
                    <ul className="space-y-2.5">
                      {section.links.map((link) => (
                        <li key={link.label}>
                          <Link
                            href={link.href}
                            className="text-[13px] font-black transition-colors hover:opacity-70 text-white"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom */}
            <div className="pt-8 flex flex-col items-center gap-4 border-t border-white/10">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] opacity-40 text-white">
                 © {new Date().getFullYear()} WEERZONE.nl — POWERED BY TIVEAU
              </span>
              <div className="flex flex-wrap justify-center gap-5">
                {SOCIALS.map(({ label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target={href !== "#" ? "_blank" : undefined}
                    rel={href !== "#" ? "noopener noreferrer" : undefined}
                    className="text-[11px] uppercase font-black tracking-widest transition-colors hover:opacity-70 opacity-60 text-white"
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
