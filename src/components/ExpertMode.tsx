"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { ReedExpertReading, ReedVerdict } from "@/lib/reed-expert-reading";
import ReedMeteogram from "@/components/ReedMeteogram";

const LightningMap = dynamic(() => import("@/components/LightningMap"), {
  ssr: false, loading: () => <div className="va-card h-48 animate-pulse bg-white/70" aria-label="Kaart laden" />,
});

const VERDICT_LABEL: Record<ReedVerdict, string> = {
  rustig: "Rustig", oplettend: "Oplettend", onrustig: "Onrustig", code: "Code",
};
const VERDICT_TILE: Record<ReedVerdict, string> = {
  rustig: "is-quiet", oplettend: "is-watching", onrustig: "is-watching", code: "is-urgent",
};
const STORE_KEY = "wz-day-mode";

export default function ExpertMode({ reed, reading, lat, lon, dayOffset, children }: {
  reed: boolean;
  reading: ReedExpertReading;
  lat: number;
  lon: number;
  dayOffset: 0 | 1;
  children: React.ReactNode;
}) {
  const [expert, setExpert] = useState(false);

  useEffect(() => {
    if (!reed) return;
    setExpert(window.localStorage.getItem(STORE_KEY) === "expert");
  }, [reed]);

  function choose(mode: "gewoon" | "expert") {
    setExpert(mode === "expert");
    try { window.localStorage.setItem(STORE_KEY, mode); } catch {}
  }

  if (!reed) return <>{children}</>;

  return (
    <>
      <nav className="va-modeswitch" aria-label="Gewoon of expert">
        <button type="button" className={!expert ? "is-active" : ""} aria-pressed={!expert} onClick={() => choose("gewoon")}>Gewoon</button>
        <button type="button" className={expert ? "is-active" : ""} aria-pressed={expert} onClick={() => choose("expert")}>Expert</button>
      </nav>

      {!expert ? children : (
        <div className="space-y-7">
          <section className={`va-card va-reedhead ${VERDICT_TILE[reading.verdict]}`}>
            <div className="va-reedhead-top">
              <span className="va-agent-mark" style={{ "--agent-accent": "#e0701a" } as React.CSSProperties}>R</span>
              <div>
                <div className="va-micro text-slate-400">Reed · de atmosfeer ontleed</div>
                <span className="va-state-pill" style={{ "--agent-accent": "#e0701a" } as React.CSSProperties}>{VERDICT_LABEL[reading.verdict]}</span>
              </div>
            </div>
            <p className="va-reedhead-line">{reading.headline}</p>
          </section>

          <ReedMeteogram layers={reading.layers} moments={reading.moments} hours={reading.hours} />

          {dayOffset === 0 && (
            <section className="space-y-3">
              <div className="va-section-head px-1"><div><span className="va-onsky va-micro">Live</span><h2>Bliksem op de kaart</h2></div></div>
              <div className="va-visual-stack"><LightningMap lat={lat} lon={lon} /></div>
            </section>
          )}

          <p className="px-1 text-right">
            <Link href="/over#qa" className="text-[11px] font-bold text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline">
              Hoe komt deze verwachting tot stand?
            </Link>
          </p>
        </div>
      )}
    </>
  );
}
