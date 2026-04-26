// Account screen (settings + subscription management, tabbed)
function AccountScreen({ nav }) {
  const [tab, setTab] = React.useState('profile'); // profile | security | subscription | billing
  const [plan, setPlan] = React.useState('piet'); // current plan
  const [name, setName] = React.useState('Piet de Vries');
  const [email, setEmail] = React.useState('piet@weerzone.nl');
  const [loc, setLoc] = React.useState('Utrecht');
  const [notifs, setNotifs] = React.useState({rain:true, storm:true, uv:false, daily:true});
  const [showCancel, setShowCancel] = React.useState(false);
  const [cancelled, setCancelled] = React.useState(false);

  const currentPlan = (window.PLANS || []).find(p => p.id === plan) || (window.PLANS || [])[0];

  return (
    <div style={{minHeight:'100%', background:'var(--bg)'}}>
      {/* Top bar */}
      <div style={{padding:'16px 32px', borderBottom:'1px solid var(--border)', background:'#fff',
        display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <div style={{display:'flex', alignItems:'center', gap: 14}}>
          <div style={{height:28, display:'inline-flex', alignItems:'center', padding:'0 12px', background:'var(--wz-blue)', borderRadius: 8}}>
            <img src="assets/weerzone-logo.png" alt="Weerzone" style={{height: 18}}/>
          </div>
          <div style={{width:1, height: 20, background:'var(--border)'}}/>
          <span style={{fontSize: 14, fontWeight: 700}}>Mijn account</span>
        </div>
        <div style={{display:'flex', alignItems:'center', gap: 12}}>
          <a href="#" className="kbd-link" style={{fontSize: 14}}>Weerbericht bekijken</a>
          <div style={{width:32, height:32, borderRadius:'50%', background:'var(--wz-blue)', color:'#fff',
            display:'flex', alignItems:'center', justifyContent:'center', fontWeight: 800, fontSize: 13}}>
            PV
          </div>
        </div>
      </div>

      <div style={{maxWidth: 1080, margin:'0 auto', padding: 40, display:'grid', gridTemplateColumns:'240px 1fr', gap: 32}}>
        {/* Side nav */}
        <aside>
          <div className="t-micro" style={{marginBottom: 12}}>Instellingen</div>
          <nav style={{display:'grid', gap: 2}}>
            {[
              ['profile', 'Profiel', '👤'],
              ['security', 'Inloggen & beveiliging', '🔒'],
              ['subscription', 'Abonnement', '⭐'],
              ['billing', 'Facturen & betalingen', '💳'],
            ].map(([k, l, ic]) => (
              <button key={k} onClick={() => setTab(k)}
                className="btn"
                style={{
                  justifyContent:'flex-start', textAlign:'left',
                  background: tab===k ? 'var(--brand-soft)' : 'transparent',
                  color: tab===k ? 'var(--brand)' : 'var(--text-soft)',
                  border:'none', borderRadius: 10, padding:'10px 12px', fontWeight: 600,
                }}>
                <span style={{opacity:.85}}>{ic}</span> {l}
              </button>
            ))}
          </nav>
          <div style={{marginTop: 24, padding: 14, background:'#fff', border:'1px solid var(--border)', borderRadius: 14}}>
            <div className="t-micro" style={{marginBottom: 6}}>Huidig abonnement</div>
            <div style={{fontWeight: 800, fontSize: 16, marginBottom: 6}}>Weerzone {currentPlan.name}</div>
            <button className="btn btn-link" style={{fontSize: 13, padding: 0}} onClick={() => setTab('subscription')}>
              Beheren →
            </button>
          </div>
        </aside>

        {/* Content */}
        <main>
          {tab === 'profile' && (
            <>
              <h1 className="h-1" style={{marginBottom: 8}}>Profiel</h1>
              <p className="t-body" style={{marginBottom: 28}}>Wat je hier invult, gebruiken we om je weerbericht persoonlijker te maken.</p>

              <div className="card card-pad" style={{marginBottom: 20}}>
                <h3 className="h-3" style={{marginBottom: 14}}>Persoonlijke gegevens</h3>
                <TextField label="Naam" value={name} onChange={setName} />
                <TextField label="E-mailadres" type="email" value={email} onChange={setEmail} hint="We sturen een bevestiging bij wijzigingen."/>
                <div style={{marginBottom: 16}}>
                  <label className="t-small" style={{display:'block', marginBottom: 6, fontWeight: 700, color:'var(--text)'}}>Thuislocatie</label>
                  <button type="button" onClick={() => setLoc(loc || 'De Bilt · 3731 GA')}
                    style={{
                      width:'100%', display:'flex', alignItems:'center', gap: 12, padding:'12px 14px',
                      background:'var(--brand-soft)', border:'1px solid var(--brand)',
                      borderRadius: 12, cursor:'pointer', textAlign:'left'
                    }}>
                    <span style={{
                      display:'inline-flex', alignItems:'center', justifyContent:'center',
                      width: 36, height: 36, borderRadius:'50%',
                      background:'var(--brand)', color:'#fff', flex:'0 0 auto'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2.2" fill="currentColor" stroke="none"/>
                        <path d="M8 .5v2M8 13.5v2M.5 8h2M13.5 8h2" strokeLinecap="round"/>
                      </svg>
                    </span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700, fontSize:14}}>{loc || 'Gebruik GPS voor thuislocatie'}</div>
                      <div style={{fontSize:12, color:'var(--text-mute)'}}>GPS · thuislocatie bepaald</div>
                    </div>
                    <span style={{fontSize:11, color:'var(--text-mute)', fontWeight:700, letterSpacing:'.06em'}}>{loc ? 'OPNIEUW' : 'ZET AAN'}</span>
                  </button>
                </div>
                <button className="btn btn-primary">Opslaan</button>
              </div>

              <div className="card card-pad">
                <h3 className="h-3" style={{marginBottom: 14}}>Meldingen</h3>
                <div style={{display:'grid', gap: 12}}>
                  {[
                    ['daily', 'Dagelijks weerbericht', 'Elke ochtend om 07:00 in je inbox', false],
                    ['rain',  'Regen & buien',        'Melding bij regenkans boven 70%', false],
                    ['uv',    'UV & pollen',          'Als waarden boven de grenswaarde komen', false],
                    ['storm', 'Storm & waarschuwingen','Code geel, oranje of rood — extreem weer index', true],
                  ].map(([k, l, d, reed]) => {
                    const locked = reed && plan !== 'reed';
                    return (
                      <label key={k} style={{display:'flex', alignItems:'center', gap: 14, padding: '12px 0', borderTop: '1px solid var(--border)', opacity: locked ? .55 : 1}}>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700, fontSize:15, display:'flex', alignItems:'center', gap:8}}>
                            {l}
                            {reed && <span className="badge" style={{background:'#fff5c2', color:'#8a6100', fontSize:9}}>REED</span>}
                          </div>
                          <div style={{fontSize:13, color:'var(--text-mute)'}}>{locked ? 'Upgrade naar Reed om aan te zetten' : d}</div>
                        </div>
                        <Toggle on={!locked && notifs[k]} onChange={v => !locked && setNotifs({...notifs, [k]: v})}/>
                      </label>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {tab === 'security' && (
            <>
              <h1 className="h-1" style={{marginBottom: 8}}>Inloggen & beveiliging</h1>
              <p className="t-body" style={{marginBottom: 28}}>Houd je account veilig. We raden een uniek wachtwoord aan.</p>

              <div className="card card-pad" style={{marginBottom: 20}}>
                <h3 className="h-3" style={{marginBottom: 14}}>Wachtwoord wijzigen</h3>
                <PasswordField label="Huidig wachtwoord" placeholder="••••••••"/>
                <PasswordField label="Nieuw wachtwoord" placeholder="Minimaal 8 tekens" showStrength autoComplete="new-password"/>
                <PasswordField label="Bevestig nieuw wachtwoord" placeholder="Nogmaals" autoComplete="new-password"/>
                <button className="btn btn-primary">Wachtwoord opslaan</button>
              </div>

              <div className="card card-pad" style={{marginBottom: 20}}>
                <h3 className="h-3" style={{marginBottom: 6}}>Tweestapsverificatie</h3>
                <p className="t-small" style={{marginBottom: 14}}>Extra beveiliging met een code uit je authenticator-app.</p>
                <button className="btn btn-soft">Inschakelen</button>
              </div>

              <div className="card card-pad" style={{borderColor:'#f0c7c4', background:'#fff9f9'}}>
                <h3 className="h-3" style={{marginBottom: 6}}>Gevarenzone</h3>
                <p className="t-small" style={{marginBottom: 14}}>Je kunt je account permanent verwijderen. Dit kan niet ongedaan gemaakt worden.</p>
                <button className="btn btn-danger-ghost">Account verwijderen</button>
              </div>
            </>
          )}

          {tab === 'subscription' && (
            <>
              <h1 className="h-1" style={{marginBottom: 8}}>Abonnement</h1>
              <p className="t-body" style={{marginBottom: 28}}>Beheer je Weerzone abonnement. Wijzigingen gaan direct in.</p>

              {/* Current plan */}
              <div className="card" style={{padding: 24, marginBottom: 20, borderColor:'var(--brand)',
                background: 'linear-gradient(135deg, #e8f0ff 0%, #f5f7fb 100%)'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap: 20, flexWrap:'wrap'}}>
                  <div>
                    <span className="badge brand">Actief</span>
                    <h2 className="h-2" style={{marginTop: 12, marginBottom: 6}}>Weerzone {currentPlan.name}</h2>
                    <p className="t-small">Tijdelijk gratis · straks {currentPlan.priceLater}</p>
                  </div>
                  <div style={{display:'flex', gap: 10, flexWrap:'wrap'}}>
                    <button className="btn btn-soft" onClick={() => nav('pricing')}>Wijzig abonnement</button>
                    {!cancelled && <button className="btn btn-danger-ghost" onClick={() => setShowCancel(true)}>Opzeggen</button>}
                  </div>
                </div>
              </div>

              {/* Plan compare */}
              <h3 className="h-3" style={{marginBottom: 14}}>Andere opties</h3>
              <div style={{display:'grid', gap: 12}}>
                {(window.PLANS || []).map(p => (
                  <div key={p.id} className="card" style={{
                    padding: 18, display:'flex', justifyContent:'space-between', alignItems:'center', gap: 16,
                    borderColor: p.id === plan ? 'var(--brand)' : 'var(--border)',
                  }}>
                    <div>
                      <div style={{fontWeight: 800, fontSize: 16, marginBottom: 2}}>Weerzone {p.name}</div>
                      <div className="t-small">{p.blurb}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize: 16, fontWeight: 800}}>Gratis</div>
                      <div style={{fontSize: 11, color:'var(--text-mute)'}}>straks {p.priceLater}</div>
                      {p.id === plan
                        ? <span className="badge brand" style={{marginTop: 6}}>Huidig</span>
                        : <button className="btn btn-sm btn-ghost" style={{marginTop: 6}} onClick={() => setPlan(p.id)}>
                            {PLANS_RANK[p.id] > PLANS_RANK[plan] ? 'Upgrade' : 'Wissel'}
                          </button>
                      }
                    </div>
                  </div>
                ))}
              </div>

              {cancelled && (
                <div className="card" style={{padding: 18, marginTop: 20, background:'var(--warning-bg)', borderColor:'#f0d8a0'}}>
                  <div style={{fontWeight: 700, marginBottom: 4, color:'var(--warning)'}}>Opzegging bevestigd</div>
                  <div style={{fontSize: 13, color: 'var(--text-soft)'}}>Je houdt toegang tot 4 mei 2026. Daarna stopt je weermail.</div>
                </div>
              )}

              {/* Cancel modal */}
              {showCancel && (
                <div style={{position:'fixed', inset:0, background:'rgba(15,26,44,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 100, padding: 20}}>
                  <div className="card" style={{padding: 28, maxWidth: 440, width:'100%'}}>
                    <h3 className="h-2" style={{marginBottom: 8}}>Zeker weten dat je wilt opzeggen?</h3>
                    <p className="t-body" style={{marginBottom: 20}}>
                      Je houdt toegang tot 4 mei 2026. Daarna staat je account op pauze en krijg je geen weermail meer.
                    </p>
                    <div style={{display:'flex', gap: 10, justifyContent:'flex-end'}}>
                      <button className="btn btn-ghost" onClick={() => setShowCancel(false)}>Toch niet</button>
                      <button className="btn btn-danger-ghost" onClick={() => { setShowCancel(false); setCancelled(true); }}>Ja, opzeggen</button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'billing' && (
            <>
              <h1 className="h-1" style={{marginBottom: 8}}>Facturen & betalingen</h1>
              <p className="t-body" style={{marginBottom: 28}}>Je betaalgeschiedenis en betaalmethode.</p>

              <div className="card card-pad" style={{marginBottom: 20}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 14}}>
                  <h3 className="h-3">Betaalmethode</h3>
                  <button className="btn btn-sm btn-ghost">Wijzigen</button>
                </div>
                <div style={{display:'flex', alignItems:'center', gap: 14, padding: 14, border:'1px solid var(--border)', borderRadius: 12}}>
                  <div style={{width: 44, height: 28, borderRadius: 6, background:'#1a1f36', color:'#fff',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize: 10, fontWeight: 800, letterSpacing:.4}}>
                    iDEAL
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight: 700, fontSize: 14}}>ING · eindigt op **7823</div>
                    <div className="t-small">Toegevoegd op 4 april 2026</div>
                  </div>
                </div>
              </div>

              <div className="card card-pad">
                <h3 className="h-3" style={{marginBottom: 14}}>Facturen</h3>
                {[
                  ['4 apr 2026', 'Weerzone Plus · mnd', '€3,99', 'betaald'],
                  ['4 mrt 2026', 'Weerzone Plus · mnd', '€3,99', 'betaald'],
                  ['4 feb 2026', 'Weerzone Plus · mnd', '€3,99', 'betaald'],
                ].map((row, i) => (
                  <div key={i} style={{display:'grid', gridTemplateColumns:'110px 1fr 90px 90px 80px', alignItems:'center',
                    padding:'14px 0', borderTop: i===0?'1px solid var(--border)':'1px solid var(--border)', fontSize: 14}}>
                    <div className="t-small">{row[0]}</div>
                    <div style={{fontWeight: 600}}>{row[1]}</div>
                    <div style={{fontWeight: 700, textAlign:'right'}}>{row[2]}</div>
                    <div style={{textAlign:'center'}}><span className="badge ok">{row[3]}</span></div>
                    <div style={{textAlign:'right'}}><a href="#" className="kbd-link" style={{fontSize: 13}}>PDF</a></div>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

const PLANS_RANK = {piet:0, reed:1};

function Toggle({ on, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!on)}
      style={{
        width: 44, height: 26, borderRadius: 999, border: 0, padding: 2,
        background: on ? 'var(--brand)' : 'var(--ink-300)',
        cursor: 'pointer', position: 'relative',
        transition: 'background .15s',
      }}>
      <span style={{
        display:'block', width: 22, height: 22, borderRadius:'50%', background:'#fff',
        transform: on ? 'translateX(18px)' : 'translateX(0)',
        transition: 'transform .15s',
        boxShadow: '0 2px 4px rgba(0,0,0,.2)',
      }}/>
    </button>
  );
}

Object.assign(window, { AccountScreen, PLANS_RANK, Toggle });
