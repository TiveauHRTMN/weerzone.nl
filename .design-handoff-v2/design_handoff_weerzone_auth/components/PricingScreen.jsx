// Real Weerzone plans — Piet / Reed (Steve is B2B, in development)
const PLANS = [
  {
    id: 'piet',
    name: 'Piet',
    tag: 'Basis',
    tagline: 'Elke ochtend een weermail, op jouw postcode.',
    priceNow: 'Tijdelijk gratis',
    priceLater: '€4,99/mnd',
    blurb: "Piet stuurt je elke ochtend voor 7:00 een korte mail: wat het weer vandaag en morgen doet op jouw adres.",
    features: [
      'Elke ochtend vóór 7:00 in je mail',
      'Op jouw GPS-locatie, 48 uur vooruit',
      'Jij kiest wat Piet meeneemt: fiets, tuin, kinderen, hond',
      'Dashboard met uur-voor-uur verloop',
      'Geen reclame, geen tracking, geen cookiemuren',
    ],
    audience: "Voor wie 's ochtends in één minuut wil weten hoe de dag eruitziet.",
    cta: 'Aanmelden',
    highlight: false,
  },
  {
    id: 'reed',
    name: 'Reed',
    tag: 'Waarschuwing',
    tagline: 'Waarschuwing als het over jouw grens gaat.',
    priceNow: 'Tijdelijk gratis',
    priceLater: '€7,99/mnd',
    blurb: 'Reed stuurt alleen een bericht als het weer door jouw drempel heen gaat. Bij al het andere laat hij je met rust.',
    features: [
      'Alles wat Piet ook stuurt',
      'Waarschuwing op jouw drempel (wind, regen, vorst, onweer)',
      'Jij vult in wat kwetsbaar is: kelder, plat dak, dieren buiten',
      'Mail én push — jij kiest per categorie',
      'Achteraf: klopte de waarschuwing? Per alert te zien',
    ],
    audience: 'Voor gezinnen en huiseigenaren die niet over elk buitje gebeld willen worden.',
    cta: 'Aanmelden',
    highlight: true,
    badge: 'Meest gekozen',
  },
];

