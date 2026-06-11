/* Hartman WK Poule — app */
const { useState: useS } = React;
const AUTH_KEY = 'hartmanwk2026.session';

/* Gedeelde deelnemerslijst (de enige plek waar aanmeldingen van alle toestellen
   samenkomen). Zonder deze server-laag kan niemand elkaars deelnemers zien. */
const JOIN_URL = '/api/hartmanwk/join';
const MEMBERS_URL = '/api/hartmanwk/members';
const STANDINGS_URL = '/api/hartmanwk/standings';
const PREDICTIONS_URL = '/api/hartmanwk/predictions';
const PICK_URL = '/api/hartmanwk/pick';
const PLAYERS_URL = '/api/hartmanwk/players';
const MEMBERS_POLL_MS = 15000;

/* Verplicht-slot: alle groepsvoorspellingen + sterspeler vast bij de eerste
   aftrap, 2026-06-11 21:00 CEST (19:00 UTC). Daarna kan er niets meer wijzigen. */
const WK_LOCK_MS = Date.parse('2026-06-11T19:00:00Z');
const GROUP_MATCH_COUNT = 72;
const MATCH_COUNT = 104; // 72 groepswedstrijden + 32 knock-out
function wkLocked() { return Date.now() >= WK_LOCK_MS; }
function isGroupId(id) { const n = Number(id); return Number.isInteger(n) && n >= 1 && n <= GROUP_MATCH_COUNT; }
function isMatchId(id) { const n = Number(id); return Number.isInteger(n) && n >= 1 && n <= MATCH_COUNT; }

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#3B8EEA",
  "sfeer": "rustig",
  "toonWeer": true,
  "font": "'Inter'"
}/*EDITMODE-END*/;

