/* Hartman WK Poule - account & toegang */
const { useState: useAuthState } = React;

function normalizePhone(value) {
  return value.replace(/[^\d+]/g, '').replace(/^00/, '+');
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isPhone(value) {
  return /^\+?\d{8,15}$/.test(normalizePhone(value));
}

function accessType(value) {
  if (isEmail(value)) return 'email';
  if (isPhone(value)) return 'phone';
  return null;
}

function cleanName(value) {
  return value.trim().replace(/\s+/g, ' ');
}

function isFullName(value) {
  return cleanName(value).split(' ').length >= 2;
}

function readProfilePhoto(file, onDone, onError) {
  if (!file || !file.type.startsWith('image/')) {
    onError('Kies een foto als afbeelding.');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const max = 360;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      onDone(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => onError('Deze foto kon niet worden gelezen.');
    img.src = reader.result;
  };
  reader.onerror = () => onError('Deze foto kon niet worden gelezen.');
  reader.readAsDataURL(file);
}

function friendlyDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
  } catch {
    return 'juni 2026';
  }
}

function Field({ label, type, value, onChange, placeholder, autoComplete, error }) {
  return (
    <label className={'field' + (error ? ' field-error' : '')}>
      <span className="field-label">{label}</span>
      <input className="field-input" type={type || 'text'} value={value} placeholder={placeholder}
        autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)} />
      {error && <span className="field-msg">{error}</span>}
    </label>
  );
}

function LoginScreen({ onLogin }) {
  const [contact, setContact] = useAuthState('');
  const [name, setName] = useAuthState('');
  const [photo, setPhoto] = useAuthState('');
  const [nameError, setNameError] = useAuthState('');
  const [contactError, setContactError] = useAuthState('');
  const [photoError, setPhotoError] = useAuthState('');
  const [submitting, setSubmitting] = useAuthState(false);
  // Eerst alleen e-mail/telefoonnummer vragen: wie al meedoet is daarmee direct
  // binnen (zelfde account, ook op een ander toestel of in een andere browser).
  // Pas als het contact onbekend is, verschijnen naam + foto voor een nieuw lid.
  const [isNew, setIsNew] = useAuthState(false);
  const hasInvite = new URLSearchParams(window.location.search).has('uitnodiging');

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const raw = contact.trim();
    const type = accessType(raw);
    if (!type) {
      setContactError('Gebruik een geldig e-mailadres of telefoonnummer.');
      return;
    }
    const normalized = type === 'phone' ? normalizePhone(raw) : raw;

    if (!isNew) {
      // Stap 1: bestaand account? Dan meteen door, zonder nieuw account.
      setSubmitting(true);
      try {
        const res = await fetch('/api/hartmanwk/login', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ contact: normalized }),
        });
        if (res.ok) {
          const data = await res.json();
          const m = data.member || {};
          await onLogin({
            memberId: m.id || null,
            name: m.name || '',
            contact: m.contact || normalized,
            contactType: m.contactType || type,
            photo: m.photo || '',
            joinedAt: m.joinedAt || new Date().toISOString(),
            members: Array.isArray(data.members) ? data.members : null,
          });
          return;
        }
        if (res.status === 404) {
          setIsNew(true);
          setSubmitting(false);
          return;
        }
        const data = await res.json().catch(() => ({}));
        setContactError(data.error || 'Inloggen lukte even niet. Probeer het opnieuw.');
      } catch {
        setContactError('Geen verbinding. Probeer het opnieuw.');
      }
      setSubmitting(false);
      return;
    }

    // Stap 2: nieuw lid — naam en foto erbij.
    const fullName = cleanName(name);
    if (!isFullName(fullName)) {
      setNameError('Vul je echte voor- en achternaam in.');
      return;
    }
    if (!photo) {
      setPhotoError('Voeg een herkenbare profielfoto toe.');
      return;
    }
    setSubmitting(true);
    try {
      await onLogin({
        name: fullName,
        contact: normalized,
        contactType: type,
        photo,
        joinedAt: new Date().toISOString(),
      });
    } catch (err) {
      setContactError((err && err.message) || 'Aanmelden mislukt. Probeer het opnieuw.');
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-stage">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-visual" aria-hidden="true">
          <img src="/hartmanwk2026-prototype/uploads/fifa-world-cup-2026-logo-white.png" alt="" />
        </div>
        <div className="auth-brand">
          <div className="auth-kicker">Besloten familiepoule</div>
          <div className="auth-title">HARTMAN<span>WK 2026 POULE</span></div>
          <div className="auth-flagbar" />
        </div>
        <p className="auth-intro">
          {isNew
            ? 'Dit e-mailadres of telefoonnummer kennen we nog niet. Vul je echte naam in en kies een foto, dan zit je direct in de poule.'
            : hasInvite
              ? 'Je bent uitgenodigd voor de Hartman WK Poule. Vul je e-mail of telefoonnummer in — doe je al mee, dan ben je direct binnen.'
              : 'Vul je e-mail of telefoonnummer in. Doe je al mee, dan ben je direct binnen — nieuw? Dan vragen we daarna je naam en een foto.'}
        </p>
        <div className="auth-mini">
          <span>WK 2026</span>
          <span><Flag code="USA" w={22} /><Flag code="CAN" w={22} /><Flag code="MEX" w={22} /></span>
        </div>

        <div className="auth-form">
          <Field label="E-mail of telefoonnummer" type="text" value={contact}
            onChange={(v) => { setContact(v); setContactError(''); }}
            placeholder="e-mail of telefoonnummer"
            autoComplete="email"
            error={contactError} />
          {isNew && (
            <React.Fragment>
              <label className={'photo-field' + (photoError ? ' field-error' : '')}>
                <span className="field-label">Profielfoto</span>
                <span className="photo-picker">
                  <span className="photo-preview">{photo ? <img src={photo} alt="" /> : 'Foto'}</span>
                  <span className="photo-copy">
                    <strong>Voeg een herkenbare foto toe</strong>
                    <em>Dan ziet iedereen meteen wie er bovenaan staat.</em>
                  </span>
                </span>
                <input type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files && e.target.files[0];
                  readProfilePhoto(file, (next) => { setPhoto(next); setPhotoError(''); }, setPhotoError);
                }} />
                {photoError && <span className="field-msg">{photoError}</span>}
              </label>
              <Field label="Voor- en achternaam" value={name} onChange={(v) => { setName(v); setNameError(''); }}
                placeholder="Bijv. Jan Hartman" autoComplete="name" error={nameError} />
            </React.Fragment>
          )}
        </div>

        <button className="auth-submit" type="submit" disabled={submitting}>{submitting ? 'Bezig…' : isNew ? 'Meedoen aan de poule' : 'Naar de poule'}</button>
        <div className="auth-note">Geen wachtwoord nodig. Uitloggen kan via Account.</div>
      </form>
    </div>
  );
}

