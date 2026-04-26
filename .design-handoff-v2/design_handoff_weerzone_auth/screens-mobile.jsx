/* Weerzone Auth — mobile screens (wrapped in MobileFrame) */

const MobileHeader = ({ rightSlot }) => (
  <div className="row between" style={{ marginBottom: 20 }}>
    <Logo variant="mark" size={12} />
    {rightSlot}
  </div>
);

/* ---------- LOGIN (mobile) ---------- */
const LoginMobile = () => {
  const [method, setMethod] = React.useState("wachtwoord");
  return (
    <MobileFrame>
      <MobileHeader rightSlot={<span className="wz-meta">NL</span>} />

      {/* sky strip */}
      <div style={{ height: 120, borderRadius: 8, overflow: "hidden", marginBottom: 20, border: "1px solid var(--hair)" }}>
        <Sky theme="default" intensity="soft" location="De Bilt">
          <div style={{ flex: 1 }} />
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.08em", opacity: 0.8 }}>
            12° · HALF BEWOLKT · DE BILT
          </div>
        </Sky>
      </div>

      <div className="wz-kicker" style={{ marginBottom: 6 }}>Inloggen</div>
      <h1 className="wz-h1" style={{ fontSize: 24 }}>Welkom terug.</h1>
      <p className="wz-sub" style={{ marginTop: 4, marginBottom: 18 }}>48 uur vooruit. De rest is ruis.</p>

      <div className="wz-tabs" style={{ marginBottom: 14 }}>
        <button className={`wz-tab ${method === "wachtwoord" ? "is-active" : ""}`} onClick={() => setMethod("wachtwoord")}>Wachtwoord</button>
        <button className={`wz-tab ${method === "magic" ? "is-active" : ""}`} onClick={() => setMethod("magic")}>Magic link</button>
      </div>

      <div className="wz-field">
        <input className="wz-input" type="email" placeholder="E-mailadres" defaultValue="thijs@voorbeeld.nl" />
      </div>
      {method === "wachtwoord" && (
        <div className="wz-field">
          <div className="wz-input-wrap">
            <input className="wz-input" type="password" placeholder="Wachtwoord" defaultValue="gezondOnweer24" />
            <button type="button" className="wz-input-action">Toon</button>
          </div>
        </div>
      )}

      <button className="wz-btn wz-btn-primary wz-btn-block" style={{ marginTop: 4 }}>
        {method === "magic" ? "Stuur inloglink" : "Inloggen"} <ArrowIcon />
      </button>

      <button className="wz-btn wz-btn-secondary wz-btn-block" style={{ marginTop: 8 }}>
        <KeyIcon /> Passkey gebruiken
      </button>

      <div className="wz-divider"><span>of</span></div>

      <div className="wz-sso-grid">
        <button className="wz-sso"><GoogleIcon />Google</button>
        <button className="wz-sso"><AppleIcon />Apple</button>
      </div>

      <div style={{ flex: 1 }} />
      <div className="row between" style={{ fontSize: 13, color: "var(--ink-2)", paddingTop: 16 }}>
        <a href="#forgot" className="wz-link-plain">Vergeten?</a>
        <a href="#signup" className="wz-link">Aanmelden →</a>
      </div>
    </MobileFrame>
  );
};

/* ---------- SIGNUP (mobile) ---------- */
const SignupMobile = () => {
  const [tier, setTier] = React.useState("piet");
  return (
    <MobileFrame height={900}>
      <MobileHeader rightSlot={<span className="wz-meta">1/2</span>} />

      <div className="wz-kicker" style={{ marginBottom: 6 }}>Aanmelden</div>
      <h1 className="wz-h1" style={{ fontSize: 24 }}>Maak je account aan.</h1>
      <p className="wz-sub" style={{ marginTop: 4, marginBottom: 16 }}>Tijdelijk gratis. Geen creditcard.</p>

      <div className="wz-banner">
        <InfoIcon />
        <span>Introductieprijs blijft vastgezet na go-live.</span>
      </div>

      <label className="wz-label" style={{ marginBottom: 10 }}>Abonnement</label>
      <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
        {[
          { id: "piet", name: "Piet", role: "Basis · dagelijks", line: "Elke ochtend vóór 7:00 op jouw postcode.", price: "€4,99/mnd" },
          { id: "reed", name: "Reed", role: "Waarschuwing", line: "Alleen bericht als het weer over jouw drempel gaat.", price: "€7,99/mnd" },
        ].map(t => (
          <button key={t.id} type="button" className={`wz-tier ${tier === t.id ? "is-selected" : ""}`} onClick={() => setTier(t.id)} style={{ padding: 12 }}>
            <span className="wz-tier-radio" />
            <div className="wz-tier-top" style={{ marginBottom: 4 }}>
              <div><div className="wz-tier-name">{t.name}</div><span className="wz-tier-role">{t.role}</span></div>
            </div>
            <div className="wz-tier-line" style={{ marginBottom: 6 }}>{t.line}</div>
            <div className="wz-tier-price"><span style={{ fontWeight: 600 }}>Tijdelijk gratis</span><span style={{ color: "var(--ink-3)", marginLeft: 6 }}>· {t.price}</span></div>
          </button>
        ))}
      </div>

      <div className="wz-field">
        <input className="wz-input" type="email" placeholder="E-mailadres" />
      </div>
      <div className="wz-field">
        <input className="wz-input" type="password" placeholder="Wachtwoord (min. 10 tekens)" />
      </div>
      <div className="wz-field">
        <label className="wz-label">Thuislocatie</label>
        <LocationRow location="De Bilt" postcode="3731 GA" />
      </div>

      <button className="wz-btn wz-btn-primary wz-btn-block" style={{ marginTop: 8 }}>
        Volgende <ArrowIcon />
      </button>

      <div style={{ flex: 1 }} />
      <div className="row between" style={{ fontSize: 13, color: "var(--ink-2)", paddingTop: 14 }}>
        <span>Al een account?</span>
        <a href="#login" className="wz-link">Inloggen →</a>
      </div>
    </MobileFrame>
  );
};