function nextOpen() {
  const open = window.WK.matches.filter((m) => m.status === 'open');
  return open.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function matchesOn(date) {
  return window.WK.matches
    .filter((m) => m.date === date)
    .sort((a, b) => a.time.localeCompare(b.time));
}

function firstUpcomingDate(fromDate) {
  return [...new Set(window.WK.matches
    .filter((m) => m.date >= fromDate)
    .map((m) => m.date))]
    .sort()[0];
}

function DayMatchesCard() {
  const T = window.WK.T;
  const today = todayIso();
  const todaysMatches = matchesOn(today);
  const nextDate = firstUpcomingDate(today);
  const shownDate = todaysMatches.length ? today : nextDate;
  const shownMatches = shownDate ? matchesOn(shownDate) : [];
  const isToday = shownDate === today;

  return (
    <div className="hero-wrap">
      <div className="day-card">
        <div className="day-head">
          <div>
            <div className="hero-eyebrow"><span className="hb-dot" /> {isToday ? 'Wedstrijden vandaag' : 'Vandaag geen wedstrijden'}</div>
            <div className="day-title">{isToday ? fmtDate(today) : shownDate ? `Eerstvolgende speeldag · ${fmtDate(shownDate)}` : 'Programma volgt'}</div>
          </div>
          <div className="day-count">{shownMatches.length}<span>{shownMatches.length === 1 ? 'wedstrijd' : 'wedstrijden'}</span></div>
        </div>
        <div className="day-list">
          {shownMatches.map((m) => (
            <div key={m.id} className="day-row">
              <span className="day-time">{m.time}</span>
              <span className="day-team day-home"><Flag code={m.h} w={25} /><TeamName code={m.h} /></span>
              <span className="day-vs">–</span>
              <span className="day-team"><Flag code={m.a} w={25} /><TeamName code={m.a} /></span>
              <span className="day-place">{m.city}</span>
            </div>
          ))}
          {!shownMatches.length && <div className="day-empty">Zodra het programma bekend is, verschijnen de wedstrijden hier.</div>}
        </div>
      </div>
    </div>
  );
}

function loadSession() {
  try {
    const raw = window.localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/* Cookie-vangnet naast localStorage: Android gooit localStorage soms weg,
   en dan zou je opnieuw moeten "aanmelden". De cookie (1 jaar) bewaart alleen
   memberId + contact; het volledige profiel halen we dan op via /login. */
const SESSION_COOKIE = 'hartmanwk2026_session';

function readSessionCookie() {
  try {
    const hit = document.cookie.split('; ').find((c) => c.indexOf(SESSION_COOKIE + '=') === 0);
    return hit ? JSON.parse(decodeURIComponent(hit.slice(SESSION_COOKIE.length + 1))) : null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  try {
    if (session && session.contact) {
      const value = encodeURIComponent(JSON.stringify({ memberId: session.memberId || null, contact: session.contact }));
      document.cookie = `${SESSION_COOKIE}=${value}; max-age=31536000; path=/; SameSite=Lax`;
    }
  } catch { /* cookies uit: localStorage blijft werken */ }
}

function clearSession() {
  window.localStorage.removeItem(AUTH_KEY);
  try {
    document.cookie = `${SESSION_COOKIE}=; max-age=0; path=/`;
  } catch { /* ignore */ }
}

/* Schone, echte toernooistart: geen demo-uitslagen of nepvoorspellingen. */
function resetTournamentState() {
  window.WK.myTotal = 0;
  window.WK.myExact = 0;
  window.WK.myToto = 0;
  window.WK.matches.forEach((m) => {
    m.status = 'open';
    m.pred = null;
    m.joker = false;
    delete m.result;
    delete m.hit;
    delete m.pts;
  });
}

/* Bouwt de stand uit de gedeelde deelnemerslijst i.p.v. alleen jezelf.
   Jij bent altijd zichtbaar — ook vóór de eerste sync of zonder verbinding. */
function buildPeople(members, account) {
  const list = Array.isArray(members) ? members.slice() : [];
  const meId = account && account.memberId;
  const inList = account && list.some((m) => (meId ? m.id === meId : m.name === account.name));
  if (account && !inList) {
    list.push({
      id: meId || 'self',
      name: account.name,
      photo: account.photo,
      joinedAt: account.joinedAt,
    });
  }
  // Ranglijst: meeste punten eerst, bij gelijke stand op alfabet.
  list.sort((a, b) => (b.pts || 0) - (a.pts || 0)
    || String(a.name || '').localeCompare(String(b.name || ''), 'nl', { sensitivity: 'base' }));
  const isMe = (m) => (account ? (meId ? m.id === meId : m.name === account.name) : false);
  window.WK.people = list.map((m) => ({
    name: m.name || 'Deelnemer',
    photo: m.photo || '',
    pts: m.pts || 0,
    d: 0,
    exact: m.exact || 0,
    rond: m.rond || 0,
    player: m.player || null,
    me: isMe(m),
  }));
  const mine = list.find(isMe);
  window.WK.myExact = mine ? (mine.exact || 0) : 0;
  window.WK.myToto = mine ? (mine.toto || 0) : 0;
}

/* Knock-out-bracket invullen: de FIFA-sync levert per KO-wedstrijd de echte
   landcodes zodra ze bekend zijn; hier vervangen ze de plaatshouders
   ("Winnaar Poule C"), zodat vlaggen verschijnen en voorspellen opengaat. */
function applyKoTeams(koTeams) {
  if (!Array.isArray(koTeams) || !koTeams.length) return;
  const byId = {};
  koTeams.forEach((k) => { byId[String(k.matchId)] = k; });
  window.WK.matches.forEach((m) => {
    const k = byId[String(m.id)];
    if (!k) return;
    if (window.WK.T[k.home]) m.h = k.home;
    if (window.WK.T[k.away]) m.a = k.away;
  });
}

/* Echte uitslagen (door de eigenaar ingevoerd) in de wedstrijden zetten en de
   groepstanden herberekenen, zodat Poules/Programma/Wedstrijden meebewegen. */
function applyResults(results, preds) {
  const byId = {};
  (results || []).forEach((r) => { byId[String(r.matchId)] = r; });
  window.WK.matches.forEach((m) => {
    const r = byId[String(m.id)];
    if (!r) return; // resetTournamentState heeft deze al op 'open' gezet
    m.status = 'done';
    m.result = [r.home, r.away];
    const p = preds ? preds[m.id] : null;
    if (p && p[0] != null && p[1] != null && window.WK.scoreMatchPrediction) {
      const sc = window.WK.scoreMatchPrediction({ pred: [p[0], p[1]], result: [r.home, r.away] });
      m.pts = sc.total;
      m.hit = sc.parts.exact ? 'exact' : sc.parts.outcome ? 'toto' : null;
    } else {
      m.pts = 0;
      m.hit = null;
    }
  });
  if (window.WK.standings && window.WK.tables) {
    window.WK.groups.forEach((g) => { window.WK.tables[g.id] = window.WK.standings(g.id); });
  }
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [account, setAccount] = useS(() => loadSession());
  const [members, setMembers] = useS([]);
  const [results, setResults] = useS([]);
  const [koTeams, setKoTeams] = useS([]);
  const [tab, setTab] = useS('stand');
  const [preds, setPreds] = useS({});
  const [playerPick, setPlayerPick] = useS('');
  const [players, setPlayers] = useS([]);
  const saveTimers = React.useRef({});
  const locked = wkLocked();

  // Voorspelling opslaan (gedebounced) zodra beide scores ingevuld zijn.
  // Per wedstrijd: het invoerveld is al uitgeschakeld na de aftrap, en de server
  // weigert een voorspelling voor een begonnen wedstrijd — dus geen globaal slot.
  const persistPrediction = (id, home, away) => {
    if (!account || !account.memberId || !isMatchId(id)) return;
    clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = setTimeout(() => {
      fetch(PREDICTIONS_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ memberId: account.memberId, contact: account.contact, matchId: String(id), home, away }),
      }).catch(() => {});
    }, 600);
  };

  const setPred = (id, val) => {
    setPreds((p) => ({ ...p, [id]: val }));
    const h = val && val[0];
    const a = val && val[1];
    if (typeof h === 'number' && typeof a === 'number') persistPrediction(id, h, a);
  };

  const handlePlayerPick = async (name, playerId) => {
    if (!account || !account.memberId) return { ok: false, error: 'Nog niet ingelogd.' };
    if (locked) return { ok: false, error: 'De groepsfase is op slot.' };
    try {
      const res = await fetch(PICK_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ memberId: account.memberId, contact: account.contact, player: name, playerId: playerId || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { setPlayerPick(data.player || name); return { ok: true }; }
      return { ok: false, error: data.error || 'Opslaan mislukt.' };
    } catch {
      return { ok: false, error: 'Opslaan mislukt.' };
    }
  };

  resetTournamentState();
  buildPeople(members, account);
  applyKoTeams(koTeams);
  applyResults(results, preds);

  // Vangnet: localStorage leeg maar sessie-cookie aanwezig (bijv. na een
  // opgeschoonde browser) → stil opnieuw inloggen met het bekende contact.
  React.useEffect(() => {
    if (account) return;
    const saved = readSessionCookie();
    if (!saved || !saved.contact) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/hartmanwk/login', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ contact: saved.contact }),
        });
        if (!res.ok || !alive) return;
        const data = await res.json();
        const m = data.member;
        if (!m || !m.id) return;
        const session = {
          name: m.name || 'Jij',
          contact: m.contact || saved.contact,
          contactType: m.contactType || 'email',
          photo: m.photo || '',
          joinedAt: m.joinedAt || new Date().toISOString(),
          memberId: m.id,
        };
        saveSession(session);
        setAccount(session);
        if (Array.isArray(data.members)) setMembers(data.members);
      } catch { /* dan gewoon het loginscherm */ }
    })();
    return () => { alive = false; };
  }, [account ? 'in' : 'uit']);

  // Houd de gedeelde deelnemerslijst actueel: bij binnenkomst ophalen, daarna
  // elke 15s verversen zodat nieuw aangemelde familie vanzelf verschijnt. Heeft
  // de sessie nog geen server-id (oude lokale login), dan eerst stil aanmelden.
  React.useEffect(() => {
    if (!account) { setMembers([]); return; }
    let alive = true;
    const pullMembers = async () => {
      try {
        const res = await fetch(STANDINGS_URL, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!alive) return;
        if (Array.isArray(data.members)) setMembers(data.members);
        if (Array.isArray(data.results)) setResults(data.results);
        if (Array.isArray(data.koTeams)) setKoTeams(data.koTeams);
      } catch { /* offline: lokale stand blijft staan */ }
    };
    const sync = async () => {
      if (!account.memberId) {
        try {
          const res = await fetch(JOIN_URL, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ name: account.name, contact: account.contact, photo: account.photo }),
          });
          if (res.ok) {
            const data = await res.json();
            if (!alive) return;
            if (data.member && data.member.id) {
              const next = { ...account, memberId: data.member.id, contact: data.member.contact || account.contact };
              saveSession(next);
              setAccount(next);
            }
            if (Array.isArray(data.members)) setMembers(data.members);
            return;
          }
        } catch { /* val terug op gewoon ophalen */ }
      }
      await pullMembers();
    };
    sync();
    const timer = setInterval(pullMembers, MEMBERS_POLL_MS);
    return () => { alive = false; clearInterval(timer); };
  }, [account ? account.memberId : null, account ? account.contact : null]);

  // Eigen voorspellingen + sterspeler ophalen zodra we weten wie je bent.
  React.useEffect(() => {
    if (!account || !account.memberId || !account.contact) return;
    let alive = true;
    (async () => {
      try {
        const params = new URLSearchParams({ memberId: account.memberId, contact: account.contact });
        const res = await fetch(`${PREDICTIONS_URL}?${params.toString()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!alive) return;
        if (Array.isArray(data.predictions)) {
          const map = {};
          data.predictions.forEach((p) => { map[p.match_id] = [p.home, p.away]; });
          setPreds(map);
        }
        if (data.playerPick) setPlayerPick(data.playerPick);
      } catch { /* lokaal blijft staan */ }
    })();
    return () => { alive = false; };
  }, [account ? account.memberId : null, account ? account.contact : null]);

  // WK-selecties ophalen voor de sterspeler-kieslijst (eenmalig na inloggen).
  React.useEffect(() => {
    if (!account || !account.memberId) return;
    let alive = true;
    fetch(PLAYERS_URL, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d && Array.isArray(d.players)) setPlayers(d.players); })
      .catch(() => {});
    return () => { alive = false; };
  }, [account ? account.memberId : null]);

  const me = window.WK.people.find((p) => p.me);
  const myRank = window.WK.people.indexOf(me) + 1;
  const T = window.WK.T;

  React.useEffect(() => {
    document.documentElement.style.setProperty('--accent', t.accent);
    document.documentElement.style.setProperty('--app-font', t.font + ', system-ui, sans-serif');
  }, [t.accent, t.font]);

  const tabs = [
    { k: 'stand', label: 'Stand', icon: 'stand', c: '#3B8EEA' },
    { k: 'wedstrijden', label: 'Wedstrijden', icon: 'ball', c: '#F0556B' },
    { k: 'poules', label: 'Poules', icon: 'groups', c: '#34C77B' },
    { k: 'account', label: 'Account', icon: 'user', c: '#FFFFFF' },
  ];

  const handleLogin = async (nextAccount) => {
    const session = {
      name: nextAccount.name || 'Jij',
      contact: nextAccount.contact,
      contactType: nextAccount.contactType,
      photo: nextAccount.photo || '',
      joinedAt: nextAccount.joinedAt || new Date().toISOString(),
      memberId: nextAccount.memberId || null,
    };

    // Bestaande deelnemer via /login: account is er al, dus niets aanmaken.
    if (session.memberId) {
      if (Array.isArray(nextAccount.members)) setMembers(nextAccount.members);
      saveSession(session);
      setAccount(session);
      setTab('stand');
      return;
    }

    // Meld aan bij de gedeelde lijst. Een echte invoerfout (4xx) tonen we; een
    // tijdelijke serverstoring (5xx/offline) mag het inloggen nooit blokkeren —
    // de sync-effect meldt je dan later alsnog aan.
    try {
      const res = await fetch(JOIN_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: session.name, contact: session.contact, photo: session.photo }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.member && data.member.id) {
          session.memberId = data.member.id;
          if (data.member.contact) session.contact = data.member.contact;
          if (data.member.joinedAt) session.joinedAt = data.member.joinedAt;
        }
        if (Array.isArray(data.members)) setMembers(data.members);
      } else if (res.status >= 400 && res.status < 500) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Aanmelden mislukt. Controleer je gegevens.');
      }
    } catch (err) {
      if (err && err.message && !/fetch|network|Failed/i.test(err.message)) throw err;
      // offline of serverstoring: ga lokaal door, sync volgt vanzelf.
    }

    saveSession(session);
    setAccount(session);
    setTab('stand');
  };

  const handleLogout = () => {
    clearSession();
    setMembers([]);
    setAccount(null);
    setTab('stand');
  };

  const handleUpdateAccount = (patch) => {
    setAccount((current) => {
      const next = { ...current, ...patch };
      saveSession(next);
      // Een nieuwe foto ook in de gedeelde lijst zetten, zodat familie 'm ziet.
      if (patch.photo && next.contact) {
        fetch(JOIN_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name: next.name, contact: next.contact, photo: next.photo }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => { if (d && Array.isArray(d.members)) setMembers(d.members); })
          .catch(() => {});
      }
      return next;
    });
  };

  if (!account) {
    return (
      <div className={'app' + (t.toonWeer ? '' : ' no-weer')}>
        <LoginScreen onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className={'app' + (t.sfeer === 'feestelijk' ? ' festive' : '') + (t.toonWeer ? '' : ' no-weer')}>
      {/* ---- Sticky navbar: WK 2026-balk + tabs ---- */}
      <header className="hdr">
        <div className="hdr-tourney">
          <div className="tourney-titles">
            <div className="tourney-name">HARTMAN WK&nbsp;2026 POULE</div>
            <div className="tourney-sub">Wereldkampioenschap voetbal</div>
          </div>
          <div className="hosts">
            <span className="hosts-label">Gastlanden</span>
            <span className="hosts-flags">
              <Flag code="USA" w={26} /><Flag code="CAN" w={26} /><Flag code="MEX" w={26} />
            </span>
          </div>
        </div>
        <nav className="hdr-nav">
          {tabs.map((tb) => (
            <button key={tb.k} style={{ '--tc': tb.c }} className={'tab' + (tab === tb.k ? ' tab-on' : '')} onClick={() => setTab(tb.k)}>
              <Icon name={tb.icon} size={17} />
              <span>{tb.label}</span>
            </button>
          ))}
        </nav>
      </header>

      {tab === 'account' ? (
        <main className="content">
          <AccountScreen account={account} onLogout={handleLogout} onBack={() => setTab('stand')} onUpdateAccount={handleUpdateAccount} />
        </main>
      ) : (
        <React.Fragment>
          <DayMatchesCard />

          {/* ---- Content ---- */}
          <main className="content">
            {tab === 'stand' && <StandScreen />}
            {tab === 'wedstrijden' && <WedstrijdenScreen preds={preds} setPred={setPred} playerPick={playerPick} onPlayerPick={handlePlayerPick} players={players} locked={locked} />}
            {tab === 'poules' && <PoulesScreen />}
          </main>

          <footer className="appfoot">
            Hartman WK Poule · WK 2026 · familie &amp; vrienden
          </footer>
        </React.Fragment>
      )}

      {/* ---- Tweaks ---- */}
      <TweaksPanel>
        <TweakSection label="Sfeer" />
        <TweakRadio label="Stijl" value={t.sfeer} options={['rustig', 'feestelijk']}
          onChange={(v) => setTweak('sfeer', v)} />
        <TweakColor label="Accentkleur" value={t.accent}
          options={['#3B8EEA', '#F0556B', '#34C77B', '#FFFFFF']}
          onChange={(v) => setTweak('accent', v)} />
        <TweakToggle label="Weer tonen" value={t.toonWeer}
          onChange={(v) => setTweak('toonWeer', v)} />
        <TweakSection label="Typografie" />
        <TweakSelect label="Lettertype" value={t.font}
          options={["'Inter'", "'Hanken Grotesk'", "'Figtree'", "'Fraunces'", "system-ui"]}
          onChange={(v) => setTweak('font', v)} />
      </TweaksPanel>
    </div>
  );
}

function TourneyEmblem() {
  // Origineel embleem — gestileerde wereldbeker met een wereldbol, in de feestelijke
  // meerkleuren-sfeer van een wereldkampioenschap. Geen officieel/FIFA-merk.
  return (
    <svg width="38" height="38" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="emb" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0" stopColor="#E8732A" />
          <stop offset=".4" stopColor="#D63B6E" />
          <stop offset=".7" stopColor="#7A52C7" />
          <stop offset="1" stopColor="#1E83C8" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="20" fill="url(#emb)" />
      {/* beker */}
      <path d="M14 11h12v4a6 6 0 0 1-12 0z" fill="#FBC65A" />
      <path d="M26 12h2.6a2.6 2.6 0 0 1-2.6 4M14 12h-2.6a2.6 2.6 0 0 0 2.6 4" stroke="#FBC65A" strokeWidth="1.6" fill="none" />
      <rect x="18.6" y="20" width="2.8" height="4" fill="#FBC65A" />
      <rect x="15.5" y="24" width="9" height="3" rx="1" fill="#FBC65A" />
      {/* wereldbol-meridiaan op de beker */}
      <path d="M20 11.4c-2 1.4-2 6.2 0 7.6M20 11.4c2 1.4 2 6.2 0 7.6M15 15.2h10" stroke="#C77D2E" strokeWidth="1" fill="none" opacity=".7" />
    </svg>
  );
}

function LogoMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="var(--accent)" />
      <circle cx="13" cy="12.5" r="5" fill="#FBC65A" />
      <path d="M9 20.5 a3.4 3.4 0 0 1 .3 -6.7 a4.4 4.4 0 0 1 8.4 1 a3 3 0 0 1 -.4 5.7z" fill="#fff" />
      <circle cx="21.5" cy="21" r="4.4" fill="#0f3a57" stroke="#fff" strokeWidth="1.2" />
      <path d="M21.5 18.4l1.9 1.4-.7 2.2h-2.4l-.7-2.2z" fill="#fff" />
    </svg>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