function AccountScreen({ account, onLogout, onBack, onUpdateAccount }) {
  const me = window.WK.people.find((p) => p.me);
  const myRank = window.WK.people.indexOf(me) + 1;
  const [meld, setMeld] = useAuthState(true);
  const [herinner, setHerinner] = useAuthState(true);
  const [shareStatus, setShareStatus] = useAuthState('');
  const contactType = account?.contactType === 'phone' ? 'Telefoon' : 'E-mail';
  const contact = account?.contact || '';
  const name = account?.name || 'Jij';
  const photo = account?.photo || '';
  const inviteLink = `${window.location.origin}/hartmanwk2026?uitnodiging=hartman`;

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setShareStatus('Uitnodigingslink gekopieerd');
    } catch {
      setShareStatus('Kopiëren lukte niet. Selecteer de link en deel hem handmatig.');
    }
  };

  return (
    <div className="screen">
      <button className="back-link" onClick={onBack}>Terug naar de poule</button>

      <div className="acc-head card">
        <div className="acc-photo">
          <Avatar name={name} me size={62} photo={photo} />
          <label className="acc-photo-edit">
            Foto wijzigen
            <input type="file" accept="image/*" onChange={(e) => {
              const file = e.target.files && e.target.files[0];
              readProfilePhoto(file, (next) => onUpdateAccount({ photo: next }), () => {});
            }} />
          </label>
        </div>
        <div className="acc-id">
          <div className="acc-name">{name}</div>
          <div className="acc-mail">{contact}</div>
          <div className="acc-since">Lid sinds {friendlyDate(account?.joinedAt)}</div>
        </div>
        <div className="acc-rankbox">
          <div className="acc-rank">{myRank}<span>e</span></div>
          <div className="acc-rank-l">{me.pts} punten</div>
        </div>
      </div>

      <div className="acc-section">Toegang</div>
      <div className="card acc-poule">
        <div className="acc-poule-row">
          <span>Methode</span><strong>{contactType}</strong>
        </div>
        <div className="acc-poule-row">
          <span>Account</span><strong>{contact}</strong>
        </div>
        <div className="acc-poule-row">
          <span>Status</span><strong className="acc-code">Actief</strong>
        </div>
      </div>

      <div className="acc-section">Poule</div>
      <div className="card acc-poule">
        <div className="acc-poule-row">
          <span>Naam</span><strong>Hartman WK Poule</strong>
        </div>
        <div className="acc-poule-row">
          <span>Deelnemers</span><strong>{window.WK.people.length}</strong>
        </div>
        <div className="invite-box">
          <div>
            <div className="invite-label">Jouw uitnodigingslink</div>
            <div className="invite-help">Deel deze link met familie. Ze komen op dezelfde site binnen.</div>
          </div>
          <input className="invite-input" value={inviteLink} readOnly onFocus={(e) => e.target.select()} />
          <button className="acc-share" type="button" onClick={copyInvite}>Link kopiëren</button>
          {shareStatus && <div className="acc-share-note">{shareStatus}</div>}
        </div>
      </div>

      <div className="acc-section">Instellingen</div>
      <div className="card acc-settings">
        <AccToggle label="Meldingen voor wedstrijden" sub="Een seintje vlak voor de aftrap" on={meld} set={setMeld} />
        <AccToggle label="Herinnering openstaande voorspellingen" sub="Zodat je nooit een wedstrijd mist" on={herinner} set={setHerinner} />
      </div>

      <button className="acc-logout" onClick={onLogout}>Uitloggen</button>
    </div>
  );
}

function AccToggle({ label, sub, on, set }) {
  return (
    <div className="acc-toggle">
      <div className="acc-toggle-txt">
        <div className="acc-toggle-l">{label}</div>
        <div className="acc-toggle-s">{sub}</div>
      </div>
      <button className={'switch' + (on ? ' switch-on' : '')} onClick={() => set(!on)} aria-pressed={on}>
        <span className="switch-knob" />
      </button>
    </div>
  );
}

Object.assign(window, { LoginScreen, AccountScreen });
