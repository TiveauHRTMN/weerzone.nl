/* Hartman WK Poule — schermen */
const { useState } = React;

const NL_DAYS = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
const NL_MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
function fmtDate(iso) {
  const d = new Date(iso + 'T12:00');
  return `${NL_DAYS[d.getDay()]} ${d.getDate()} ${NL_MONTHS[d.getMonth()]}`;
}

function matchStartDate(m) {
  return new Date(`${m.date}T${m.time}:00`);
}

// Verplicht-slot: de hele groepsfase gaat op slot bij de eerste aftrap
// (2026-06-11 21:00 CEST = 19:00 UTC). Knock-out blijft per wedstrijd sluiten.
const WK_LOCK_MS = Date.parse('2026-06-11T19:00:00Z');
function isPredictionLocked(m) {
  if (m.gid !== 'KO') return Date.now() >= WK_LOCK_MS;
  return m.status === 'open' && new Date() >= matchStartDate(m);
}

function deadlineLabel(m) {
  return `${fmtDate(m.date)} om ${m.time}`;
}

// ---------- Score-invoer ----------
function ScoreBox({ value, onChange, disabled }) {
  const v = value === null || value === undefined ? '' : value;
  return (
    <div className={'scorebox' + (disabled ? ' scorebox-locked' : '')}>
      <button className="sb-step" disabled={disabled} onClick={() => onChange(Math.min(9, (value || 0) + 1))} aria-label="meer">+</button>
      <div className="sb-val">{v === '' ? '–' : v}</div>
      <button className="sb-step" onClick={() => onChange(Math.max(0, (value || 0) - 1))} aria-label="minder">−</button>
    </div>
  );
}

