// Shared Weerzone site chrome — sticky navbar + footer
function WzNavbar({ nav, active }) {
  const [open, setOpen] = React.useState(false);

  const links = [
    ['weer',    'Weer',      () => nav && nav('home')],
    ['radar',   'Radar',     null],
    ['prijzen', 'Prijzen',   () => nav && nav('pricing')],
    ['over',    'Over ons',  null],
  ];

  return (
    <>
      <header style={{
        position:'sticky', top:0, zIndex: 50,
        background:'rgba(255,255,255,.92)',
        backdropFilter:'blur(12px)',
        WebkitBackdropFilter:'blur(12px)',
        borderBottom:'1px solid var(--border)',
      }}>
        <div style={{
          maxWidth: 1200, margin:'0 auto',
          padding:'14px clamp(16px, 3vw, 32px)',
          display:'flex', alignItems:'center', justifyContent:'space-between', gap: 20,
        }}>
          <a href="#" onClick={e => {e.preventDefault(); nav && nav('home');}}
            style={{display:'inline-flex', alignItems:'center', gap: 10, textDecoration:'none'}}>
            <div style={{background:'var(--wz-blue)', padding:'6px 12px', borderRadius: 8}}>
              <img src="assets/weerzone-logo.png" alt="Weerzone" style={{height: 20, display:'block'}}/>
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="wz-desktop-nav" style={{display:'flex', gap: 4, alignItems:'center'}}>
            {links.map(([k, l, fn]) => (
              <a key={k} href="#" onClick={e => {e.preventDefault(); fn && fn();}}
                style={{
                  padding:'8px 14px', borderRadius: 8, textDecoration:'none',
                  fontSize: 14, fontWeight: 600,
                  color: active === k ? 'var(--brand)' : 'var(--text-soft)',
                  background: active === k ? 'var(--brand-soft)' : 'transparent',
                }}>{l}</a>
            ))}
          </nav>

          <div className="wz-desktop-nav" style={{display:'flex', gap: 8, alignItems:'center'}}>
            <button className="btn btn-ghost btn-sm" onClick={() => nav && nav('login')}>Inloggen</button>
            <button className="btn btn-primary btn-sm" onClick={() => nav && nav('signup')}>Aanmelden</button>
          </div>

          {/* Mobile burger */}
          <button className="wz-burger" onClick={() => setOpen(!open)}
            aria-label="Menu"
            style={{
              display:'none', background:'transparent', border:'1px solid var(--border)',
              borderRadius: 10, width: 40, height: 40, cursor:'pointer',
              alignItems:'center', justifyContent:'center',
            }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              {open ? (
                <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              ) : (
                <>
                  <path d="M2 5h14M2 9h14M2 13h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile drawer */}
        {open && (
          <div className="wz-mobile-drawer" style={{
            borderTop:'1px solid var(--border)',
            background:'#fff', padding:'12px 20px 20px',
          }}>
            <nav style={{display:'grid', gap: 2}}>
              {links.map(([k, l, fn]) => (
                <a key={k} href="#" onClick={e => {e.preventDefault(); fn && fn(); setOpen(false);}}
                  style={{
                    padding:'12px 14px', borderRadius: 10, textDecoration:'none',
                    fontSize: 15, fontWeight: 600,
                    color: active === k ? 'var(--brand)' : 'var(--text)',
                    background: active === k ? 'var(--brand-soft)' : 'transparent',
                  }}>{l}</a>
              ))}
            </nav>
            <div style={{display:'grid', gap: 8, marginTop: 12, borderTop:'1px solid var(--border)', paddingTop: 12}}>
              <button className="btn btn-ghost btn-block" onClick={() => { setOpen(false); nav && nav('login'); }}>Inloggen</button>
              <button className="btn btn-primary btn-block" onClick={() => { setOpen(false); nav && nav('signup'); }}>Aanmelden</button>
            </div>
          </div>
        )}
      </header>

      <style>{`
        @media (max-width: 760px) {
          .wz-desktop-nav { display: none !important; }
          .wz-burger { display: inline-flex !important; }
        }
      `}</style>
    </>
  );
}

function WzFooter() {
  return (
    <footer style={{
      background:'#0f1a2c', color:'#b9c4dc',
      padding:'clamp(40px, 6vw, 64px) clamp(20px, 4vw, 48px)',
      marginTop: 'clamp(40px, 6vw, 80px)',
    }}>
      <div style={{maxWidth: 1200, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap: 32}}>
        <div>
          <div style={{background:'var(--wz-blue)', display:'inline-block', padding:'6px 12px', borderRadius: 8, marginBottom: 14}}>
            <img src="assets/weerzone-logo.png" alt="Weerzone" style={{height: 20, display:'block'}}/>
          </div>
          <p style={{fontSize: 13, lineHeight: 1.6, color:'#8998b9', margin: 0, maxWidth: 260}}>
            48 uur vooruit. De rest is ruis. Dagelijks weer voor Nederland, zonder reclame.
          </p>
        </div>
        {[
          ['Product', ['Piet', 'Reed', 'Prijzen']],
          ['Bedrijf', ['Over ons', 'Blog', 'Contact', 'Pers']],
          ['Juridisch', ['Voorwaarden', 'Privacy', 'Cookies']],
        ].map(([h, items]) => (
          <div key={h}>
            <div style={{fontSize: 12, fontWeight: 800, letterSpacing:'.1em', textTransform:'uppercase', color:'#fff', marginBottom: 14}}>{h}</div>
            <ul style={{listStyle:'none', padding:0, margin:0, display:'grid', gap: 8}}>
              {items.map(i => <li key={i}><a href="#" style={{color:'#8998b9', textDecoration:'none', fontSize: 14}}>{i}</a></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div style={{maxWidth: 1200, margin:'32px auto 0', paddingTop: 24, borderTop:'1px solid rgba(255,255,255,.08)',
        fontSize: 12, color:'#6b7997'}}>
        © 2026 Weerzone · Made with ☀ in Nederland
      </div>
    </footer>
  );
}

Object.assign(window, { WzNavbar, WzFooter });
