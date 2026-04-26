/* Weerzone Auth — screens */

const Tiers = ({ selected, onSelect }) => (
  <div className="wz-tiers">
    <button type="button" className={`wz-tier ${selected === "piet" ? "is-selected" : ""}`} onClick={() => onSelect("piet")}>
      <span className="wz-tier-radio" />
      <div className="wz-tier-top">
        <div>
          <div className="wz-tier-name">Piet</div>
          <span className="wz-tier-role">Basis · dagelijks</span>
        </div>
      </div>
      <div className="wz-tier-line" style={{ marginBottom: 8 }}>Elke ochtend vóór 7:00 een korte weermail op jouw postcode.</div>
      <div className="wz-tier-price">
        <span style={{ fontWeight: 600 }}>Tijdelijk gratis</span>
        <span style={{ color: "var(--ink-3)", marginLeft: 6 }}>· €4,99/mnd</span>
      </div>
    </button>
    <button type="button" className={`wz-tier ${selected === "reed" ? "is-selected" : ""}`} onClick={() => onSelect("reed")}>
      <span className="wz-tier-radio" />
      <div className="wz-tier-top">
        <div>
          <div className="wz-tier-name">Reed</div>
          <span className="wz-tier-role">Waarschuwing · drempel</span>
        </div>
      </div>
      <div className="wz-tier-line" style={{ marginBottom: 8 }}>Alleen bericht als het weer over jouw drempel gaat. Mail én push.</div>
      <div className="wz-tier-price">
        <span style={{ fontWeight: 600 }}>Tijdelijk gratis</span>
        <span style={{ color: "var(--ink-3)", marginLeft: 6 }}>· €7,99/mnd</span>
      </div>
    </button>
  </div>
);

