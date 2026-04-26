// Checkout screen — uses Weerzone Piet/Reed plans
function CheckoutScreen({ nav, planId }) {
  const plan = (window.PLANS || []).find(p => p.id === planId) || (window.PLANS || [])[0];
  const [method, setMethod] = React.useState('ideal');
  const [bank, setBank] = React.useState('ing');
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [postcode, setPostcode] = React.useState('');
  const [done, setDone] = React.useState(false);

  if (done) return (
    <div style={{minHeight:'100%', background:'var(--bg)'}}>
      <WzNavbar nav={nav} />
      <div style={{display:'flex', alignItems:'center', justifyContent:'center', padding: 40, minHeight: 500}}>
        <div className="card" style={{padding: 40, maxWidth: 480, textAlign:'center'}}>
          <div style={{width: 72, height: 72, borderRadius:'50%', background:'var(--success-bg)', color:'var(--success)',
            display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom: 20}}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M4 12l5 5L20 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h1 className="h-1" style={{marginBottom: 8}}>Welkom bij Weerzone {plan.name}!</h1>
          <p className="t-body" style={{marginBottom: 8}}>
            Morgenochtend vóór 7:00 staat je eerste weermail op {postcode || 'jouw postcode'} klaar in je inbox.
          </p>
          <p className="t-small" style={{marginBottom: 24}}>
            Je bent nu tijdelijk <strong>gratis</strong> ingeschreven — geen creditcard nodig.
          </p>
          <button className="btn btn-primary btn-block btn-lg" onClick={() => nav('account')}>
            Naar mijn account →
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:'100%', background:'var(--bg)'}}>
      <WzNavbar nav={nav} active="prijzen"/>

      <div style={{maxWidth: 1000, margin:'0 auto', padding:'clamp(24px, 4vw, 48px) clamp(16px, 3vw, 32px)'}}>
        <button className="btn btn-link" style={{marginBottom: 16}} onClick={() => nav('pricing')}>← Terug naar abonnementen</button>

        <div style={{display:'grid', gridTemplateColumns:'minmax(0, 1.3fr) minmax(0, 1fr)', gap: 'clamp(20px, 3vw, 32px)'}} className="checkout-grid">
          <div>
            <h1 className="h-1" style={{marginBottom: 8}}>Aanmelden voor {plan.name}</h1>
            <p className="t-body" style={{marginBottom: 28}}>
              Nu nog gratis, geen creditcard nodig. Je schrijft je in zonder verplichting.
            </p>

            <div className="card card-pad" style={{marginBottom: 20}}>
              <h3 className="h-3" style={{marginBottom: 14}}>Jouw gegevens</h3>
              <TextField label="Naam" value={name} onChange={setName} placeholder="Jouw naam"/>
              <TextField label="E-mailadres" type="email" value={email} onChange={setEmail} placeholder="je@voorbeeld.nl"/>
              <div style={{marginBottom: 4}}>
                <label className="t-small" style={{display:'block', marginBottom: 6, fontWeight: 600, color:'var(--text)'}}>Thuislocatie</label>
                <button type="button" onClick={() => setPostcode(postcode || '3731 GA')}
                  style={{
                    width:'100%', display:'flex', alignItems:'center', gap: 12, padding:'12px 14px',
                    background: postcode ? 'var(--brand-soft)' : '#fff',
                    border: '1px solid ' + (postcode ? 'var(--brand)' : 'var(--border)'),
                    borderRadius: 12, cursor:'pointer', textAlign:'left',
                  }}>
                  <span style={{
                    display:'inline-flex', alignItems:'center', justifyContent:'center',
                    width: 36, height: 36, borderRadius:'50%',
                    background: 'var(--brand)', color:'#fff', flex:'0 0 auto'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2.2" fill="currentColor" stroke="none"/>
                      <path d="M8 .5v2M8 13.5v2M.5 8h2M13.5 8h2" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700, fontSize:14}}>{postcode ? 'De Bilt · ' + postcode : 'Gebruik GPS voor thuislocatie'}</div>
                    <div style={{fontSize:12, color:'var(--text-mute)'}}>{postcode ? 'GPS · thuislocatie bepaald' : 'We bepalen je thuislocatie eenmalig via GPS'}</div>
                  </div>
                  <span style={{fontSize:12, color:'var(--text-mute)', fontWeight:600}}>{postcode ? 'WIJZIG' : 'ZET AAN →'}</span>
                </button>
              </div>
            </div>

            <div className="card card-pad">
              <h3 className="h-3" style={{marginBottom: 6}}>Betaalmethode — later</h3>
              <p className="t-small" style={{marginBottom: 14}}>Je betaalt nu niets. Zodra we live gaan vragen we je je betaalmethode te bevestigen.</p>
              <div style={{display:'grid', gap: 10}}>
                {[
                  ['ideal','iDEAL', 'Direct via je bank'],
                  ['card','Creditcard', 'Visa, Mastercard, Amex'],
                  ['bancontact','Bancontact', 'Voor Belgische klanten'],
                ].map(([k, l, d]) => (
                  <label key={k} className="card" style={{padding: 14, cursor:'pointer', display:'flex', gap: 12, alignItems:'center',
                    borderColor: method===k ? 'var(--brand)' : 'var(--border)',
                    background: method===k ? 'var(--brand-soft)' : '#fff',
                  }}>
                    <input type="radio" checked={method===k} onChange={() => setMethod(k)} style={{width:18, height:18, accentColor:'var(--brand)'}}/>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700, fontSize:15}}>{l}</div>
                      <div style={{fontSize:13, color:'var(--text-mute)'}}>{d}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="card card-pad" style={{position:'sticky', top: 88}}>
              <div className="t-micro" style={{marginBottom: 8}}>Besteloverzicht</div>
              <h3 className="h-2" style={{marginBottom: 4}}>Weerzone {plan.name}</h3>
              <p className="t-small" style={{marginBottom: 20}}>{plan.tagline}</p>

              <div style={{display:'flex', justifyContent:'space-between', padding:'12px 0', borderTop:'1px solid var(--border)'}}>
                <span className="t-small">Abonnement</span>
                <span style={{fontSize:14, fontWeight:700}}>{plan.name} · {plan.tag}</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', padding:'12px 0', borderTop:'1px solid var(--border)'}}>
                <span className="t-small">Periode</span>
                <span style={{fontSize:14, fontWeight:700}}>Tijdelijk gratis</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', padding:'12px 0', borderTop:'1px solid var(--border)'}}>
                <span className="t-small">Normale prijs straks</span>
                <span style={{fontSize:14, fontWeight:700, color:'var(--text-mute)'}}>{plan.priceLater}</span>
              </div>

              <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'16px 0 0', borderTop:'2px solid var(--ink-900)', marginTop: 4}}>
                <span style={{fontSize:15, fontWeight:800}}>Vandaag te betalen</span>
                <span style={{fontSize:24, fontWeight:800}}>€0,00</span>
              </div>
              <div className="t-small" style={{textAlign:'right', marginTop: 4}}>
                Straks: {plan.priceLater} · opzeggen kan maandelijks
              </div>

              <button className="btn btn-primary btn-block btn-lg" style={{marginTop: 20}} onClick={() => setDone(true)}>
                Bevestig aanmelding
              </button>
              <p className="t-small" style={{marginTop: 12, textAlign:'center'}}>
                Geen creditcard nodig. Opzeggen op elk moment.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 760px) {
          .checkout-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

Object.assign(window, { CheckoutScreen });
