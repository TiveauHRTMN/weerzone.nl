/* Weerzone Auth — shared components (Logo, Sky, SSO icons, primitives) */

const Logo = ({ size = 14, variant = "inline" }) => {
  if (variant === "mark") {
    return <img src="assets/weerzone-logo.png" alt="WEERZONE" style={{ height: size * 1.6, width: "auto", display: "block" }} />;
  }
  return (
    <span className="wz-logo" style={{ fontSize: size }}>
      <span className="dot" />
      <b>WEER</b><span className="thin">ZONE</span>
    </span>
  );
};

/* GPS icon for locatie button */
const GpsIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
    <circle cx="8" cy="8" r="6"/>
    <circle cx="8" cy="8" r="2.2" fill="currentColor" stroke="none"/>
    <path d="M8 0.5v2M8 13.5v2M0.5 8h2M13.5 8h2" strokeLinecap="round"/>
  </svg>
);

/* Location row — GPS button = home location, manual override available */
const LocationRow = ({ location = "De Bilt", postcode = "3731 GA" }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", border: "1px solid var(--hair-2)", borderRadius: "var(--radius)", background: "#fff" }}>
    <button type="button" title="Gebruik GPS voor thuislocatie" style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 8px",
      background: "var(--accent-soft)", color: "var(--accent-ink)",
      border: "1px solid oklch(0.58 0.12 240 / 0.25)", borderRadius: 4,
      font: "500 11px var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer"
    }}>
      <GpsIcon size={12} /> GPS
    </button>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", lineHeight: 1.1 }}>{location}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink-3)", letterSpacing: "0.04em" }}>{postcode} · thuislocatie</div>
    </div>
    <button type="button" style={{ background: "transparent", border: 0, color: "var(--ink-3)", font: "500 11px var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}>Wijzig</button>
  </div>
);

/* Ambient animated sky — drifting clouds, optional rain, sun/moon */
const Sky = ({ theme = "default", intensity = "soft", location = "De Bilt", temp = "12°", condition = "Half bewolkt", feels = "9°", wind = "14 KM/H", children }) => {
  const clouds = React.useMemo(() => {
    const base = intensity === "heavy" ? 9 : intensity === "medium" ? 6 : 4;
    return Array.from({ length: base }, (_, i) => ({
      id: i,
      top: 10 + (i * 83) % 70,
      width: 90 + ((i * 37) % 120),
      height: 20 + ((i * 11) % 20),
      opacity: 0.5 + ((i * 13) % 40) / 100,
      duration: 60 + ((i * 17) % 80),
      delay: -((i * 23) % 60),
    }));
  }, [intensity]);

  const rain = React.useMemo(() => {
    if (intensity !== "heavy" && theme !== "storm") return [];
    const count = theme === "storm" ? 60 : 30;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: (i * 37) % 100,
      height: 12 + ((i * 7) % 18),
      duration: 0.6 + ((i * 13) % 40) / 100,
      delay: -((i * 11) % 100) / 100,
    }));
  }, [intensity, theme]);

  const stars = React.useMemo(() => {
    if (theme !== "night") return [];
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      top: ((i * 29) % 60),
      left: ((i * 43) % 100),
      delay: ((i * 7) % 30) / 10,
    }));
  }, [theme]);

  return (
    <div className="wz-sky" data-theme={theme} style={{ height: "100%" }}>
      {/* Sun/moon */}
      {theme !== "storm" && (
        <div className="wz-sun" style={{
          top: theme === "night" ? 48 : 72,
          right: theme === "dusk" ? 80 : 96,
          opacity: theme === "default" ? 0.85 : 1,
        }} />
      )}
      {/* Stars */}
      {stars.map(s => (
        <span key={s.id} className="wz-star" style={{ top: `${s.top}%`, left: `${s.left}%`, animationDelay: `${s.delay}s` }} />
      ))}
      {/* Clouds */}
      {clouds.map(c => (
        <div key={c.id} className="wz-cloud" style={{
          top: `${c.top}%`, width: c.width, height: c.height,
          opacity: c.opacity, animationDuration: `${c.duration}s`, animationDelay: `${c.delay}s`,
        }} />
      ))}
      {/* Rain */}
      {rain.map(r => (
        <div key={r.id} className="wz-rain" style={{
          left: `${r.left}%`, height: r.height,
          animationDuration: `${r.duration}s`, animationDelay: `${r.delay}s`,
        }} />
      ))}
      {/* Overlay content */}
      <div className="wz-sky-overlay">
        <div className="wz-sky-top">
          <Logo size={15} />
          <span style={{ font: "400 11px var(--font-mono)", letterSpacing: "0.08em", opacity: 0.75 }}>
            {location.toUpperCase()} · KNMI HARMONIE
          </span>
        </div>
        {children || (
          <div>
            <div className="wz-sky-quote">
              48 uur vooruit.<br/>De rest is ruis.
              <small>— Weerzone manifest</small>
            </div>
            <div className="wz-sky-readout" style={{ marginTop: 28 }}>
              <div className="wz-sky-readout-item"><span className="k">Actueel</span><span className="v">{temp}</span></div>
              <div className="wz-sky-readout-item"><span className="k">Voelt als</span><span className="v">{feels}</span></div>
              <div className="wz-sky-readout-item"><span className="k">Wind</span><span className="v">{wind}</span></div>
              <div className="wz-sky-readout-item"><span className="k">Conditie</span><span className="v" style={{ fontSize: 11, textTransform: "uppercase" }}>{condition}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* SSO icons — vendor-neutral geometric glyphs (placeholder-flavor) */
const GoogleIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path fill="#EA4335" d="M8 3.2a4.6 4.6 0 0 1 3.2 1.25l2.4-2.4A8 8 0 0 0 .98 5.07l2.8 2.17A4.77 4.77 0 0 1 8 3.2Z"/>
    <path fill="#4285F4" d="M15.68 8.18c0-.55-.05-1.08-.14-1.58H8v3h4.3a3.68 3.68 0 0 1-1.6 2.4l2.58 2a7.78 7.78 0 0 0 2.4-5.82Z"/>
    <path fill="#FBBC05" d="M3.78 9.48a4.8 4.8 0 0 1 0-3.06L.98 4.25a8 8 0 0 0 0 7.5l2.8-2.27Z"/>
    <path fill="#34A853" d="M8 16a7.72 7.72 0 0 0 5.28-1.93l-2.58-2A4.8 4.8 0 0 1 3.78 9.48L.98 11.75A8 8 0 0 0 8 16Z"/>
  </svg>
);
const AppleIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path fill="#0F1419" d="M11.14 8.3a3.05 3.05 0 0 1 1.45-2.56 3.13 3.13 0 0 0-2.46-1.33c-1.04-.1-2.03.6-2.56.6-.54 0-1.35-.59-2.22-.57a3.28 3.28 0 0 0-2.77 1.68c-1.19 2.06-.3 5.1.85 6.77.57.82 1.24 1.74 2.11 1.7.85-.03 1.17-.55 2.2-.55 1.02 0 1.32.55 2.21.53.92-.01 1.5-.83 2.06-1.65a7.2 7.2 0 0 0 .94-1.93 2.96 2.96 0 0 1-1.8-2.69ZM9.5 3.34a2.92 2.92 0 0 0 .67-2.09 2.97 2.97 0 0 0-1.94 1 2.78 2.78 0 0 0-.69 2.02 2.46 2.46 0 0 0 1.96-.93Z"/>
  </svg>
);
const KeyIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4">
    <circle cx="5" cy="8" r="3"/>
    <path d="M8 8h6M12 8v2M14 8v2"/>
  </svg>
);
const MailIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4">
    <rect x="2" y="3.5" width="12" height="9" rx="1"/>
    <path d="M2.5 4.5 8 9l5.5-4.5"/>
  </svg>
);
const InfoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
    <circle cx="8" cy="8" r="6.5"/>
    <path d="M8 7.5v3.5M8 5.2v.2" strokeLinecap="round"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="m3 8.5 3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const ArrowIcon = () => <span className="arr">→</span>;