function PricingScreen({ nav }) {
  return (
    <div style={{minHeight:'100%', background:'var(--bg)'}}>
      <WzNavbar nav={nav} active="prijzen" />

      <div style={{padding:'clamp(40px, 6vw, 80px) clamp(20px, 4vw, 48px) 48px', maxWidth: 1200, margin:'0 auto'}}>
        {/* Hero */}
        <div style={{textAlign:'center', marginBottom: 'clamp(32px, 4vw, 56px)'}}>
          <span className="badge sun" style={{marginBottom: 16}}>★ Nu nog gratis aanmelden</span>
          <h1 className="h-display" style={{marginTop: 14, marginBottom: 14, fontSize:'clamp(32px, 5vw, 52px)'}}>
            Een abonnement op Weerzone
          </h1>
          <p className="t-body" style={{maxWidth: 640, margin:'0 auto', fontSize:'clamp(15px, 1.6vw, 17px)'}}>
            Piet voor thuis, Reed voor waarschuwingen. Elke ochtend een korte weermail op jouw postcode. Geen reclame. Opzeggen kan maandelijks.
          </p>
          <p className="t-small" style={{maxWidth: 560, margin:'16px auto 0'}}>
            Tijdelijk gratis. Geen creditcard, geen reclame — opzeggen kan maandelijks zodra we live gaan.
          </p>
          <div style={{display:'inline-flex', alignItems:'center', gap: 10, marginTop: 20, padding:'8px 16px',
            background:'#fff', border:'1px solid var(--border)', borderRadius: 999}}>
            <span style={{fontWeight: 800, fontSize: 15}}>1.247</span>
            <span style={{fontSize: 13, color:'var(--text-mute)'}}>Nederlanders staan al op de lijst</span>
          </div>
        </div>

        {/* Plans */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(290px, 1fr))', gap: 20, alignItems:'stretch'}}>
          {PLANS.map(p => (
            <div key={p.id} className="card"
              style={{
                padding: 'clamp(20px, 2.5vw, 28px)',
                display:'flex', flexDirection:'column',
                borderColor: p.highlight ? 'var(--brand)' : 'var(--border)',
                boxShadow: p.highlight ? '0 20px 50px rgba(59,127,240,.18), 0 0 0 2px var(--brand)' : 'var(--shadow-sm)',
                position:'relative',
              }}>
              {p.badge && (
                <div style={{position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)'}}>
                  <span className="badge" style={{background:'var(--wz-sun)', color:'#6b4a00', boxShadow:'0 4px 10px rgba(255,210,26,.35)'}}>★ {p.badge}</span>
                </div>
              )}
              <div style={{display:'flex', alignItems:'baseline', gap: 10, marginBottom: 6}}>
                <span style={{fontSize: 24, fontWeight: 800, letterSpacing:'-.01em'}}>{p.name}</span>
                <span className="t-micro">· {p.tag}</span>
              </div>
              <h3 className="h-3" style={{marginBottom: 12, minHeight: 52, fontSize: 17}}>{p.tagline}</h3>
              <p className="t-body" style={{marginBottom: 18, fontSize: 14}}>{p.blurb}</p>

              <div style={{padding:'14px 16px', background:'var(--ink-050)', borderRadius: 12, marginBottom: 18}}>
                <span className="badge sun" style={{fontSize: 10, display:'inline-block', marginBottom: 8}}>Nu aanmelden</span>
                <div style={{fontSize: 20, fontWeight: 800, letterSpacing:'-.01em', lineHeight: 1.1, marginBottom: 4}}>Tijdelijk gratis</div>
                <div style={{fontSize: 13, color:'var(--text-mute)'}}>Straks {p.priceLater} — geen creditcard nodig</div>
              </div>

              <button
                className={`btn btn-block btn-lg ${p.highlight ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => nav('checkout:' + p.id)}
              >{p.cta} →</button>

              <ul style={{listStyle:'none', padding: 0, margin: '20px 0 0'}}>
                {p.features.map((f, i) => (
                  <li key={i} style={{display:'flex', gap: 10, alignItems:'flex-start', marginBottom: 10, fontSize: 14, color:'var(--text-soft)'}}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{flex:'0 0 auto', marginTop: 1}}>
                      <circle cx="9" cy="9" r="9" fill={p.highlight ? 'var(--brand-soft)' : 'var(--ink-100)'}/>
                      <path d="M5 9.5l2.5 2.5L13 6.5" stroke={p.highlight ? 'var(--brand)' : 'var(--text-soft)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <div style={{marginTop: 'auto', paddingTop: 16, fontSize: 13, color:'var(--text-mute)', fontStyle:'italic'}}>
                {p.audience}
              </div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div style={{marginTop: 'clamp(48px, 6vw, 80px)'}}>
          <h2 className="h-1" style={{textAlign:'center', marginBottom: 32, fontSize:'clamp(26px, 3vw, 34px)'}}>Zo werkt het</h2>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap: 20}}>
            {[
              ['1', 'Kies een abonnement', 'Piet of Reed. Geen creditcard nodig. Opzeggen kan altijd.'],
              ['2', 'Vul je profiel in', 'Thuislocatie via GPS en een paar vragen (hond, fiets, kelder). Alleen wat je kwijt wilt.'],
              ['3', 'Morgen om 7:00', 'Je eerste mail in je inbox. Het dashboard staat altijd klaar.'],
            ].map(([n, t, d]) => (
              <div key={n} style={{padding: 24, background:'#fff', borderRadius: 18, border:'1px solid var(--border)'}}>
                <div style={{width: 36, height: 36, borderRadius:'50%', background:'var(--wz-blue)', color:'#fff',
                  display:'inline-flex', alignItems:'center', justifyContent:'center', fontWeight: 800, marginBottom: 14}}>{n}</div>
                <div className="h-3" style={{marginBottom: 6}}>{t}</div>
                <p className="t-small">{d}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{marginTop: 'clamp(48px, 6vw, 80px)'}}>
          <h2 className="h-1" style={{textAlign:'center', marginBottom: 32, fontSize:'clamp(26px, 3vw, 34px)'}}>Veelgestelde vragen</h2>
          <div style={{maxWidth: 760, margin:'0 auto'}}>
            <FAQ items={[
              ['Waarom is het nu gratis?', 'We zijn nog in opbouw. Je kunt je nu aanmelden zonder te betalen en zonder creditcard. Vroege aanmelders houden een gunstige prijs zodra we binnenkort live gaan.'],
              ['Wat is het verschil tussen Piet en Reed?', 'Piet schrijft een dagelijkse weermail voor thuis. Reed stuurt daarnaast alleen bericht als het weer over jouw drempel gaat (wind, regen, vorst).'],
              ['Is er ook een zakelijk abonnement?', 'Steve (voor bedrijven) is in ontwikkeling en komt apart beschikbaar. Voor zakelijk gebruik: neem contact op via zakelijk@weerzone.nl.'],
              ['Kan ik wisselen van abonnement?', 'Ja. Je kunt maandelijks upgraden of downgraden via je account. Als je nu bij de eerste aanmeldingen zit, behoud je de lage aanmeldprijs van je nieuwe abonnement.'],
              ['Waarom maar 48 uur vooruit?', 'Omdat een voorspelling verder dan 48 uur onbetrouwbaar wordt. Binnen 48 uur kunnen we je per GPS-locatie een scherpe voorspelling geven — daarna zegt niemand het zeker, ook wij niet.'],
              ['Hoe gaat de betaling straks?', 'Via Mollie: iDEAL, creditcard of Bancontact. Per maand of per jaar (jaar: twee maanden korting). Opzeggen kan op elk moment vanuit je account.'],
              ['Wat is het verschil met Buienradar of Weerplaza?', 'Weerzone is reclamevrij en is afgestemd op jouw situatie: je postcode en de voorkeuren die je bij aanmelden hebt doorgegeven.'],
            ]}/>
          </div>
        </div>
      </div>

      <WzFooter />
    </div>
  );
}

function FAQ({ items }) {
  const [open, setOpen] = React.useState(0);
  return (
    <div style={{display:'grid', gap: 8}}>
      {items.map(([q, a], i) => (
        <div key={i} className="card" style={{overflow:'hidden'}}>
          <button onClick={() => setOpen(open === i ? -1 : i)}
            style={{
              width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', gap: 12,
              padding: '18px 20px', background:'transparent', border: 0, cursor:'pointer', textAlign:'left',
              font: 'inherit',
            }}>
            <span style={{fontWeight: 700, fontSize: 15}}>{q}</span>
            <span style={{width: 24, height: 24, borderRadius:'50%', background:'var(--ink-100)',
              display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize: 14, fontWeight: 800,
              transform: open === i ? 'rotate(45deg)' : 'rotate(0)', transition:'transform .2s'}}>+</span>
          </button>
          {open === i && (
            <div style={{padding:'0 20px 18px', color:'var(--text-soft)', fontSize: 14, lineHeight: 1.6}}>{a}</div>
          )}
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { PricingScreen, PLANS, FAQ });
