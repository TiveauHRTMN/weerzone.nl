// Screen: Welkomst-onboarding (3 stappen)
function OnboardingScreen({ nav }) {
  const [step, setStep] = React.useState(0);
  const [location, setLocation] = React.useState('Utrecht');
  const [topics, setTopics] = React.useState(['rain','temp']);
  const [time, setTime] = React.useState('07:00');

  const toggle = (k) => setTopics(ts => ts.includes(k) ? ts.filter(t => t !== k) : [...ts, k]);

  const steps = [
    {
      title: "Waar ben je?",
      sub: "We gebruiken GPS om je thuislocatie eenmalig te bepalen. Later kan je meer plekken toevoegen.",
      body: (
        <div style={{display:'grid', gap: 14}}>
          <button type="button" onClick={() => setLocation('Utrecht')}
            style={{
              display:'flex', alignItems:'center', gap: 14, padding:'16px 18px',
              background: location ? 'var(--brand-soft)' : '#fff',
              border:'1px solid ' + (location ? 'var(--brand)' : 'var(--border)'),
              borderRadius: 14, cursor:'pointer', textAlign:'left',
            }}>
            <span style={{
              display:'inline-flex', alignItems:'center', justifyContent:'center',
              width: 44, height: 44, borderRadius:'50%',
              background:'var(--brand)', color:'#fff', flex:'0 0 auto'
            }}>
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2.2" fill="currentColor" stroke="none"/>
                <path d="M8 .5v2M8 13.5v2M.5 8h2M13.5 8h2" strokeLinecap="round"/>
              </svg>
            </span>
            <div style={{flex:1}}>
              <div style={{fontWeight:800, fontSize:16}}>{location ? location + ' · 3731 GA' : 'Gebruik GPS voor thuislocatie'}</div>
              <div style={{fontSize:13, color:'var(--text-mute)', marginTop: 2}}>{location ? 'GPS · thuislocatie bepaald' : 'Je telefoon bepaalt eenmalig waar thuis is'}</div>
            </div>
            <span style={{fontSize:12, color:'var(--text-mute)', fontWeight:700, letterSpacing:'.06em'}}>{location ? 'WIJZIG' : 'ZET AAN →'}</span>
          </button>
          {location && (
            <div style={{fontSize:13, color:'var(--text-mute)', paddingLeft: 4}}>
              Geen GPS? <a href="#" onClick={e=>e.preventDefault()} style={{color:'var(--brand)'}}>Voer handmatig postcode in</a>
            </div>
          )}
        </div>
      )
    },
    {
      title: "Waar wil je op geattendeerd worden?",
      sub: "Kies de onderwerpen die jij belangrijk vindt. Je kunt dit altijd aanpassen.",
      body: (
        <div style={{display:'grid', gap: 10}}>
          {[
            {k:'rain',  t:'Regen & buien',    d:'Meldingen bij regenkans boven 70%'},
            {k:'temp',  t:'Temperatuur',      d:'Bij hitte, vorst of scherpe wisselingen'},
            {k:'wind',  t:'Wind & storm',     d:'Code geel, oranje of rood', reed:true},
            {k:'uv',    t:'UV & pollen',      d:'Voor buitenplannen en allergieën'},
            {k:'snow',  t:'Winterweer',       d:'Sneeuw, gladheid en ijsvorming', reed:true},
          ].map(o => (
            <label key={o.k} className="card" style={{padding: 14, cursor:'pointer', display:'flex', gap: 12, alignItems:'center',
              borderColor: topics.includes(o.k) ? 'var(--brand)' : 'var(--border)',
              background: topics.includes(o.k) ? 'var(--brand-soft)' : '#fff',
            }}>
              <input type="checkbox" checked={topics.includes(o.k)} onChange={() => toggle(o.k)} style={{width:18, height:18, accentColor:'var(--brand)'}}/>
              <div style={{flex:1}}>
                <div style={{fontWeight:700, fontSize:15, display:'flex', alignItems:'center', gap:8}}>
                  {o.t}
                  {o.reed && <span className="badge" style={{background:'#fff5c2', color:'#8a6100', fontSize:9}}>REED</span>}
                </div>
                <div style={{fontSize:13, color:'var(--text-mute)'}}>{o.d}</div>
              </div>
            </label>
          ))}
        </div>
      )
    },
    {
      title: "Wanneer wil je je bericht?",
      sub: "We sturen je één keer per dag een e-mail met Piet's Update, afgestemd op jouw voorkeuren.",
      body: (
        <div style={{display:'grid', gap: 10}}>
          {[
            {k:'06:30', t:'Vroege vogel',   d:'06:30 — voordat je de deur uit gaat'},
            {k:'07:00', t:'Ontbijt',        d:'07:00 — bij je eerste bak koffie'},
            {k:'08:00', t:'Rustige start',  d:'08:00 — voor een relaxte ochtend'},
            {k:'avond', t:'Avond vooruitblik',d:'19:00 — weer voor morgen, vanavond al'},
          ].map(o => (
            <label key={o.k} className="card" style={{padding: 14, cursor:'pointer', display:'flex', gap: 12, alignItems:'center',
              borderColor: time===o.k ? 'var(--brand)' : 'var(--border)',
              background: time===o.k ? 'var(--brand-soft)' : '#fff',
            }}>
              <input type="radio" checked={time===o.k} onChange={() => setTime(o.k)} style={{width:18, height:18, accentColor:'var(--brand)'}}/>
              <div style={{flex:1}}>
                <div style={{fontWeight:700, fontSize:15}}>{o.t}</div>
                <div style={{fontSize:13, color:'var(--text-mute)'}}>{o.d}</div>
              </div>
            </label>
          ))}
        </div>
      )
    },
  ];
  const s = steps[step];

  return (
    <div style={{minHeight:'100%', display:'flex', flexDirection:'column', background:'var(--bg)'}}>
      {/* Top bar */}
      <div style={{padding:'20px 32px', borderBottom:'1px solid var(--border)', background:'#fff',
        display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <div style={{display:'flex', alignItems:'center', gap: 12}}>
          <div style={{height:28, display:'inline-flex', alignItems:'center', padding:'0 12px',
            background:'var(--wz-blue)', borderRadius: 8}}>
            <img src="assets/weerzone-logo.png" alt="Weerzone" style={{height: 18}}/>
          </div>
          <span className="t-micro">Instellen</span>
        </div>
        <button className="btn btn-link" onClick={() => nav('pricing')}>Overslaan →</button>
      </div>

      {/* Progress */}
      <div style={{padding:'24px 32px 0'}}>
        <div style={{maxWidth: 560, margin:'0 auto'}}>
          <div style={{display:'flex', gap: 6}}>
            {steps.map((_, i) => (
              <div key={i} style={{flex:1, height: 4, borderRadius:999,
                background: i<=step ? 'var(--brand)' : 'var(--ink-200)', transition:'background .25s'}}/>
            ))}
          </div>
          <div className="t-small" style={{marginTop: 8}}>Stap {step+1} van {steps.length}</div>
        </div>
      </div>

      {/* Body */}
      <div style={{flex:1, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'32px'}}>
        <div style={{maxWidth: 560, width:'100%'}}>
          <h1 className="h-1" style={{marginBottom: 8}}>{s.title}</h1>
          <p className="t-body" style={{marginBottom: 28}}>{s.sub}</p>
          {s.body}

          <div style={{display:'flex', gap: 10, marginTop: 28, justifyContent:'space-between'}}>
            <button className="btn btn-ghost" onClick={() => step===0 ? nav('signup') : setStep(step-1)}>
              ← Terug
            </button>
            {step < steps.length - 1 ? (
              <button className="btn btn-primary" onClick={() => setStep(step+1)}>Verder →</button>
            ) : (
              <button className="btn btn-primary" onClick={() => nav('pricing')}>Klaar, toon me de opties →</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { OnboardingScreen });
