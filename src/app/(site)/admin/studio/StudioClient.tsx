"use client";

import { useEffect, useState } from "react";
import { toPng } from "html-to-image";
import type { StudioDay, RegionTemps } from "@/lib/mariana/studio/types";

const SLIDES: Array<[string, string]> = [
  ["slide1", "0800-dagverwachting"],
  ["slide2", "1400-actueel"],
  ["slide3", "2000-vandaag-en-morgen"],
  ["slide4", "2200-heads-up"],
];

const cardStyle: React.CSSProperties = {
  marginTop: 28,
  background: "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.76))",
  borderRadius: 28,
  border: "1px solid rgba(255,255,255,0.42)",
  boxShadow:
    "0 42px 84px -28px rgba(6,12,38,.62), 0 8px 22px -12px rgba(6,12,38,.4), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 0 0 1px rgba(255,255,255,0.1)",
  padding: "34px 40px",
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#51607a",
  marginBottom: 24,
};

const footerLineStyle: React.CSSProperties = {
  fontSize: 29,
  fontWeight: 600,
  color: "rgba(255,255,255,.85)",
  lineHeight: 1.4,
};

const footerBrandStyle: React.CSSProperties = {
  marginTop: 12,
  fontSize: 34,
  fontWeight: 800,
  color: "#ffd21a",
  letterSpacing: "-0.01em",
};

const badgeWrapStyle: React.CSSProperties = {
  marginTop: 40,
  alignSelf: "flex-start",
  display: "inline-flex",
  alignItems: "center",
  gap: 12,
  background: "rgba(255,255,255,0.16)",
  border: "1px solid rgba(255,255,255,0.32)",
  color: "#fff",
  fontSize: 24,
  fontWeight: 800,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  padding: "12px 24px",
  borderRadius: 999,
};

const badgeDotStyle: React.CSSProperties = {
  width: 12,
  height: 12,
  borderRadius: "50%",
  background: "#ffd21a",
};

const logoStyle: React.CSSProperties = { height: 78, width: "auto", alignSelf: "flex-end", display: "block" };