/* ---------- LOGIN (desktop) ---------- */
const LoginDesktop = () => {
  const [method, setMethod] = React.useState("wachtwoord");
  const [showPw, setShowPw] = React.useState(false);
  return (
    <AuthShell width={880} height={600} skyTheme="default" skyIntensity="soft">
      <div style={{ padding: "28px 36px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div className="row between" style={{ marginBottom: 28 }}>
          <Logo variant="mark" size={14} />
          <span className="wz-meta">v2026.04 · NL</span>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div className="wz-kicker" style={{ marginBottom: 8 }}>Inloggen</div>
          <h1 className="wz-h1">Welkom terug.</h1>
          <p className="wz-sub" style={{ marginTop: 6 }}>48 uur vooruit. De rest is ruis.</p>
        </div>

        <div className="wz-tabs">
          <button className={`wz-tab ${method === "wachtwoord" ? "is-active" : ""}`} onClick={() => setMethod("wachtwoord")}>Wachtwoord</button>
          <button className={`wz-tab ${method === "magic" ? "is-active" : ""}`} onClick={() => setMethod("magic")}>Magic link</button>
          <button className={`wz-tab ${method === "passkey" ? "is-active" : ""}`} onClick={() => setMethod("passkey")}>Passkey</button>
        </div>

        <div className="wz-field">
          <label className="wz-label">E-mailadres</label>
          <input className="wz-input" type="email" placeholder="jij@voorbeeld.nl" defaultValue="thijs@voorbeeld.nl" />
        </div>

        {method === "wachtwoord" && (
          <div className="wz-field">
            <div className="row between" style={{ marginBottom: 6 }}>
              <label className="wz-label" style={{ marginBottom: 0 }}>Wachtwoord</label>
              <a href="#forgot" className="wz-link-plain" style={{ fontSize: 12 }}>Vergeten?</a>
            </div>
            <div className="wz-input-wrap">
              <input className="wz-input" type={showPw ? "text" : "password"} placeholder="••••••••" defaultValue="gezondOnweer24" />
              <button type="button" className="wz-input-action" onClick={() => setShowPw(v => !v)}>{showPw ? "Verberg" : "Toon"}</button>
            </div>
          </div>
        )}

        {method === "magic" && (
          <div className="wz-banner" style={{ marginTop: 4 }}>
            <InfoIcon />
            <span>Geen wachtwoord nodig. We sturen je een eenmalige inloglink per mail.</span>
          </div>
        )}

        {method === "passkey" && (
          <div className="wz-banner" style={{ marginTop: 4 }}>
            <KeyIcon />
            <span>Je browser of telefoon handelt de rest af. Geen wachtwoord om te onthouden.</span>
          </div>
        )}

        <button className="wz-btn wz-btn-primary wz-btn-block" style={{ marginTop: 4 }}>
          {method === "magic" ? "Stuur inloglink" : method === "passkey" ? "Gebruik passkey" : "Inloggen"} <ArrowIcon />
        </button>

        <div className="wz-divider"><span>of</span></div>

        <div className="wz-sso-grid">
          <button className="wz-sso"><GoogleIcon />Google</button>
          <button className="wz-sso"><AppleIcon />Apple</button>
        </div>

        <div style={{ flex: 1 }} />
        <div className="row between" style={{ fontSize: 13, color: "var(--ink-2)", paddingTop: 20 }}>
          <span>Nog geen account?</span>
          <a href="#signup" className="wz-link">Aanmelden →</a>
        </div>
      </div>
      <StatusStrip left="KNMI HARMONIE · 2,5 KM" right="TLS 1.3 · MOLLIE" />
    </AuthShell>
  );
};

/* ---------- SIGNUP (desktop) ---------- */
const SignupDesktop = () => {
  const [tier, setTier] = React.useState("piet");
  return (
    <AuthShell width={880} height={680} skyTheme="default" skyIntensity="medium"
      skyChildren={
        <>
          <div></div>
          <div>
            <div className="wz-sky-quote" style={{ fontSize: 22, maxWidth: 320 }}>
              Piet voor thuis.<br/>Reed voor waarschuwingen.
              <small>— Kies bij aanmelden. Wisselen kan maandelijks.</small>
            </div>
            <div className="wz-sky-readout" style={{ marginTop: 24 }}>
              <div className="wz-sky-readout-item"><span className="k">Op de lijst</span><span className="v">1.247</span></div>
              <div className="wz-sky-readout-item"><span className="k">Nauwkeurig</span><span className="v">2,5 km</span></div>
              <div className="wz-sky-readout-item"><span className="k">Vooruit</span><span className="v">48 u</span></div>
              <div className="wz-sky-readout-item"><span className="k">Reclame</span><span className="v">0</span></div>
            </div>
          </div>
        </>
      }
    >
      <div style={{ padding: "28px 36px", flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
        <div className="row between" style={{ marginBottom: 24 }}>
          <Logo variant="mark" size={14} />
          <span className="wz-meta">Stap 1 van 2</span>
        </div>
        <div style={{ marginBottom: 18 }}>
          <div className="wz-kicker" style={{ marginBottom: 8 }}>Aanmelden</div>
          <h1 className="wz-h1">Maak je account aan.</h1>
          <p className="wz-sub" style={{ marginTop: 6 }}>Tijdelijk gratis. Geen creditcard, geen reclame, opzeggen kan altijd.</p>
        </div>

        <div className="wz-banner">
          <InfoIcon />
          <span>Vroege aanmelders houden hun introductieprijs, ook zodra we live gaan.</span>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label className="wz-label" style={{ marginBottom: 10 }}>Abonnement</label>
          <Tiers selected={tier} onSelect={setTier} />
        </div>

        <div className="wz-field">
          <label className="wz-label">E-mailadres</label>
          <input className="wz-input" type="email" placeholder="jij@voorbeeld.nl" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div className="wz-field" style={{ marginBottom: 10 }}>
            <label className="wz-label">Wachtwoord</label>
            <input className="wz-input" type="password" placeholder="Min. 10 tekens" />
          </div>
          <div className="wz-field" style={{ marginBottom: 10 }}>
            <label className="wz-label">Thuislocatie</label>
            <LocationRow location="De Bilt" postcode="3731 GA" />
          </div>
        </div>

        <label className="wz-check" style={{ marginTop: 6, marginBottom: 16 }}>
          <input type="checkbox" defaultChecked />
          <span>Ik ga akkoord met <a href="#" className="wz-link">privacybeleid</a> en voorwaarden.</span>
        </label>

        <button className="wz-btn wz-btn-primary wz-btn-block">
          Account aanmaken <ArrowIcon />
        </button>

        <div className="wz-divider"><span>of meld je aan met</span></div>

        <div className="wz-sso-grid">
          <button className="wz-sso"><GoogleIcon />Google</button>
          <button className="wz-sso"><AppleIcon />Apple</button>
        </div>

        <div style={{ flex: 1 }} />
        <div className="row between" style={{ fontSize: 13, color: "var(--ink-2)", paddingTop: 16 }}>
          <span>Al een account?</span>
          <a href="#login" className="wz-link">Inloggen →</a>
        </div>
      </div>
      <StatusStrip left="TIJDELIJK GRATIS · GEEN CC" right="OPZEGGEN KAN ALTIJD" />
    </AuthShell>
  );
};

/* ---------- FORGOT (desktop) ---------- */
const ForgotDesktop = ({ sent = false }) => (
  <AuthShell width={880} height={520} skyTheme="dusk" skyIntensity="soft"
    skyChildren={
      <>
        <div className="wz-sky-top">
          <Logo size={15} />
          <span style={{ font: "400 11px var(--font-mono)", letterSpacing: "0.08em", opacity: 0.8 }}>DE BILT · 19:14 · KNMI</span>
        </div>
        <div>
          <div className="wz-sky-quote">
            Geen paniek.<br/>Een mail en je bent terug.
            <small>— Reset in één stap</small>
          </div>
        </div>
      </>
    }
  >
    <div style={{ padding: "28px 36px", flex: 1, display: "flex", flexDirection: "column" }}>
      <div className="row between" style={{ marginBottom: 32 }}>
        <Logo variant="mark" size={14} />
        <a href="#login" className="wz-link-plain" style={{ fontSize: 13 }}>← Terug naar inloggen</a>
      </div>

      {!sent ? (
        <>
          <div style={{ marginBottom: 24 }}>
            <div className="wz-kicker" style={{ marginBottom: 8 }}>Wachtwoord vergeten</div>
            <h1 className="wz-h1">Reset je wachtwoord.</h1>
            <p className="wz-sub" style={{ marginTop: 6 }}>Vul je e-mailadres in. We sturen je een link om een nieuw wachtwoord in te stellen.</p>
          </div>
          <div className="wz-field">
            <label className="wz-label">E-mailadres</label>
            <input className="wz-input" type="email" placeholder="jij@voorbeeld.nl" defaultValue="thijs@voorbeeld.nl" />
          </div>
          <button className="wz-btn wz-btn-primary wz-btn-block" style={{ marginTop: 8 }}>
            Stuur resetlink <ArrowIcon />
          </button>
          <div className="wz-divider"><span>of</span></div>
          <button className="wz-btn wz-btn-secondary wz-btn-block"><KeyIcon /> Inloggen met passkey</button>
        </>
      ) : (
        <>
          <div style={{
            width: 44, height: 44, borderRadius: "50%", background: "var(--accent-soft)",
            color: "var(--accent-ink)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16
          }}>
            <MailIcon />
          </div>
          <div className="wz-kicker" style={{ marginBottom: 8 }}>Mail verstuurd</div>
          <h1 className="wz-h1">Kijk in je inbox.</h1>
          <p className="wz-sub" style={{ marginTop: 8, maxWidth: 340 }}>
            We hebben een resetlink gestuurd naar <strong style={{ color: "var(--ink)" }}>thijs@voorbeeld.nl</strong>. De link werkt 30 minuten.
          </p>
          <div style={{ flex: 1 }} />
          <div className="row gap-3" style={{ fontSize: 13, color: "var(--ink-2)" }}>
            <span>Niets ontvangen?</span>
            <a href="#" className="wz-link">Stuur opnieuw</a>
            <span className="muted">·</span>
            <a href="#" className="wz-link-plain">Controleer spam</a>
          </div>
        </>
      )}
    </div>
    <StatusStrip left={sent ? "LINK ACTIEF · 30 MIN" : "GEEN ACCOUNT? AANMELDEN"} right="ENC. E2E" />
  </AuthShell>
);

/* ---------- LOGOUT (desktop) ---------- */
const LogoutDesktop = () => (
  <AuthShell width={880} height={480} skyTheme="night" skyIntensity="soft"
    skyChildren={
      <>
        <div className="wz-sky-top">
          <Logo size={15} />
          <span style={{ font: "400 11px var(--font-mono)", letterSpacing: "0.08em", opacity: 0.8 }}>DE BILT · 23:04 · HELDER</span>
        </div>
        <div>
          <div className="wz-sky-quote" style={{ fontSize: 24 }}>
            Tot morgenochtend.<br/>Piet staat klaar om 7:00.
            <small>— Sessie veilig afgesloten</small>
          </div>
          <div className="wz-sky-readout" style={{ marginTop: 24 }}>
            <div className="wz-sky-readout-item"><span className="k">Nacht</span><span className="v">6°</span></div>
            <div className="wz-sky-readout-item"><span className="k">Morgen</span><span className="v">16°</span></div>
            <div className="wz-sky-readout-item"><span className="k">Wind</span><span className="v">BFT 3</span></div>
            <div className="wz-sky-readout-item"><span className="k">Regen</span><span className="v">0 mm</span></div>
          </div>
        </div>
      </>
    }
  >
    <div style={{ padding: "32px 36px", flex: 1, display: "flex", flexDirection: "column" }}>
      <div className="row between" style={{ marginBottom: 28 }}>
        <Logo variant="mark" size={14} />
        <span className="wz-meta">Sessie · thijs@voorbeeld.nl</span>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div className="wz-kicker" style={{ marginBottom: 8 }}>Uitloggen</div>
        <h1 className="wz-h1">Weet je het zeker?</h1>
        <p className="wz-sub" style={{ marginTop: 8, maxWidth: 380 }}>
          Je mail om 7:00 blijft gewoon komen. Uitloggen betekent alleen dat je hier opnieuw moet inloggen.
        </p>
      </div>

      <div style={{ background: "var(--paper)", border: "1px solid var(--hair)", borderRadius: "var(--radius)", padding: 14, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent-soft)", color: "var(--accent-ink)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 13 }}>T</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Thijs de Vries</div>
            <div className="wz-meta">PIET · AANGEMELD SINDS 14 MRT 2026</div>
          </div>
          <div className="wz-meta">3 APPARATEN</div>
        </div>
      </div>

      <label className="wz-check" style={{ marginBottom: 20 }}>
        <input type="checkbox" />
        <span>Ook uitloggen op alle andere apparaten (3)</span>
      </label>

      <div className="row gap-2">
        <button className="wz-btn wz-btn-secondary" style={{ flex: 1 }}>Annuleren</button>
        <button className="wz-btn wz-btn-primary" style={{ flex: 1 }}>Uitloggen <ArrowIcon /></button>
      </div>

      <div style={{ flex: 1 }} />
      <div style={{ fontSize: 12, color: "var(--ink-3)", paddingTop: 16, borderTop: "1px solid var(--hair)", marginTop: 16 }}>
        Abonnement opzeggen? <a href="#" className="wz-link-plain" style={{ textDecoration: "underline" }}>Ga naar account</a>
      </div>
    </div>
    <StatusStrip left="SESSIE ACTIEF · AMSTERDAM" right="LAATST: 2 MIN GELEDEN" />
  </AuthShell>
);

Object.assign(window, { Tiers, LoginDesktop, SignupDesktop, ForgotDesktop, LogoutDesktop });