/* Status strip at the bottom of each card */
const StatusStrip = ({ left = "SYSTEEM OPERATIONEEL", right = "v2026.04" }) => (
  <div className="wz-strip">
    <span className="wz-strip-item"><span className="wz-strip-dot" />{left}</span>
    <span className="wz-strip-item">{right}</span>
  </div>
);

/* Generic auth card layout: sky panel on the left, form on the right */
const AuthShell = ({ width = 880, height = 560, sky, children, skyTheme = "default", skyIntensity = "soft", skyChildren }) => (
  <div className="wz-card" style={{ width, height, display: "grid", gridTemplateColumns: "1fr 1fr" }}>
    <div style={{ position: "relative" }}>
      {sky || <Sky theme={skyTheme} intensity={skyIntensity}>{skyChildren}</Sky>}
    </div>
    <div style={{ display: "flex", flexDirection: "column", background: "#fff" }}>
      {children}
    </div>
  </div>
);

/* Mobile frame — chromeless, sized for artboard */
const MobileFrame = ({ width = 390, height = 780, children }) => (
  <div style={{
    width, height, background: "#fff", borderRadius: 34,
    border: "1px solid var(--hair)", boxShadow: "var(--shadow-md)",
    overflow: "hidden", position: "relative",
  }}>
    <div style={{ padding: "12px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, fontWeight: 600 }}>
      <span style={{ fontFamily: "var(--font-mono)" }}>07:42</span>
      <div style={{ display: "inline-flex", gap: 5, alignItems: "center" }}>
        <svg width="16" height="10" viewBox="0 0 16 10" fill="currentColor"><rect x="0" y="6" width="3" height="4" rx="0.5"/><rect x="4" y="4" width="3" height="6" rx="0.5"/><rect x="8" y="2" width="3" height="8" rx="0.5"/><rect x="12" y="0" width="3" height="10" rx="0.5"/></svg>
        <svg width="16" height="10" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1"><rect x="0.5" y="0.5" width="12" height="9" rx="1.5"/><rect x="2" y="2" width="9" height="6" rx="0.5" fill="currentColor"/><rect x="13" y="3" width="2" height="4" rx="0.5" fill="currentColor"/></svg>
      </div>
    </div>
    <div style={{ padding: 24, height: "calc(100% - 32px)", display: "flex", flexDirection: "column" }}>
      {children}
    </div>
  </div>
);

Object.assign(window, {
  Logo, Sky, AuthShell, MobileFrame, StatusStrip, LocationRow,
  GoogleIcon, AppleIcon, KeyIcon, MailIcon, InfoIcon, CheckIcon, ArrowIcon, GpsIcon,
});