/* ---------- FORGOT (mobile) ---------- */
const ForgotMobile = () => (
  <MobileFrame height={700}>
    <MobileHeader rightSlot={<a href="#login" className="wz-link-plain" style={{ fontSize: 13 }}>Terug</a>} />
    <div style={{ height: 80, borderRadius: 8, overflow: "hidden", marginBottom: 20, border: "1px solid var(--hair)" }}>
      <Sky theme="dusk" intensity="soft" location="De Bilt">
        <div style={{ flex: 1 }} />
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", opacity: 0.9 }}>
          19:14 · DUSK · CLEAR
        </div>
      </Sky>
    </div>

    <div className="wz-kicker" style={{ marginBottom: 6 }}>Wachtwoord vergeten</div>
    <h1 className="wz-h1" style={{ fontSize: 24 }}>Reset je wachtwoord.</h1>
    <p className="wz-sub" style={{ marginTop: 4, marginBottom: 16 }}>Vul je e-mailadres in. We sturen je een resetlink.</p>

    <div className="wz-field">
      <input className="wz-input" type="email" placeholder="jij@voorbeeld.nl" />
    </div>
    <button className="wz-btn wz-btn-primary wz-btn-block">Stuur resetlink <ArrowIcon /></button>

    <div className="wz-divider"><span>of</span></div>
    <button className="wz-btn wz-btn-secondary wz-btn-block"><KeyIcon /> Inloggen met passkey</button>

    <div style={{ flex: 1 }} />
    <div style={{ fontSize: 12, color: "var(--ink-3)", paddingTop: 14, textAlign: "center" }}>
      Geen toegang meer tot je mail? <a href="#" className="wz-link-plain" style={{ textDecoration: "underline" }}>Contact</a>
    </div>
  </MobileFrame>
);

/* ---------- LOGOUT (mobile) ---------- */
const LogoutMobile = () => (
  <MobileFrame height={700}>
    <MobileHeader />
    <div style={{ height: 100, borderRadius: 8, overflow: "hidden", marginBottom: 20, border: "1px solid var(--hair)" }}>
      <Sky theme="night" intensity="soft" location="De Bilt">
        <div style={{ flex: 1 }} />
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", opacity: 0.85 }}>
          23:04 · HELDER · 6°
        </div>
      </Sky>
    </div>

    <div className="wz-kicker" style={{ marginBottom: 6 }}>Uitloggen</div>
    <h1 className="wz-h1" style={{ fontSize: 24 }}>Tot morgenochtend.</h1>
    <p className="wz-sub" style={{ marginTop: 4, marginBottom: 18 }}>Je mail om 7:00 blijft komen. Uitloggen betekent alleen dat je hier opnieuw moet inloggen.</p>

    <div style={{ background: "var(--paper)", border: "1px solid var(--hair)", borderRadius: "var(--radius)", padding: 12, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--accent-soft)", color: "var(--accent-ink)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 13 }}>T</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Thijs de Vries</div>
          <div className="wz-meta">PIET · 3 APPARATEN</div>
        </div>
      </div>
    </div>

    <label className="wz-check" style={{ marginBottom: 16 }}>
      <input type="checkbox" />
      <span>Ook uitloggen op alle andere apparaten</span>
    </label>

    <button className="wz-btn wz-btn-primary wz-btn-block">Uitloggen <ArrowIcon /></button>
    <button className="wz-btn wz-btn-ghost wz-btn-block" style={{ marginTop: 8, height: 40 }}>Annuleren</button>

    <div style={{ flex: 1 }} />
  </MobileFrame>
);

Object.assign(window, { LoginMobile, SignupMobile, ForgotMobile, LogoutMobile });