// ---------- Match-kaart ----------
function MatchCard({ m, pred, setPred }) {
  const T = window.WK.T;
  const done = m.status === 'done';
  const live = m.status === 'live';
  const open = m.status === 'open';
  const locked = isPredictionLocked(m);
  const canPredict = open && !locked;
  const p = pred || [null, null];
  const hasPred = p[0] !== null && p[0] !== undefined;

  let pill = null;
  if (done) {
    const exact = m.hit === 'exact', some = m.hit === 'toto';
    pill = <span className={'ptpill ' + (exact ? 'pt-exact' : some ? 'pt-some' : 'pt-miss')}>
      {exact ? 'Exacte uitslag' : some ? 'Juiste winnaar/gelijkspel' : 'Mis'} · {m.pts} pt
    </span>;
  }

  return (
    <div className={'match' + (live ? ' match-live' : '') + (canPredict && !hasPred ? ' match-todo' : '') + (locked ? ' match-locked' : '')}>
      <div className="match-top">
        <GroupBadge id={m.gid} soft />
        <span className="match-place">
          <WeatherChip weer={m.weer} />
          <span className="match-city">{m.city}</span>
        </span>
      </div>

      <div className="match-body">
        <div className="team team-h">
          <span className="team-name"><TeamName code={m.h} /></span>
          <Flag code={m.h} w={32} />
        </div>

        <div className="score-zone">
          {done || live ? (
            <div className="result">
              <span>{m.result[0]}</span><span className="rdash">-</span><span>{m.result[1]}</span>
            </div>
          ) : (
            <div className="predict">
              <ScoreBox value={p[0]} disabled={locked} onChange={(x) => setPred(m.id, [x, p[1] ?? 0])} />
              <span className="rdash">-</span>
              <ScoreBox value={p[1]} disabled={locked} onChange={(x) => setPred(m.id, [p[0] ?? 0, x])} />
            </div>
          )}
          {live && <span className="liveflag"><span className="livedot" />live {m.min}'</span>}
          {canPredict && <span className="openflag">sluit {m.time}</span>}
          {locked && <span className="lockflag">gesloten sinds {m.time}</span>}
        </div>

        <div className="team team-a">
          <Flag code={m.a} w={32} />
          <span className="team-name"><TeamName code={m.a} /></span>
        </div>
      </div>

      <div className="match-foot">
        <span className="yourpred">
          {done || live
            ? <>Jouw inzet: <strong>{p[0] ?? '–'}-{p[1] ?? '–'}</strong></>
            : locked
              ? <>Deadline: <strong>{deadlineLabel(m)}</strong></>
            : hasPred
              ? <>Voorspeld: <strong>{p[0]}-{p[1]}</strong></>
              : <span className="todo-text">Nog niet voorspeld</span>}
        </span>
        {pill || (live && <span className="ptpill pt-live">telt nog mee</span>)}
        {locked && <span className="ptpill pt-locked">gesloten</span>}
        {canPredict && (hasPred
          ? <span className="ptpill pt-saved">opgeslagen</span>
          : <span className="ptpill pt-open">uitslag max 100 pt</span>)}
      </div>
    </div>
  );
}

function RulesLegend() {
  const P = window.WK.points;
  return (
    <div className="legend card">
      <div className="legend-head">
        <div>
          <div className="legend-k">Legenda & regels</div>
          <div className="legend-title">Punten en deadlines</div>
        </div>
        <span className="legend-pill">automatisch</span>
      </div>
      <div className="legend-grid">
        <div className="legend-item"><strong>Exacte uitslag</strong><span>+{P.exact} punten</span></div>
        <div className="legend-item"><strong>Winnaar/gelijkspel goed</strong><span>+{P.outcome} punten</span></div>
        <div className="legend-item"><strong>Goals team A/B goed</strong><span>+{P.teamGoals} per team</span></div>
        <div className="legend-item"><strong>Doelpuntenmaker</strong><span>+{P.scorer} punten</span></div>
        <div className="legend-item"><strong>Eerste doelpuntenmaker</strong><span>+{P.firstScorer} punten</span></div>
        <div className="legend-item"><strong>Perfect match</strong><span>+{P.perfectMatch} bonus</span></div>
        <div className="legend-item"><strong>Joker</strong><span>1 per speelronde, alles x{P.joker}</span></div>
        <div className="legend-item"><strong>Wereldkampioen</strong><span>+{P.champion} punten</span></div>
      </div>
      <div className="legend-rules">
        <span>Voorspellen kan tot de aftrap. Begint een wedstrijd om 18:00, dan sluit die wedstrijd om 18:00.</span>
        <span>Na sluiting kun je die voorspelling niet meer wijzigen.</span>
        <span>Wereldkampioen en fantasy spelers moeten voor de openingswedstrijd vaststaan.</span>
      </div>
    </div>
  );
}

// ---------- Sterspeler-keuze ----------
function wkNorm(s) {
  return (s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();
}
function wkResolvePlayer(value, players) {
  const nv = wkNorm(value);
  if (!nv || !players || !players.length) return null;
  return (
    players.find((p) => wkNorm(p.name + ' — ' + p.team) === nv)
    || players.find((p) => wkNorm(p.name) === nv)
    || (players.filter((p) => wkNorm(p.name).includes(nv)).length === 1
      ? players.filter((p) => wkNorm(p.name).includes(nv))[0]
      : null)
  );
}

function PlayerPickCard({ playerPick, onPlayerPick, players, locked }) {
  const [name, setName] = useState(playerPick || '');
  const [open, setOpen] = useState(false);
  const [pickedId, setPickedId] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | saving | saved | error
  const [error, setError] = useState('');
  React.useEffect(() => { setName(playerPick || ''); }, [playerPick]);

  const list = players || [];
  const q = wkNorm(name);
  const suggestions = (open && q.length >= 2 && list.length)
    ? list.filter((p) => wkNorm(p.name).includes(q) || wkNorm(p.team).includes(q)).slice(0, 8)
    : [];
  const resolved = pickedId || wkResolvePlayer(name, list);

  const choose = (p) => { setName(p.name); setPickedId(p.id); setOpen(false); setStatus('idle'); setError(''); };

  const save = async () => {
    let id = pickedId;
    let finalName = name.trim();
    const match = wkResolvePlayer(name, list);
    if (match) { id = match.id; finalName = match.name; }
    if (finalName.length < 2) { setStatus('error'); setError('Kies je sterspeler uit de lijst.'); return; }
    setStatus('saving'); setError('');
    const res = await onPlayerPick(finalName, id);
    if (res && res.ok) { setName(finalName); setStatus('saved'); setTimeout(() => setStatus('idle'), 1800); }
    else { setStatus('error'); setError((res && res.error) || 'Opslaan mislukt.'); }
  };

  return (
    <div className="card pickcard">
      <div className="pickcard-h">
        <div>
          <div className="section-kicker">Jouw sterspeler</div>
          <div className="pickcard-title">1 speler, het hele toernooi</div>
        </div>
        {playerPick && <span className="ptpill pt-saved">{playerPick}</span>}
      </div>
      <p className="pickcard-sub">Begin te typen en kies je speler uit de officiële WK-selecties. Goals en assists leveren punten op, kaarten kosten punten — je speler blijft het hele toernooi staan.</p>
      <div className="pickcard-row">
        <div className="pickcard-field">
          <input
            className="field-input pickcard-input"
            value={name}
            disabled={locked}
            onChange={(e) => { setName(e.target.value); setPickedId(null); setOpen(true); setStatus('idle'); setError(''); }}
            onFocus={() => setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setOpen(false); save(); } }}
            placeholder={list.length ? 'Begin te typen, bv. Ronaldo of Gakpo' : 'Sterspeler laden…'}
            autoComplete="off"
          />
          {suggestions.length > 0 && (
            <div className="pickcard-suggest">
              {suggestions.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  className="pickcard-opt"
                  onMouseDown={(e) => { e.preventDefault(); choose(p); }}
                >
                  <span className="pickcard-opt-n">{p.name}</span>
                  <span className="pickcard-opt-t">{p.team}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="auth-submit pickcard-btn" type="button" disabled={locked || status === 'saving'} onClick={save}>
          {locked ? 'Op slot' : status === 'saving' ? 'Opslaan…' : status === 'saved' ? 'Opgeslagen ✓' : 'Opslaan'}
        </button>
      </div>
      {!locked && name.trim().length >= 2 && !resolved && (
        <div className="pickcard-hint">Kies je speler uit de lijst zodat zijn punten automatisch meetellen.</div>
      )}
      {error && <div className="pickcard-err">{error}</div>}
    </div>
  );
}

// ---------- Stand ----------
function StandScreen() {
  const W = window.WK;
  const ppl = W.people;
  const me = ppl.find((p) => p.me);
  const myRank = ppl.indexOf(me) + 1;
  const podium = ppl.slice(0, 3);
  const order = [podium[1], podium[0], podium[2]];
  const hasRealStand = ppl.length > 1;
  const [shareStatus, setShareStatus] = useState('');
  const inviteLink = `${window.location.origin}/hartmanwk2026?uitnodiging=hartman`;
  const movers = ppl.filter((p) => p.d !== 0);
  const shareLines = [
    `Hartman WK 2026 Poule - avondstand (${ppl.length} deelnemer${ppl.length === 1 ? '' : 's'})`,
    '',
    ...ppl.map((p, i) => `${i + 1}. ${p.name} - ${p.pts} punten${p.d ? ` (${p.d > 0 ? '+' : ''}${p.d} plek${Math.abs(p.d) === 1 ? '' : 'ken'})` : ''}`),
    '',
    `Jouw plek: ${myRank}e met ${me.pts} punten`,
    movers.length ? `Beweging: ${movers.slice(0, 4).map((p) => `${p.name} ${p.d > 0 ? '+' : ''}${p.d}`).join(', ')}` : 'Beweging: nog geen stijgers of dalers',
    '',
    `Meedoen of meekijken: ${inviteLink}`,
  ];
  const copyStand = async () => {
    try {
      await navigator.clipboard.writeText(shareLines.join('\n'));
      setShareStatus('Avondstand gekopieerd voor WhatsApp');
    } catch {
      setShareStatus('Kopiëren lukte niet. Selecteer de tekst handmatig.');
    }
  };
  return (
    <div className="screen">
      {/* persoonlijk overzicht */}
      <div className="mecard card">
        <div className="mecard-head">
          <Avatar name={me.name} me photo={me.photo} size={46} />
          <div className="mecard-id">
            <div className="mecard-name">{me.name}</div>
            <div className="mecard-pos">{myRank}e plaats · {ppl.length} deelnemers</div>
            {me.player && <div className="mecard-player">★ {me.player}</div>}
          </div>
          <div className="mecard-total"><span>{me.pts}</span>punten</div>
        </div>
        <div className="stat-row">
          <StatTile label="Deze ronde" value={'+' + me.rond} accent sub=" pt" />
          <StatTile label="Exact goed" value={W.myExact} />
          <StatTile label="Uitslag goed" value={W.myToto} />
          <StatTile label="Deelnemers" value={ppl.length} />
        </div>
      </div>

      <div className="stand-share card">
        <div>
          <div className="stand-share-k">WhatsApp update</div>
          <div className="stand-share-title">Deel de avondstand</div>
          <p>Alle {ppl.length} deelnemer{ppl.length === 1 ? '' : 's'}, inclusief punten en stijgers/dalers.</p>
        </div>
        <button className="stand-share-btn" type="button" onClick={copyStand}>Ranglijst kopiëren</button>
        {shareStatus && <div className="stand-share-note">{shareStatus}</div>}
      </div>

      {/* podium */}
      {hasRealStand ? (
        <div className="podium">
          {order.filter(Boolean).map((pp, oi) => {
            const rank = pp === podium[0] ? 1 : pp === podium[1] ? 2 : 3;
            return (
              <div key={pp.name} className={'pod pod-in pod-' + rank} style={{ animationDelay: (oi * 90) + 'ms' }}>
                <Avatar name={pp.name} me={pp.me} photo={pp.photo} size={rank === 1 ? 56 : 46} />
                <div className="pod-name">{pp.name}</div>
                <div className="pod-pts">{pp.pts}<span>pt</span></div>
                <div className="pod-base"><span className="pod-rank">{rank}</span></div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card empty-state">
          <div className="empty-title">Nog geen ranglijst</div>
          <p>De poule is klaar voor echte deelnemers. Zodra mensen meedoen, verschijnt hier de stand.</p>
        </div>
      )}

      {/* tabel */}
      <div className="table card">
        <div className="trow thead">
          <span className="c-rank">#</span>
          <span className="c-name">Deelnemer</span>
          <span className="c-rond">ronde</span>
          <span className="c-exact">voltr.</span>
          <span className="c-pts">punten</span>
        </div>
        {ppl.map((pp, i) => (
          <div key={pp.name} style={{ animationDelay: (Math.min(i, 12) * 45) + 'ms' }} className={'trow' + (pp.me ? ' trow-me' : '') + (pp.d > 0 ? ' trow-rise' : pp.d < 0 ? ' trow-fall' : ' trow-in') + (Math.abs(pp.d) >= 3 ? ' trow-bigjump' : '')}>
            <span className="c-rank">{i + 1}<Delta d={pp.d} /></span>
            <span className="c-name"><Avatar name={pp.name} me={pp.me} photo={pp.photo} size={30} /><span className="c-name-txt"><span className="c-name-n">{pp.name}</span>{pp.player && <span className="c-name-p">★ {pp.player}</span>}</span></span>
            <span className="c-rond">+{pp.rond}</span>
            <span className="c-exact">{pp.exact}</span>
            <span className="c-pts">{pp.pts}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Wedstrijden ----------
function WedstrijdenScreen({ preds, setPred, playerPick, onPlayerPick, players, locked }) {
  const W = window.WK;
  const [filter, setFilter] = useState('alles');
  const roundLabels = {
    4: ['Laatste 32', '28 juni - 4 juli'],
    5: ['Laatste 16', '4 - 7 juli'],
    6: ['Kwartfinale', '9 - 12 juli'],
    7: ['Halve finale', '14 - 15 juli'],
    8: ['3e/4e plaats', '18 juli'],
    9: ['Finale', '19 juli'],
  };
  const rounds = [...W.rounds];
  [...new Set(W.matches.map((m) => m.round))]
    .filter((n) => !rounds.some((r) => r.n === n))
    .sort((a, b) => a - b)
    .forEach((n) => {
      const label = roundLabels[n] || [`Ronde ${n}`, ''];
      rounds.push({ n, label: label[0], sub: label[1] });
    });
  const chips = [
    { k: 'alles', label: 'Alles' },
    { k: 'open', label: 'Te voorspellen' },
    { k: 'NED', label: 'Nederland' },
    ...W.groups.map((g) => ({ k: 'g' + g.id, label: 'Poule ' + g.id })),
  ];
  const match = (m) => {
    if (filter === 'alles') return true;
    if (filter === 'open') return m.status === 'open';
    if (filter === 'NED') return m.h === 'NED' || m.a === 'NED';
    if (filter[0] === 'g') return m.gid === filter.slice(1);
    return true;
  };
  const groupMatches = W.matches.filter((m) => m.gid !== 'KO');
  const filled = groupMatches.filter((m) => { const p = preds[m.id]; return p && p[0] != null && p[1] != null; }).length;
  const total = groupMatches.length;
  const pct = total ? Math.round((filled / total) * 100) : 0;
  const hasPlayer = !!(playerPick && playerPick.trim());
  const complete = filled === total && hasPlayer;

  return (
    <div className="screen">
      <PlayerPickCard playerPick={playerPick} onPlayerPick={onPlayerPick} players={players} locked={locked} />

      <div className="card progresscard">
        <div className="progress-top">
          <div>
            <div className="section-kicker">{locked ? 'Groepsfase gesloten' : complete ? 'Helemaal klaar' : 'Vul alles in vóór 11 juni'}</div>
            <div className="progress-title">{filled}/{total} wedstrijden{hasPlayer ? ' · speler ✓' : ' · nog geen speler'}</div>
          </div>
          <div className="progress-pct">{pct}%</div>
        </div>
        <div className="progress-bar"><span style={{ width: pct + '%' }} /></div>
        {!locked && !complete && <p className="progress-note">Alles moet ingevuld zijn vóór de aftrap op 11 juni 21:00 — daarna gaat de poule op slot.</p>}
        {!locked && complete && <p className="progress-note">Top, alles staat. Je kunt nog wijzigen tot 11 juni 21:00.</p>}
        {locked && <p className="progress-note">Je groepsvoorspellingen en sterspeler zijn vergrendeld. Succes!</p>}
      </div>

      <div className="chips">
        {chips.map((c) => (
          <button key={c.k} className={'chip' + (filter === c.k ? ' chip-on' : '')} onClick={() => setFilter(c.k)}>{c.label}</button>
        ))}
      </div>

      {rounds.map((rd) => {
        const ms = W.matches.filter((m) => m.round === rd.n && match(m));
        if (!ms.length) return null;
        return (
          <div key={rd.n} className="mgroup">
            <div className="mgroup-h">
              <span>{rd.label}</span>
              <span className="mgroup-sub">{rd.sub}</span>
            </div>
            <div className="mlist">
              {ms.map((m) => <MatchCard key={m.id} m={m} pred={preds[m.id]} setPred={setPred} />)}
            </div>
          </div>
        );
      })}
      <RulesLegend />
    </div>
  );
}

// ---------- Poules (groepsstanden) ----------
function PoulesScreen() {
  const W = window.WK, T = W.T;
  return (
    <div className="screen">
      <div className="section-head">
        <div>
          <div className="section-kicker">Groepsfase</div>
          <h2>Stand per poule</h2>
        </div>
      </div>
      <p className="screen-intro">De bovenste twee van elke poule gaan door naar de knock-outfase. De beste nummers drie worden later automatisch bepaald.</p>
      <div className="poule-grid">
        {W.groups.map((g) => (
          <div key={g.id} className="poule card">
            <div className="poule-h">
              <div>
                <GroupBadge id={g.id} />
                <div className="poule-title">Stand Groep {g.id}</div>
              </div>
              <span className="poule-meta">{(() => { const sp = Math.max(...W.tables[g.id].map((r) => r.sp)); return sp > 0 ? 'na ' + sp + (sp === 1 ? ' speelronde' : ' speelrondes') : 'nog niet begonnen'; })()}</span>
            </div>
            <table className="ptable">
              <thead>
                <tr className="ptrow pthead">
                  <th className="pt-pos">Rang</th><th className="pt-team">Land</th>
                  <th className="pt-n">GW</th><th className="pt-pts">PTN</th><th className="pt-n">DS</th>
                </tr>
              </thead>
              <tbody>
              {W.tables[g.id].map((r, i) => (
                <tr key={r.code} className={'ptrow' + (i < 2 ? ' pt-qual' : '')}>
                  <td className="pt-pos">{i + 1}</td>
                  <td className="pt-team"><Flag code={r.code} w={24} /><span>{T[r.code].name}</span></td>
                  <td className="pt-n">{r.sp}</td>
                  <td className="pt-pts">{r.pt}</td>
                  <td className="pt-n">{r.saldo > 0 ? '+' + r.saldo : r.saldo}</td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Bonus ----------
function BonusScreen() {
  const bonus = window.WK.bonus;
  const total = bonus.reduce((s, b) => s + b.pts, 0);
  return (
    <div className="screen">
      <div className="bonus-intro card">
        <div>
          <div className="bi-title">Bonusvragen</div>
          <p>Ingevuld vóór de aftrap en nu vergrendeld. Samen goed voor <strong>{total} punten</strong> — vaak beslissen ze de poule.</p>
        </div>
        <div className="bi-lock"><LockIcon /></div>
      </div>
      <div className="bonus-list">
        {bonus.map((b, i) => (
          <div key={i} className="bcard card">
            <div className="bcard-q">{b.q}</div>
            <div className="bcard-a">
              {b.team && <Flag code={b.team} w={26} />}
              <div className="ba-text">
                <div className="ba-main">{b.a}</div>
                {b.sub && <div className="ba-sub">{b.sub}</div>}
              </div>
            </div>
            <div className="bcard-pts">{b.pts}<span>pt</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}
function LockIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;
}

// ---------- Programma ----------
function ProgrammaScreen() {
  const W = window.WK, T = W.T;
  const byDate = {};
  W.matches.forEach((m) => { (byDate[m.date] = byDate[m.date] || []).push(m); });
  return (
    <div className="screen">
      {Object.keys(byDate).sort().map((date) => (
        <div key={date} className="pgroup">
          <div className="pgroup-h">{fmtDate(date)}</div>
          <div className="card prog-card">
            {byDate[date].sort((a, b) => a.time.localeCompare(b.time)).map((m) => {
              const done = m.status === 'done', live = m.status === 'live';
              return (
                <div key={m.id} className="prow">
                  <span className="prow-time">{m.time}</span>
                  <span className="prow-g">{m.gid}</span>
                  <span className="prow-team prow-h"><TeamName code={m.h} /><Flag code={m.h} w={22} /></span>
                  <span className={'prow-score' + (live ? ' prow-live' : done ? '' : ' prow-open')}>
                    {done || live ? `${m.result[0]}-${m.result[1]}` : m.time}
                  </span>
                  <span className="prow-team prow-a"><Flag code={m.a} w={22} /><TeamName code={m.a} /></span>
                  <span className="prow-weer"><WeatherIcon c={m.weer.c} size={15} />{m.weer.t}°</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { StandScreen, WedstrijdenScreen, PoulesScreen, BonusScreen, ProgrammaScreen, MatchCard });