export default function StudioClient({ unlockKey }: { unlockKey: string }) {
  const [day, setDay] = useState<StudioDay | null>(null);
  const [live, setLive] = useState<{ regionTempsNow: RegionTemps; warmstePlek: { naam: string; temp: number } } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Zet de cookie zodat verversen zonder ?key blijft werken.
    if (unlockKey) document.cookie = `studio_key=${unlockKey}; path=/; max-age=86400`;
    fetch("/api/studio/today").then((r) => r.json()).then((d) => setDay(d.day ?? null)).catch(() => {});
    fetch("/api/studio/live").then((r) => r.json()).then(setLive).catch(() => {});
  }, [unlockKey]);

  async function exportSlide(id: string, label: string) {
    const node = document.getElementById(id);
    if (!node) return;
    const dataUrl = await toPng(node, { width: 1080, height: 1920, pixelRatio: 2, cacheBust: true, style: { transform: "none" } });
    const a = document.createElement("a");
    a.download = `weerzone-${new Date().toISOString().slice(0, 10)}-${label}.png`;
    a.href = dataUrl;
    a.click();
  }

  async function download(target: string) {
    setBusy(true);
    try {
      if (target === "all") {
        for (const [id, label] of SLIDES) {
          if (id === "slide4" && !day?.slide4) continue;
          await exportSlide(id, label);
          await new Promise((r) => setTimeout(r, 400));
        }
      } else {
        const found = SLIDES.find((s) => s[0] === target);
        await exportSlide(target, found ? found[1] : target);
      }
    } catch (e) {
      alert("Export mislukt: " + (e as Error).message);
    }
    setBusy(false);
  }

  const s1 = day?.slide1;
  const s2 = day?.slide2;
  const s3 = day?.slide3;
  const s4 = day?.slide4;
  const liveTemps = live?.regionTempsNow;
  const warmstePlek = live?.warmstePlek;

  return (
    <>
      <style>{`
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Inter', sans-serif; -webkit-font-smoothing:antialiased; background:#0c1838; color:#fff; }
        .num { font-variant-numeric:tabular-nums; font-feature-settings:'tnum' 1,'ss01' 1; letter-spacing:-0.022em; }
        /* hairline separators */
        .region-col { padding:0 4px; }
        .region-col:not(:last-child) { border-right:1px solid rgba(81,96,122,0.16); }
        .rank-rows { display:flex; flex-direction:column; gap:4px !important; }
        .rank-row { padding-bottom:20px; }
        .rank-row:not(:last-child) { border-bottom:1px solid rgba(10,17,30,0.09); }
        [contenteditable] { outline:none; border-radius:6px; transition:box-shadow .12s, background .12s; cursor:text; }
        [contenteditable]:hover { box-shadow:0 0 0 2px rgba(255,210,26,.45); }
        [contenteditable]:focus { box-shadow:0 0 0 2px #ffd21a; background:rgba(255,210,26,.12); }

        /* toolbar */
        .bar { position:sticky; top:0; z-index:50; display:flex; align-items:center; gap:14px; flex-wrap:wrap;
               padding:18px 28px; background:rgba(10,17,30,.92); backdrop-filter:blur(8px); border-bottom:1px solid rgba(255,255,255,.1); }
        .bar h1 { font-size:18px; font-weight:800; letter-spacing:.02em; }
        .bar .hint { font-size:13px; font-weight:500; color:rgba(255,255,255,.55); flex:1 1 200px; }
        .btn { font-family:inherit; font-size:14px; font-weight:800; padding:12px 18px; border-radius:999px; border:none; cursor:pointer;
               background:#ffd21a; color:#0a111e; transition:transform .1s, filter .1s; white-space:nowrap; }
        .btn:hover { filter:brightness(1.06); }
        .btn:active { transform:scale(.97); }
        .btn.ghost { background:rgba(255,255,255,.12); color:#fff; }
        .btn:disabled { opacity:.5; cursor:wait; }

        .stage { display:flex; gap:40px; flex-wrap:wrap; justify-content:center; padding:40px 28px 80px; }
        :root { --s:0.4; }
        .slot { display:flex; flex-direction:column; align-items:center; gap:14px; }
        .slot .cap { font-size:13px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:rgba(255,255,255,.5); text-align:center; }
        /* scale 1080x1920 down to fit */
        .scaler { width:calc(1080px * var(--s)); height:calc(1920px * var(--s)); overflow:hidden; border-radius:14px; box-shadow:0 24px 60px -20px rgba(0,0,0,.6); }
        .scaler > .slide { transform:scale(var(--s)); transform-origin:top left; }

        /* mobile-first: one slide per row, scale to viewport so nothing overlaps */
        @media (max-width:980px) {
          .stage { gap:34px; padding:28px 16px 64px; }
          .bar { gap:10px; padding:14px 16px; }
          .bar .hint { flex-basis:100%; order:5; }
        }
        @media (max-width:640px) {
          :root { --s:0.34; }
          .btn { flex:1 1 28%; padding:12px 8px; font-size:13px; text-align:center; }
        }
        @media (max-width:420px) { :root { --s:0.28; } }
        @media (max-width:360px) { :root { --s:0.24; } }

        .slide { width:1080px; height:1920px; overflow:hidden; position:relative;
                 background:
                   radial-gradient(1200px 1200px at 50% 122%, rgba(8,14,34,0.62), rgba(8,14,34,0) 60%),
                   radial-gradient(1000px 820px at 94% -6%, rgba(255,176,54,0.62), rgba(255,128,42,0.22) 38%, rgba(255,96,30,0) 66%),
                   radial-gradient(640px 520px at 70% 8%, rgba(255,228,120,0.45), rgba(255,200,80,0) 60%),
                   radial-gradient(1100px 760px at 8% 4%, rgba(108,170,255,0.30), rgba(108,170,255,0) 56%),
                   linear-gradient(168deg, #4e8fe6 0%, #2f63c8 30%, #1d3f93 58%, #112a64 80%, #0a1c45 100%); }
        /* premium light sheen + filmic grain over the sky (below content) */
        .slide::before { content:""; position:absolute; inset:0; z-index:1; pointer-events:none;
                 background:linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 22%); }
        .slide::after { content:""; position:absolute; inset:0; z-index:1; pointer-events:none;
                 opacity:0.5; mix-blend-mode:overlay;
                 background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E");
                 background-size:180px 180px; }
        .pad { position:absolute; inset:0; z-index:2; padding:265px 84px 340px; display:flex; flex-direction:column; }
      `}</style>

      <div className="bar">
        <h1>Weerzone Studio</h1>
        <span className="hint">Klik op een tekst om te wijzigen. Download elke template als PNG (1080×1920).</span>
        <button className="btn" disabled={busy} onClick={() => download("slide1")}>↓ 08:00</button>
        <button className="btn" disabled={busy} onClick={() => download("slide2")}>↓ 14:00</button>
        <button className="btn" disabled={busy} onClick={() => download("slide3")}>↓ 20:00</button>
        {s4 ? (
          <button className="btn" disabled={busy} onClick={() => download("slide4")}>↓ 22:00</button>
        ) : null}
        <button className="btn ghost" disabled={busy} onClick={() => download("all")}>↓ Alle</button>
      </div>

      <div className="stage">

        {/* ============================================================ */}
        {/* TEMPLATE 1 — 08:00 DAGVERWACHTING */}
        {/* ============================================================ */}
        <div className="slot">
          <div className="cap">08:00 — Dagverwachting</div>
          <div className="scaler">
            <div className="slide" id="slide1">
              <div className="pad">
                <img src="/studio/weerzone-logo.png" alt="Weerzone" style={logoStyle} />
                <div style={badgeWrapStyle}>
                  <span style={badgeDotStyle}></span>
                  <span contentEditable suppressContentEditableWarning>{s1?.badge ?? "Dinsdag 23 juni · 08:00"}</span>
                </div>
                <h1 style={{ marginTop: 22, fontSize: 96, lineHeight: 0.94, fontWeight: 800, letterSpacing: "-0.04em", color: "#fff" }} contentEditable suppressContentEditableWarning>
                  {s1?.titel ?? "Vandaag"}
                </h1>
                <div style={{ ...cardStyle, marginTop: 26, padding: "38px 44px" }}>
                  <p style={{ fontSize: 34, lineHeight: 1.5, fontWeight: 500, color: "#0a111e", textWrap: "pretty" }} contentEditable suppressContentEditableWarning>
                    {s1?.intro ?? "Een hittekoepel zorgt voor een strakblauwe hemel en oplopende temperaturen. In het zuiden wordt het tropisch warm; aan de kust houdt een frisse zeewind het aangenamer."}
                  </p>
                </div>
                <div style={cardStyle}>
                  <div style={sectionLabelStyle}>Temperatuur per regio</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, alignItems: "end" }}>
                    <div className="region-col" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                      <div className="num" style={{ fontSize: 50, fontWeight: 800, lineHeight: 1.05, color: "#2f6bed" }} contentEditable suppressContentEditableWarning>
                        {s1 ? `${s1.regionTemps.noord}°` : "25°"}
                      </div>
                      <div style={{ fontSize: 21, fontWeight: 600, color: "#51607a", textAlign: "center", lineHeight: 1.2 }}>Noord</div>
                    </div>
                    <div className="region-col" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                      <div className="num" style={{ fontSize: 50, fontWeight: 800, lineHeight: 1.05, color: "#3a78db" }} contentEditable suppressContentEditableWarning>
                        {s1 ? `${s1.regionTemps.west}°` : "29°"}
                      </div>
                      <div style={{ fontSize: 21, fontWeight: 600, color: "#51607a", textAlign: "center", lineHeight: 1.2 }}>West</div>
                    </div>
                    <div className="region-col" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                      <div className="num" style={{ fontSize: 50, fontWeight: 800, lineHeight: 1.05, color: "#e0820f" }} contentEditable suppressContentEditableWarning>
                        {s1 ? `${s1.regionTemps.midden}°` : "31°"}
                      </div>
                      <div style={{ fontSize: 21, fontWeight: 600, color: "#51607a", textAlign: "center", lineHeight: 1.2 }}>Midden</div>
                    </div>
                    <div className="region-col" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                      <div className="num" style={{ fontSize: 50, fontWeight: 800, lineHeight: 1.05, color: "#e8632c" }} contentEditable suppressContentEditableWarning>
                        {s1 ? `${s1.regionTemps.oost}°` : "30°"}
                      </div>
                      <div style={{ fontSize: 21, fontWeight: 600, color: "#51607a", textAlign: "center", lineHeight: 1.2 }}>Oost</div>
                    </div>
                    <div className="region-col" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                      <div className="num" style={{ fontSize: 50, fontWeight: 800, lineHeight: 1.05, color: "#e23b34" }} contentEditable suppressContentEditableWarning>
                        {s1 ? `${s1.regionTemps.zuid}°` : "32°"}
                      </div>
                      <div style={{ fontSize: 21, fontWeight: 600, color: "#51607a", textAlign: "center", lineHeight: 1.2 }}>Zuid</div>
                    </div>
                  </div>
                </div>
                <div style={cardStyle}>
                  <div style={sectionLabelStyle}>Door de dag heen</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, alignItems: "end" }}>
                    <div className="region-col" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                      <div className="num" style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.05, color: "#3a78db" }} contentEditable suppressContentEditableWarning>
                        {s1 ? `${s1.dayparts.ochtend}°` : "22°"}
                      </div>
                      <div style={{ fontSize: 21, fontWeight: 600, color: "#51607a", textAlign: "center", lineHeight: 1.2 }}>Ochtend</div>
                    </div>
                    <div className="region-col" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                      <div className="num" style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.05, color: "#e23b34" }} contentEditable suppressContentEditableWarning>
                        {s1 ? `${s1.dayparts.middag}°` : "31°"}
                      </div>
                      <div style={{ fontSize: 21, fontWeight: 600, color: "#51607a", textAlign: "center", lineHeight: 1.2 }}>Middag</div>
                    </div>
                    <div className="region-col" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                      <div className="num" style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.05, color: "#e0820f" }} contentEditable suppressContentEditableWarning>
                        {s1 ? `${s1.dayparts.avond}°` : "27°"}
                      </div>
                      <div style={{ fontSize: 21, fontWeight: 600, color: "#51607a", textAlign: "center", lineHeight: 1.2 }}>Avond</div>
                    </div>
                    <div className="region-col" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                      <div className="num" style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.05, color: "#2f6bed" }} contentEditable suppressContentEditableWarning>
                        {s1 ? `${s1.dayparts.nacht}°` : "19°"}
                      </div>
                      <div style={{ fontSize: 21, fontWeight: 600, color: "#51607a", textAlign: "center", lineHeight: 1.2 }}>Nacht</div>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 32, display: "flex", alignItems: "center", justifyContent: "space-between", color: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <svg width="35" height="35" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="3.2"/><path d="M12 4.5V6M4.5 13H6M18 13h1.5M6.8 7.8 7.9 8.9M17.2 7.8 16.1 8.9M3 18.5h18"/></svg>
                    <div style={{ whiteSpace: "nowrap" }}>
                      <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.05 }} contentEditable suppressContentEditableWarning>{s1 ? String(s1.metrics.uvIndex) : "7"}</div>
                      <div style={{ fontSize: 18, fontWeight: 600, color: "rgba(255,255,255,.7)", marginTop: 5 }}>UV-index</div>
                    </div>
                  </div>
                  <div style={{ width: 1, height: 46, background: "rgba(255,255,255,.22)" }}></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <svg width="35" height="35" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2.2"/><path d="M12 9.8V4M12 14.2V20M9.8 12H4M14.2 12H20M10.2 10.2 6.5 6.5M13.8 10.2 17.5 6.5M10.2 13.8 6.5 17.5M13.8 13.8 17.5 17.5"/></svg>
                    <div style={{ whiteSpace: "nowrap" }}>
                      <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.05 }} contentEditable suppressContentEditableWarning>{s1?.metrics.hooikoorts ?? "Hoog"}</div>
                      <div style={{ fontSize: 18, fontWeight: 600, color: "rgba(255,255,255,.7)", marginTop: 5 }}>Hooikoorts</div>
                    </div>
                  </div>
                  <div style={{ width: 1, height: 46, background: "rgba(255,255,255,.22)" }}></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <svg width="35" height="35" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h10a3 3 0 1 0-3-3"/><path d="M3 12h14a3 3 0 1 1-3 3"/><path d="M3 16h7"/></svg>
                    <div style={{ whiteSpace: "nowrap" }}>
                      <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.05 }} contentEditable suppressContentEditableWarning>{s1 ? `${s1.metrics.windBft} Bft` : "3 Bft"}</div>
                      <div style={{ fontSize: 18, fontWeight: 600, color: "rgba(255,255,255,.7)", marginTop: 5 }}>Wind</div>
                    </div>
                  </div>
                  <div style={{ width: 1, height: 46, background: "rgba(255,255,255,.22)" }}></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <svg width="35" height="35" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6.5" cy="16.5" r="3.3"/><circle cx="17.5" cy="16.5" r="3.3"/><path d="M6.5 16.5l4-7.5h4M9 9h4.5l3 7.5M14.5 9l1.6-1.7h1.7"/></svg>
                    <div style={{ whiteSpace: "nowrap" }}>
                      <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.05 }} contentEditable suppressContentEditableWarning>{s1?.metrics.fietsweer ?? "Goed"}</div>
                      <div style={{ fontSize: 18, fontWeight: 600, color: "rgba(255,255,255,.7)", marginTop: 5 }}>Fietsweer</div>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 24, textAlign: "center" }}>
                  <div style={footerLineStyle} contentEditable suppressContentEditableWarning>
                    {s1?.tagline ?? "Lokale verschillen kunnen groot zijn — bekijk het weer op jouw locatie."}
                  </div>
                  <div style={footerBrandStyle} contentEditable suppressContentEditableWarning>weerzone.nl</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* TEMPLATE 2 — 14:00 ACTUEEL WEER */}
        {/* ============================================================ */}
        <div className="slot">
          <div className="cap">14:00 — Actueel weer</div>
          <div className="scaler">
            <div className="slide" id="slide2">
              <div className="pad">
                <img src="/studio/weerzone-logo.png" alt="Weerzone" style={logoStyle} />
                <div style={badgeWrapStyle}>
                  <span style={badgeDotStyle}></span>
                  <span contentEditable suppressContentEditableWarning>{s2?.badge ?? "Nu · 14:00"}</span>
                </div>
                <h1 style={{ marginTop: "auto", fontSize: 88, lineHeight: 0.96, fontWeight: 800, letterSpacing: "-0.035em", color: "#fff" }} contentEditable suppressContentEditableWarning>
                  {s2?.titel ?? "Actueel weer"}
                </h1>
                <div style={{ marginTop: 14, fontSize: 28, fontWeight: 600, color: "rgba(255,255,255,.78)" }} contentEditable suppressContentEditableWarning>
                  {s2?.subtitel ?? "Zo staat het er nu voor in het land"}
                </div>
                <div style={{ ...cardStyle, marginTop: 48, padding: "40px 44px" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#51607a", marginBottom: 28 }}>
                    Nu gemeten · temperatuur
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, alignItems: "end" }}>
                    <div className="region-col" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                      <div className="num" style={{ fontSize: 54, fontWeight: 800, lineHeight: 1.05, color: "#2f6bed" }} contentEditable suppressContentEditableWarning>
                        {liveTemps ? `${liveTemps.noord}°` : "23°"}
                      </div>
                      <div style={{ fontSize: 21, fontWeight: 600, color: "#51607a", textAlign: "center", lineHeight: 1.2 }}>Noord</div>
                    </div>
                    <div className="region-col" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                      <div className="num" style={{ fontSize: 54, fontWeight: 800, lineHeight: 1.05, color: "#3a78db" }} contentEditable suppressContentEditableWarning>
                        {liveTemps ? `${liveTemps.west}°` : "27°"}
                      </div>
                      <div style={{ fontSize: 21, fontWeight: 600, color: "#51607a", textAlign: "center", lineHeight: 1.2 }}>West</div>
                    </div>
                    <div className="region-col" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                      <div className="num" style={{ fontSize: 54, fontWeight: 800, lineHeight: 1.05, color: "#e0820f" }} contentEditable suppressContentEditableWarning>
                        {liveTemps ? `${liveTemps.midden}°` : "30°"}
                      </div>
                      <div style={{ fontSize: 21, fontWeight: 600, color: "#51607a", textAlign: "center", lineHeight: 1.2 }}>Midden</div>
                    </div>
                    <div className="region-col" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                      <div className="num" style={{ fontSize: 54, fontWeight: 800, lineHeight: 1.05, color: "#e8632c" }} contentEditable suppressContentEditableWarning>
                        {liveTemps ? `${liveTemps.oost}°` : "29°"}
                      </div>
                      <div style={{ fontSize: 21, fontWeight: 600, color: "#51607a", textAlign: "center", lineHeight: 1.2 }}>Oost</div>
                    </div>
                    <div className="region-col" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                      <div className="num" style={{ fontSize: 54, fontWeight: 800, lineHeight: 1.05, color: "#e23b34" }} contentEditable suppressContentEditableWarning>
                        {liveTemps ? `${liveTemps.zuid}°` : "33°"}
                      </div>
                      <div style={{ fontSize: 21, fontWeight: 600, color: "#51607a", textAlign: "center", lineHeight: 1.2 }}>Zuid</div>
                    </div>
                  </div>
                </div>
                <div style={{ ...cardStyle, marginTop: 32, padding: "40px 44px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                      <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#e23b34" }}></div>
                      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#e23b34" }}>Warmste plek nu</div>
                    </div>
                    <div style={{ fontSize: 42, fontWeight: 800, color: "#0a111e", letterSpacing: "-0.01em" }} contentEditable suppressContentEditableWarning>
                      {warmstePlek?.naam ?? "Maastricht"}
                    </div>
                  </div>
                  <div className="num" style={{ fontSize: 96, fontWeight: 800, color: "#e23b34", lineHeight: 0.9 }} contentEditable suppressContentEditableWarning>
                    {warmstePlek ? `${warmstePlek.temp}°` : "33°"}
                  </div>
                </div>
                <div style={{ marginTop: "auto", paddingTop: 40, textAlign: "center" }}>
                  <div style={footerLineStyle} contentEditable suppressContentEditableWarning>Bekijk het actuele weer op jouw locatie.</div>
                  <div style={footerBrandStyle} contentEditable suppressContentEditableWarning>weerzone.nl</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* TEMPLATE 3 — 20:00 VANDAAG & MORGEN */}
        {/* ============================================================ */}
        <div className="slot">
          <div className="cap">20:00 — Vandaag &amp; Morgen</div>
          <div className="scaler">
            <div className="slide" id="slide3">
              <div className="pad">
                <img src="/studio/weerzone-logo.png" alt="Weerzone" style={logoStyle} />
                <div style={badgeWrapStyle}>
                  <span style={badgeDotStyle}></span>
                  <span contentEditable suppressContentEditableWarning>{s3?.badge ?? "Avond · 23 juni"}</span>
                </div>
                <h1 style={{ marginTop: "auto", fontSize: 74, lineHeight: 0.98, fontWeight: 800, letterSpacing: "-0.03em", color: "#fff" }} contentEditable suppressContentEditableWarning>
                  {s3?.titel ?? "Vandaag & Morgen"}
                </h1>
                <div style={{ ...cardStyle, marginTop: 44, padding: "40px 44px" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#51607a", marginBottom: 26 }}>
                    Vandaag in het kort
                  </div>
                  <div className="rank-rows" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div className="rank-row" style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
                      <div style={{ fontSize: 28, fontWeight: 600, color: "#51607a" }}>Hoogste</div>
                      <div style={{ fontSize: 32, fontWeight: 700, color: "#0a111e", textAlign: "right" }}>
                        <span className="num" style={{ color: "#e23b34", fontWeight: 800 }} contentEditable suppressContentEditableWarning>
                          {s3 ? `${s3.vandaag.hoogste.temp}°` : "34°"}
                        </span>{" "}
                        <span contentEditable suppressContentEditableWarning>{s3?.vandaag.hoogste.plaats ?? "Maastricht"}</span>
                      </div>
                    </div>
                    <div className="rank-row" style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
                      <div style={{ fontSize: 28, fontWeight: 600, color: "#51607a" }}>Laagste</div>
                      <div style={{ fontSize: 32, fontWeight: 700, color: "#0a111e", textAlign: "right" }}>
                        <span className="num" style={{ color: "#2f6bed", fontWeight: 800 }} contentEditable suppressContentEditableWarning>
                          {s3 ? `${s3.vandaag.laagste.temp}°` : "12°"}
                        </span>{" "}
                        <span contentEditable suppressContentEditableWarning>{s3?.vandaag.laagste.label ?? "vannacht"}</span>
                      </div>
                    </div>
                    <div className="rank-row" style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
                      <div style={{ fontSize: 28, fontWeight: 600, color: "#51607a" }}>Weerfeit</div>
                      <div style={{ fontSize: 30, fontWeight: 700, color: "#0a111e", textAlign: "right" }} contentEditable suppressContentEditableWarning>
                        {s3?.vandaag.weerfeit ?? "Eerste tropische dag"}
                      </div>
                    </div>
                  </div>
                </div>
                <div style={cardStyle}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 24 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#51607a" }}>Morgen</div>
                    <div className="num" style={{ fontSize: 38, fontWeight: 800, color: "#e8632c" }} contentEditable suppressContentEditableWarning>
                      {s3 ? `${s3.morgen.temp}°` : "29°"}
                    </div>
                  </div>
                  <p style={{ fontSize: 33, lineHeight: 1.5, fontWeight: 500, color: "#0a111e", textWrap: "pretty" }} contentEditable suppressContentEditableWarning>
                    {s3?.morgen.alinea ?? "De hitte neemt iets af. Een zwakke storing brengt 's middags meer bewolking en kans op een lokale bui. Daarna draait de wind naar het westen en koelt het rustig af."}
                  </p>
                </div>
                <div style={{ marginTop: "auto", paddingTop: 40, textAlign: "center" }}>
                  <div style={footerLineStyle} contentEditable suppressContentEditableWarning>Bekijk morgen het weer op jouw locatie.</div>
                  <div style={footerBrandStyle} contentEditable suppressContentEditableWarning>weerzone.nl</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* TEMPLATE 4 — 22:00 HEADS-UP (alleen wanneer nodig) */}
        {/* ============================================================ */}
        {s4 ? (
          <div className="slot">
            <div className="cap">22:00 — Heads-up <span style={{ opacity: 0.6 }}>(alleen wanneer nodig)</span></div>
            <div className="scaler">
              <div className="slide" id="slide4">
                <div className="pad">
                  <img src="/studio/weerzone-logo.png" alt="Weerzone" style={logoStyle} />
                  <div style={{ ...badgeWrapStyle, background: "rgba(226,59,52,0.18)", border: "1px solid rgba(226,59,52,0.45)" }}>
                    <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#e23b34" }}></span>
                    <span contentEditable suppressContentEditableWarning>{s4.badge}</span>
                  </div>
                  <h1 style={{ marginTop: "auto", fontSize: 84, lineHeight: 0.96, fontWeight: 800, letterSpacing: "-0.035em", color: "#fff" }} contentEditable suppressContentEditableWarning>
                    {s4.titel}
                  </h1>
                  <div style={{ ...cardStyle, marginTop: 30, padding: "38px 44px" }}>
                    <p style={{ fontSize: 34, lineHeight: 1.5, fontWeight: 500, color: "#0a111e", textWrap: "pretty" }} contentEditable suppressContentEditableWarning>
                      {s4.intro}
                    </p>
                  </div>
                  <div style={{ ...cardStyle, padding: "36px 44px" }}>
                    <div className="rank-rows" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div className="rank-row" style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
                        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#51607a" }}>Wanneer</div>
                        <div style={{ fontSize: 31, fontWeight: 700, color: "#0a111e", textAlign: "right" }} contentEditable suppressContentEditableWarning>
                          {s4.rijen.wanneer}
                        </div>
                      </div>
                      <div className="rank-row" style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
                        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#51607a" }}>Waar</div>
                        <div style={{ fontSize: 31, fontWeight: 700, color: "#0a111e", textAlign: "right" }} contentEditable suppressContentEditableWarning>
                          {s4.rijen.waar}
                        </div>
                      </div>
                      <div className="rank-row" style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
                        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#51607a" }}>Verwacht</div>
                        <div style={{ fontSize: 31, fontWeight: 700, color: "#0a111e", textAlign: "right" }} contentEditable suppressContentEditableWarning>
                          {s4.rijen.verwacht}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 18, background: "rgba(255,210,26,0.16)", border: "1px solid rgba(255,210,26,0.4)", borderRadius: 22, padding: "28px 34px" }}>
                    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#ffd21a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>
                    <div style={{ fontSize: 29, fontWeight: 600, color: "#fff", lineHeight: 1.4 }} contentEditable suppressContentEditableWarning>
                      {s4.advies}
                    </div>
                  </div>
                  <div style={{ marginTop: "auto", paddingTop: 40, textAlign: "center" }}>
                    <div style={footerLineStyle} contentEditable suppressContentEditableWarning>Bekijk de laatste verwachting op</div>
                    <div style={footerBrandStyle} contentEditable suppressContentEditableWarning>weerzone.nl</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

      </div>
    </>
  );
}
