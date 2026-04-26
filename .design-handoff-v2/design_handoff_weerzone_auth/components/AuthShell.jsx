// Shared auth shell — left marketing side + right form side
function AuthShell({ title, subtitle, children, footer, quote }) {
  return (
    <div className="auth-shell">
      <aside className="auth-side">
        <div className="brand-pill">
          <img src="assets/weerzone-logo.png" alt="Weerzone" className="brand-logo" />
        </div>

        <div className="side-hero">
          {/* Big homepage-style weer-tegel */}
          <div className="homecard">
            <div className="homecard-top">
              <div>
                <div className="homecard-kicker">Vandaag · De Bilt</div>
                <div className="homecard-temp">12<span className="deg">°</span></div>
                <div className="homecard-sub">Voelt als 9° · wind 14 km/u N</div>
              </div>
              <div className="homecard-sun" aria-hidden="true">
                <svg viewBox="0 0 64 64" width="92" height="92">
                  <circle cx="24" cy="32" r="12" fill="#FFD21A"/>
                  {Array.from({length:8}).map((_,i)=>{
                    const a = (i*45)*Math.PI/180;
                    const x1 = 24 + Math.cos(a)*16, y1 = 32 + Math.sin(a)*16;
                    const x2 = 24 + Math.cos(a)*22, y2 = 32 + Math.sin(a)*22;
                    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFD21A" strokeWidth="3" strokeLinecap="round"/>;
                  })}
                  <path d="M28 40c4-2 10-2 14 0 4 2 10 2 16 0v8c-6 2-12 2-16 0-4-2-10-2-14 0z" fill="#fff" opacity=".92"/>
                  <path d="M20 46c6-2 12-2 18 0 6 2 14 2 20 0v6c-6 2-14 2-20 0-6-2-12-2-18 0z" fill="#fff" opacity=".75"/>
                </svg>
              </div>
            </div>
            <div className="homecard-strip">
              {[['09:00','10°','☀'],['12:00','13°','⛅'],['15:00','14°','⛅'],['18:00','11°','🌧'],['21:00','8°','🌧']].map(([t,v,g])=>(
                <div key={t} className="homecard-tick">
                  <div className="tk">{t}</div>
                  <div className="gl">{g}</div>
                  <div className="vl">{v}</div>
                </div>
              ))}
            </div>
          </div>

          <h2>{title || "48 uur vooruit.\nDe rest is ruis."}</h2>
          <p>{subtitle || "Per GPS, op jouw locatie. Elke ochtend een persoonlijk weerbericht — geen reclame, geen gokwerk."}</p>

          {quote && (
            <div className="side-quote">
              <p>“{quote.text}”</p>
              <div>— {quote.author}</div>
            </div>
          )}
        </div>

        <div className="side-foot">© 2026 Weerzone · Dagelijks weer voor Nederland</div>
      </aside>
      <main className="auth-panel">
        <div className="auth-inner">
          {children}
          {footer && <div style={{marginTop: 20, textAlign: 'center', fontSize: 14, color: 'var(--text-soft)'}}>{footer}</div>}
        </div>
      </main>
    </div>
  );
}

function SocialButtons({ onPick }) {
  return (
    <div style={{display:'grid', gap: 10}}>
      <button className="btn btn-ghost btn-block" onClick={() => onPick && onPick('google')}>
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.92v2.33A9 9 0 0 0 9 18z"/>
          <path fill="#FBBC05" d="M3.98 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.3-1.72V4.95H.92A9 9 0 0 0 0 9c0 1.45.35 2.82.92 4.05l3.06-2.33z"/>
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .92 4.95L3.98 7.28C4.68 5.16 6.66 3.58 9 3.58z"/>
        </svg>
        Ga verder met Google
      </button>
      <button className="btn btn-ghost btn-block" onClick={() => onPick && onPick('apple')}>
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#000" d="M14.94 13.86c-.27.62-.58 1.18-.95 1.7-.5.7-.91 1.19-1.23 1.46-.5.43-1.03.65-1.6.67-.4 0-.9-.12-1.47-.35-.58-.23-1.1-.35-1.59-.35-.5 0-1.05.12-1.63.35-.59.23-1.06.35-1.42.37-.55.02-1.09-.21-1.63-.69-.34-.29-.78-.8-1.3-1.52C1.54 14.7 1.08 13.8.7 12.78.3 11.68.1 10.62.1 9.6c0-1.17.25-2.18.76-3.03.4-.68.93-1.22 1.6-1.61.65-.4 1.37-.6 2.13-.61.43 0 1 .13 1.72.4.71.26 1.17.39 1.37.39.15 0 .66-.16 1.52-.46.82-.28 1.51-.4 2.08-.35 1.53.12 2.68.73 3.44 1.82-1.37.83-2.05 1.99-2.03 3.48.02 1.16.44 2.13 1.26 2.89.37.36.78.63 1.24.83-.1.29-.2.57-.31.84zM11.78.36c0 .88-.32 1.7-.96 2.46-.77.9-1.7 1.42-2.71 1.34a2.73 2.73 0 0 1-.02-.33c0-.84.37-1.74 1.03-2.48.33-.38.74-.69 1.25-.94.5-.24.97-.38 1.42-.4.01.12.01.24 0 .35z"/>
        </svg>
        Ga verder met Apple
      </button>
    </div>
  );
}

function Divider({ children }) {
  return <div className="divider">{children || 'of'}</div>;
}

Object.assign(window, { AuthShell, SocialButtons, Divider });
