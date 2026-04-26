// Screen: Sign up
function SignUpScreen({ nav }) {
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [name, setName] = React.useState('');
  const [agree, setAgree] = React.useState(false);
  const [errors, setErrors] = React.useState({});

  const submit = () => {
    const e = {};
    if (!name.trim()) e.name = 'Vul je naam in';
    if (!email.trim() || !/.+@.+\..+/.test(email)) e.email = 'Vul een geldig e-mailadres in';
    if (!pw || pw.length < 8) e.pw = 'Minimaal 8 tekens';
    if (!agree) e.agree = 'Je moet akkoord gaan met de voorwaarden';
    setErrors(e);
    if (Object.keys(e).length === 0) nav('onboarding');
  };

  return (
    <AuthShell
      title={"48 uur vooruit.\nDe rest is ruis."}
      subtitle="Maak een gratis account en ontvang elke ochtend je persoonlijke weerbericht — per GPS, op jouw locatie."
      quote={{ text: "Sinds Weerzone weet ik precies wanneer ik mijn terras moet opruimen. Gewoon fijn.", author: "Marieke, Utrecht" }}
    >
      <h1 className="h-1" style={{marginBottom: 8}}>Maak een account</h1>
      <p className="t-body" style={{marginBottom: 24}}>
        Gratis proberen — geen creditcard nodig.
      </p>

      <SocialButtons onPick={() => nav('onboarding')} />
      <Divider />

      <TextField label="Naam" value={name} onChange={setName} placeholder="Jouw naam" error={errors.name} autoFocus />
      <TextField label="E-mailadres" type="email" value={email} onChange={setEmail} placeholder="je@voorbeeld.nl" error={errors.email} autoComplete="email"/>
      <PasswordField label="Wachtwoord" value={pw} onChange={setPw} placeholder="Minimaal 8 tekens" error={errors.pw} showStrength autoComplete="new-password"/>

      <div style={{marginTop: 6, marginBottom: 18}}>
        <Checkbox checked={agree} onChange={setAgree}>
          Ik ga akkoord met de <a href="#">voorwaarden</a> en het <a href="#">privacybeleid</a>.
        </Checkbox>
        {errors.agree && <div className="err" style={{marginTop: 6}}>{errors.agree}</div>}
      </div>

      <button className="btn btn-primary btn-block btn-lg" onClick={submit}>
        Account aanmaken
      </button>

      <p className="t-small" style={{textAlign:'center', marginTop: 20}}>
        Heb je al een account? <a className="kbd-link" href="#" onClick={e => {e.preventDefault(); nav('login');}}>Inloggen</a>
      </p>
    </AuthShell>
  );
}

// Screen: Login
function LoginScreen({ nav }) {
  const [email, setEmail] = React.useState('piet@weerzone.nl');
  const [pw, setPw] = React.useState('');
  const [remember, setRemember] = React.useState(true);
  const [errors, setErrors] = React.useState({});

  const submit = () => {
    const e = {};
    if (!email.trim()) e.email = 'Vul je e-mailadres in';
    if (!pw) e.pw = 'Vul je wachtwoord in';
    setErrors(e);
    if (Object.keys(e).length === 0) nav('account');
  };

  return (
    <AuthShell
      title="Welkom terug."
      subtitle="Log in om je persoonlijke weerbericht, voorkeuren en abonnement te beheren."
    >
      <h1 className="h-1" style={{marginBottom: 8}}>Inloggen</h1>
      <p className="t-body" style={{marginBottom: 24}}>
        Welkom terug bij Weerzone.
      </p>

      <SocialButtons onPick={() => nav('account')} />
      <Divider />

      <TextField label="E-mailadres" type="email" value={email} onChange={setEmail} placeholder="je@voorbeeld.nl" error={errors.email} autoFocus autoComplete="email"/>

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom: 6}}>
        <label style={{fontSize: 13, fontWeight: 700}}>Wachtwoord</label>
        <a href="#" className="kbd-link" style={{fontSize: 13}} onClick={e => {e.preventDefault(); nav('reset');}}>Vergeten?</a>
      </div>
      <PasswordField value={pw} onChange={setPw} placeholder="Je wachtwoord" error={errors.pw} autoComplete="current-password"/>

      <div style={{marginTop: 6, marginBottom: 18}}>
        <Checkbox checked={remember} onChange={setRemember}>
          Onthoud mij op dit apparaat
        </Checkbox>
      </div>

      <button className="btn btn-primary btn-block btn-lg" onClick={submit}>
        Inloggen
      </button>

      <p className="t-small" style={{textAlign:'center', marginTop: 20}}>
        Nog geen account? <a className="kbd-link" href="#" onClick={e => {e.preventDefault(); nav('signup');}}>Maak er gratis één</a>
      </p>
    </AuthShell>
  );
}

// Screen: Wachtwoord reset
function ResetScreen({ nav }) {
  const [email, setEmail] = React.useState('');
  const [sent, setSent] = React.useState(false);

  return (
    <AuthShell
      title="Geen zorgen, dat lossen we zo op."
      subtitle="Vul je e-mailadres in en we sturen je binnen een minuut een link om een nieuw wachtwoord in te stellen."
    >
      {!sent ? (
        <>
          <h1 className="h-1" style={{marginBottom: 8}}>Wachtwoord vergeten</h1>
          <p className="t-body" style={{marginBottom: 24}}>
            Vul je e-mailadres in. We sturen je een link om je wachtwoord opnieuw in te stellen.
          </p>

          <TextField label="E-mailadres" type="email" value={email} onChange={setEmail} placeholder="je@voorbeeld.nl" autoFocus />

          <button className="btn btn-primary btn-block btn-lg" onClick={() => email && setSent(true)}>
            Stuur reset link
          </button>

          <p className="t-small" style={{textAlign:'center', marginTop: 20}}>
            <a className="kbd-link" href="#" onClick={e => {e.preventDefault(); nav('login');}}>← Terug naar inloggen</a>
          </p>
        </>
      ) : (
        <div style={{textAlign:'center', padding: '20px 0'}}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--success-bg)', color: 'var(--success)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20,
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M4 6l6 6 10-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h1 className="h-1" style={{marginBottom: 8}}>Check je inbox</h1>
          <p className="t-body" style={{marginBottom: 24}}>
            We hebben een link gestuurd naar <strong style={{color:'var(--text)'}}>{email}</strong>. Klik erop om je wachtwoord opnieuw in te stellen.
          </p>
          <button className="btn btn-ghost btn-block" onClick={() => nav('login')}>
            Terug naar inloggen
          </button>
          <p className="t-small" style={{marginTop: 20}}>
            Geen e-mail ontvangen? <a className="kbd-link" href="#" onClick={e => {e.preventDefault(); setSent(false);}}>Opnieuw proberen</a>
          </p>
        </div>
      )}
    </AuthShell>
  );
}

Object.assign(window, { SignUpScreen, LoginScreen, ResetScreen });
