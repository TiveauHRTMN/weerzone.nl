"use client";

import Image from "next/image";
import type { ReactNode } from "react";

interface Quote {
  text: string;
  author: string;
}

/**
 * Twee-koloms auth-shell conform handoff. Links blauw marketingpaneel
 * met logo-pill + hero + homecard + optionele quote; rechts formulierpaneel.
 */
export default function WzAuthShell({
  title = "48 uur vooruit.\nDe rest is ruis.",
  subtitle = "Per GPS, op jouw locatie. Elke ochtend een persoonlijk weerbericht — geen reclame, geen gokwerk.",
  quote,
  children,
  footer,
}: {
  title?: string;
  subtitle?: string;
  quote?: Quote | null;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="auth-shell">
      <aside className="auth-side">
        <div className="brand-pill">
          <Image
            src="/logo-white.png"
            alt="Weerzone"
            width={120}
            height={20}
            priority
            style={{ height: 20, width: "auto", display: "block" }}
          />
        </div>

        <div className="side-hero">
          {/* Big homepage-style weer-tegel */}
          <div className="homecard">
            <div className="homecard-top">
              <div>
                <div className="homecard-kicker">Vandaag · De Bilt</div>
                <div className="homecard-temp">12<span className="deg">°</span></div>
                <div className="homecard-sub">Snoeiharde 48-uurs data</div>
              </div>
              <div className="homecard-sun" aria-hidden="true">
                <svg viewBox="0 0 64 64" width="92" height="92">
                  <circle cx="24" cy="32" r="12" fill="var(--wz-sun)"/>
                  {Array.from({length:8}).map((_,i)=>{
                    const a = (i*45)*Math.PI/180;
                    const x1 = 24 + Math.cos(a)*16, y1 = 32 + Math.sin(a)*16;
                    const x2 = 24 + Math.cos(a)*22, y2 = 32 + Math.sin(a)*22;
                    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--wz-sun)" strokeWidth="3" strokeLinecap="round"/>;
                  })}
                  <path d="M28 40c4-2 10-2 14 0 4 2 10 2 16 0v8c-6 2-12 2-16 0-4-2-10-2-14 0z" fill="#fff" opacity=".92"/>
                  <path d="M20 46c6-2 12-2 18 0 6 2 14 2 20 0v6c-6 2-14 2-20 0-6-2-12-2-18 0z" fill="#fff" opacity=".75"/>
                </svg>
              </div>
            </div>
            <div className="homecard-strip">
              {[
                { t: '09:00', v: '10°', g: '☀' },
                { t: '12:00', v: '13°', g: '⛅' },
                { t: '15:00', v: '14°', g: '⛅' },
                { t: '18:00', v: '11°', g: '🌧' },
                { t: '21:00', v: '8°', g: '🌧' }
              ].map((item)=>(
                <div key={item.t} className="homecard-tick">
                  <div className="tk">{item.t}</div>
                  <div className="gl">{item.g}</div>
                  <div className="vl">{item.v}</div>
                </div>
              ))}
            </div>
          </div>

          <h2 className="whitespace-pre-line">{title}</h2>
          <p className="t-body !text-white/80">{subtitle}</p>

          {quote && (
            <div className="side-quote">
              <p>“{quote.text}”</p>
              <div>— {quote.author}</div>
            </div>
          )}
        </div>

        <div className="side-foot text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
          WEERZONE Intelligence · v2.1
        </div>
      </aside>
      <main className="auth-panel">
        <div className="auth-inner">
          {children}
          {footer && <div className="mt-5 text-center text-sm" style={{ color: "var(--wz-text-soft)" }}>{footer}</div>}
        </div>
      </main>
    </div>
  );
}
