"use client";

import { useEffect, useMemo, useState } from "react";
import {
  TEAMS, GROUPS, MATCHES, TABLES, PEOPLE, ROUNDS, POINTS,
  MY_PICKS, MY_FANTASY, POULE_META,
  myMatchPoints, myFantasyPoints, myExact, myPerfect, myScorerHits,
  matchScorerOptions,
  type Match,
} from "@/lib/wkpoule-data";
import { Flag, WeatherChip, Avatar, Icon, Delta, Medal, Progress } from "./primitives";

/* ============================================================ helpers */
const NL_DAYS = ["zo", "ma", "di", "wo", "do", "vr", "za"];
const NL_MONTHS = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
function fmtDate(iso: string) {
  const d = new Date(iso + "T12:00");
  return `${NL_DAYS[d.getDay()]} ${d.getDate()} ${NL_MONTHS[d.getMonth()]}`;
}
/** State die naar localStorage persisteert (SSR-veilig: laadt pas ná mount). */
function usePersisted<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [v, setV] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) setV(JSON.parse(raw) as T);
    } catch {
      /* private mode / quota — val terug op de seed */
    }
    setLoaded(true);
  }, [key]);
  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(v));
    } catch {
      /* negeer schrijf-fouten */
    }
  }, [key, v, loaded]);
  return [v, setV];
}

function useCountUp(target: number, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

type Preds = Record<number, [number, number] | null>;
type ScorerPreds = Record<number, string>;
type JokerByRound = Record<number, number | null>; // round -> match id

const me = PEOPLE.find((p) => p.me)!;
const myRank = PEOPLE.indexOf(me) + 1;
const leader = PEOPLE[0];

// Seed-waarden uit de mock-data; localStorage overschrijft ze na de eerste load.
const SEED_PREDS: Preds = {};
const SEED_SCORER: ScorerPreds = {};
const SEED_FIRST: ScorerPreds = {};
const SEED_JOKER: JokerByRound = {};
MATCHES.forEach((m) => {
  if (m.pred) SEED_PREDS[m.id] = m.pred.slice() as [number, number];
  if (m.predScorer) SEED_SCORER[m.id] = m.predScorer;
  if (m.predFirst) SEED_FIRST[m.id] = m.predFirst;
});
[1, 2, 3].forEach((r) => {
  const jm = MATCHES.find((m) => m.round === r && m.joker);
  SEED_JOKER[r] = jm ? jm.id : null;
});

const STORAGE_PREFIX = "hwk26.";

/* ============================================================ App shell */
type Tab = "dashboard" | "voorspellen" | "ranglijst" | "poules" | "profiel";

export default function PouleApp() {
  const [auth, setAuth] = usePersisted<"in" | "out">(STORAGE_PREFIX + "auth", "out");
  const [tab, setTab] = useState<Tab>("dashboard");

  // voorspel-state — persisteert lokaal naar localStorage
  const [preds, setPreds] = usePersisted<Preds>(STORAGE_PREFIX + "preds", SEED_PREDS);
  const [scorer, setScorer] = usePersisted<ScorerPreds>(STORAGE_PREFIX + "scorer", SEED_SCORER);
  const [first, setFirst] = usePersisted<ScorerPreds>(STORAGE_PREFIX + "first", SEED_FIRST);
  const [joker, setJoker] = usePersisted<JokerByRound>(STORAGE_PREFIX + "joker", SEED_JOKER);
  const [saved, setSaved] = usePersisted<Record<number, boolean>>(STORAGE_PREFIX + "saved", {});
  const [champion, setChampion] = usePersisted<string>(STORAGE_PREFIX + "champion", MY_PICKS.champion);
  const [modal, setModal] = useState<null | "champion">(null);

  if (auth === "out") {
    return <Landing onEnter={() => setAuth("in")} />;
  }

  const myTotalLive = myMatchPoints + myFantasyPoints;
  const toLeader = leader.pts - me.pts;

  return (
    <div className="wkp wkp-app">
      <header className="wkp-hdr">
        <div className="wkp-hdr-top">
          <button className="wkp-brand" onClick={() => setTab("dashboard")}>
            <LogoMark />
            <span className="wkp-wm">
              <span className="wkp-wm-main">HARTMAN WK&nbsp;2026</span>
              <span className="wkp-wm-sub">Poule · familie &amp; vrienden</span>
            </span>
          </button>
          <button className="wkp-acct" onClick={() => setTab("profiel")}>
            <span className="wkp-acct-meta">
              <span className="wkp-acct-rank">#{myRank} · {me.pts} pt</span>
              <span className="wkp-acct-pts">Tom</span>
            </span>
            <Avatar name={me.name} me size={34} />
          </button>
        </div>
        <nav className="wkp-nav">
          {([
            ["dashboard", "Dashboard", "stand"],
            ["voorspellen", "Voorspellen", "ball"],
            ["ranglijst", "Ranglijst", "trophy"],
            ["poules", "Poules", "groups"],
            ["profiel", "Profiel", "user"],
          ] as const).map(([k, label, icon]) => (
            <button key={k} className={"wkp-tab" + (tab === k ? " wkp-tab-on" : "")} onClick={() => setTab(k as Tab)}>
              <Icon name={icon} size={17} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className="wkp-content">
        {tab === "dashboard" && (
          <Dashboard total={myTotalLive} toLeader={toLeader} champion={champion} onPick={() => setModal("champion")} onTab={setTab} joker={joker} />
        )}
        {tab === "voorspellen" && (
          <Voorspellen preds={preds} setPreds={setPreds} scorer={scorer} setScorer={setScorer} first={first} setFirst={setFirst} joker={joker} setJoker={setJoker} saved={saved} setSaved={setSaved} />
        )}
        {tab === "ranglijst" && <Ranglijst />}
        {tab === "poules" && <Poules />}
        {tab === "profiel" && <Profiel total={myTotalLive} champion={champion} onLogout={() => setAuth("out")} />}
      </main>

      <footer className="wkp-foot">Hartman WK Poule · WK 2026 · verdwijnt weer na de finale</footer>

      {modal === "champion" && (
        <ChampionModal current={champion} onPick={(c) => { setChampion(c); setModal(null); }} onClose={() => setModal(null)} />
      )}
    </div>
  );
}

/* ============================================================ Dashboard */
function Dashboard({ total, toLeader, champion, onPick, onTab, joker }: {
  total: number; toLeader: number; champion: string; onPick: () => void; onTab: (t: Tab) => void; joker: JokerByRound;
}) {
  const count = useCountUp(total);
  const upcoming = MATCHES.filter((m) => m.status === "open").sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 4);
  const fantasyTotal = MY_FANTASY.reduce((s, p) => s + p.total, 0);
  const openJokerRound = [1, 2, 3].find((r) => joker[r] == null);

  return (
    <div className="wkp-screen">
      <div className="wkp-hero">
        <div className="wkp-hero-eyebrow"><span className="livedot" style={{ background: "var(--crimson)" }} />Jouw totaalscore</div>
        <div className="wkp-hero-rank">
          <div className="wkp-hero-big">{count.toLocaleString("nl-NL")}<small> pt</small></div>
          <div className="wkp-hero-rankside">
            <div className="wkp-hero-pos">{myRank}<span>e</span></div>
            <div className="wkp-hero-pos-l">van {PEOPLE.length}</div>
          </div>
        </div>
        <div className="wkp-hero-bar">
          <div className="wkp-hero-bar-top"><span>Naar plek 1</span><span><strong>{toLeader}</strong> punten</span></div>
          <Progress value={me.pts} max={leader.pts} tone="crimson" />
        </div>
      </div>

      <div className="wkp-stats">
        <Stat v={`+${me.rond}`} l="Deze ronde" />
        <Stat v={myExact} l="Voltreffers" />
        <Stat v={myPerfect} l="Perfect Match" />
        <Stat v={fantasyTotal} l="Fantasy-pt" />
      </div>

      <div className="wkp-picks">
        <div className="wkp-card wkp-pick">
          <div className="wkp-pick-l"><Icon name="trophy" size={13} />Wereldkampioen</div>
          <div className="wkp-pick-main">
            <Flag code={champion} w={34} />
            <div>
              <div className="wkp-pick-name">{TEAMS[champion].name}</div>
              <div className="wkp-pick-sub">Goed = +{POINTS.champion} pt</div>
            </div>
          </div>
          <button className="wkp-pick-edit" onClick={onPick}>Wijzig keuze</button>
        </div>
        <div className="wkp-card wkp-pick">
          <div className="wkp-pick-l"><Icon name="fantasy" size={13} />Fantasy-selectie</div>
          <div className="wkp-pick-main">
            <div style={{ display: "flex" }}>
              {MY_FANTASY.map((p, i) => (
                <span key={p.name} style={{ marginLeft: i ? -8 : 0 }}><Flag code={p.team} w={26} /></span>
              ))}
            </div>
            <div>
              <div className="wkp-pick-name">{MY_FANTASY.length} spelers</div>
              <div className="wkp-pick-sub">{MY_FANTASY.map((p) => p.name.split(" ").slice(-1)[0]).join(" · ")}</div>
            </div>
            <div className="wkp-pick-pts">+{fantasyTotal}</div>
          </div>
          <button className="wkp-pick-edit" onClick={() => onTab("profiel")}>Bekijk punten</button>
        </div>
      </div>

      <div className="wkp-card wkp-joker-card">
        <div className="wkp-joker-ic">×2</div>
        <div className="wkp-joker-txt">
          <div className="wkp-joker-title">Joker</div>
          <div className="wkp-joker-sub">{openJokerRound ? `Nog beschikbaar in speelronde ${openJokerRound} — verdubbelt al je punten.` : "Alle jokers van deze speelrondes zijn ingezet."}</div>
        </div>
        <span className={"wkp-joker-badge " + (openJokerRound ? "wkp-joker-open" : "wkp-joker-used")}>{openJokerRound ? "beschikbaar" : "ingezet"}</span>
      </div>

      <div className="wkp-sec-label">Komende wedstrijden</div>
      <div className="wkp-card wkp-up">
        {upcoming.map((m) => (
          <button key={m.id} className="wkp-up-row" onClick={() => onTab("voorspellen")} style={{ textAlign: "left", background: "none", border: "none", borderBottom: "1px solid var(--line-soft)", cursor: "pointer", width: "100%" }}>
            <Flag code={m.h} w={22} />
            <span className="wkp-up-teams">{TEAMS[m.h].name} <span className="vs">–</span> {TEAMS[m.a].name}</span>
            <span className="wkp-up-meta"><WeatherChip weer={m.weer} /><span className="wkp-up-time">{m.time}</span></span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Stat({ v, l }: { v: React.ReactNode; l: string }) {
  return (
    <div className="wkp-stat">
      <div className="wkp-stat-v">{v}</div>
      <div className="wkp-stat-l">{l}</div>
    </div>
  );
}

/* ============================================================ Voorspellen */
function Voorspellen(props: {
  preds: Preds; setPreds: React.Dispatch<React.SetStateAction<Preds>>;
  scorer: ScorerPreds; setScorer: React.Dispatch<React.SetStateAction<ScorerPreds>>;
  first: ScorerPreds; setFirst: React.Dispatch<React.SetStateAction<ScorerPreds>>;
  joker: JokerByRound; setJoker: React.Dispatch<React.SetStateAction<JokerByRound>>;
  saved: Record<number, boolean>; setSaved: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
}) {
  const { preds, joker } = props;
  const [filter, setFilter] = useState("alles");
  const chips = useMemo(() => [
    { k: "alles", label: "Alles" },
    { k: "open", label: "Te voorspellen" },
    { k: "NED", label: "Nederland" },
    ...GROUPS.map((g) => ({ k: "g" + g.id, label: "Poule " + g.id })),
  ], []);
  const match = (m: Match) => {
    if (filter === "alles") return true;
    if (filter === "open") return m.status === "open";
    if (filter === "NED") return m.h === "NED" || m.a === "NED";
    if (filter[0] === "g") return m.gid === filter.slice(1);
    return true;
  };
  const todo = MATCHES.filter((m) => m.status === "open" && !preds[m.id]).length;

  return (
    <div className="wkp-screen">
      {todo > 0 && (
        <div className="wkp-nudge"><strong>{todo} wedstrijd{todo > 1 ? "en" : ""}</strong> nog niet voorspeld — vul ze in vóór de aftrap.</div>
      )}
      <div className="wkp-chips">
        {chips.map((c) => (
          <button key={c.k} className={"wkp-chip" + (filter === c.k ? " wkp-chip-on" : "")} onClick={() => setFilter(c.k)}>{c.label}</button>
        ))}
      </div>
      {ROUNDS.map((rd) => {
        const ms = MATCHES.filter((m) => m.round === rd.n && match(m));
        if (!ms.length) return null;
        const jokerUsedThisRound = joker[rd.n] != null;
        return (
          <div key={rd.n} className="wkp-mgroup">
            <div className="wkp-mgroup-h"><span>{rd.label}</span><span className="wkp-mgroup-sub">{rd.sub}</span></div>
            {ms.map((m) => <MatchCard key={m.id} m={m} {...props} jokerHere={joker[rd.n] === m.id} jokerUsedThisRound={jokerUsedThisRound} />)}
          </div>
        );
      })}
    </div>
  );
}

function ScoreBox({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div className="scorebox">
      <button className="sb-step" onClick={() => onChange(Math.min(9, (value || 0) + 1))} aria-label="meer">+</button>
      <div className="sb-val">{value === null || value === undefined ? "–" : value}</div>
      <button className="sb-step" onClick={() => onChange(Math.max(0, (value || 0) - 1))} aria-label="minder">−</button>
    </div>
  );
}

function ScorerSelect({ m, value, onChange, label, hint }: { m: Match; value: string; onChange: (v: string) => void; label: string; hint?: string }) {
  const groups = matchScorerOptions(m);
  return (
    <label className="wkp-field">
      <span className="wkp-field-l">{label}{hint && <b>{hint}</b>}</span>
      <select className="wkp-select" value={value || ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">— kies speler —</option>
        {groups.map((g) => (
          <optgroup key={g.team} label={TEAMS[g.team].name}>
            {g.players.map((p) => <option key={p} value={p}>{p}</option>)}
          </optgroup>
        ))}
      </select>
    </label>
  );
}

function MatchCard({ m, preds, setPreds, scorer, setScorer, first, setFirst, setJoker, saved, setSaved, jokerHere, jokerUsedThisRound }: {
  m: Match;
  preds: Preds; setPreds: React.Dispatch<React.SetStateAction<Preds>>;
  scorer: ScorerPreds; setScorer: React.Dispatch<React.SetStateAction<ScorerPreds>>;
  first: ScorerPreds; setFirst: React.Dispatch<React.SetStateAction<ScorerPreds>>;
  joker: JokerByRound; setJoker: React.Dispatch<React.SetStateAction<JokerByRound>>;
  saved: Record<number, boolean>; setSaved: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  jokerHere: boolean; jokerUsedThisRound: boolean;
}) {
  const done = m.status === "done";
  const live = m.status === "live";
  const open = m.status === "open";
  const p = preds[m.id] || [null, null];
  const hasPred = p[0] !== null && p[0] !== undefined;
  const isSaved = saved[m.id];
  const markUnsaved = () => setSaved((s) => (s[m.id] ? { ...s, [m.id]: false } : s));
  const setP = (val: [number | null, number | null]) => { setPreds((s) => ({ ...s, [m.id]: val as [number, number] })); markUnsaved(); };

  const toggleJoker = () => {
    if (jokerUsedThisRound && !jokerHere) return; // al ergens anders ingezet
    setJoker((s) => ({ ...s, [m.round]: jokerHere ? null : m.id }));
    markUnsaved();
  };

  return (
    <div className={"wkp-match" + (live ? " wkp-match-live" : "") + (open && !hasPred ? " wkp-match-todo" : "")}>
      <div className="wkp-match-top">
        <span className="gbadge">Poule {m.gid}</span>
        <span className="wkp-match-place">
          {(jokerHere || m.joker) && <span className="wkp-jokerflag">★ Joker ×2</span>}
          <WeatherChip weer={m.weer} /><span className="wkp-match-city">{m.city}</span>
        </span>
      </div>

      <div className="wkp-match-body">
        <div className="wkp-team wkp-team-h">
          <span className="wkp-team-name">{TEAMS[m.h].name}</span>
          <Flag code={m.h} w={32} />
        </div>
        <div className="wkp-score-zone">
          {done || live ? (
            <div className="wkp-result"><span>{m.result![0]}</span><span className="rdash">-</span><span>{m.result![1]}</span></div>
          ) : (
            <div className="wkp-predict">
              <ScoreBox value={p[0]} onChange={(x) => setP([x, p[1] ?? 0])} />
              <span className="rdash">-</span>
              <ScoreBox value={p[1]} onChange={(x) => setP([p[0] ?? 0, x])} />
            </div>
          )}
          {live && <span className="liveflag"><span className="livedot" />live {m.min}&apos;</span>}
          {open && <span className="openflag">{m.time}</span>}
        </div>
        <div className="wkp-team">
          <Flag code={m.a} w={32} />
          <span className="wkp-team-name">{TEAMS[m.a].name}</span>
        </div>
      </div>

      {/* breakdown chips voor gespeelde wedstrijden */}
      {done && m.breakdown && (
        <div className="wkp-bd">
          {m.breakdown.exact > 0 && <span className="wkp-bd-chip"><b>+{m.breakdown.exact}</b> exact</span>}
          {m.breakdown.toto > 0 && <span className="wkp-bd-chip"><b>+{m.breakdown.toto}</b> winnaar</span>}
          {m.breakdown.goalsA > 0 && <span className="wkp-bd-chip"><b>+{m.breakdown.goalsA}</b> goals {TEAMS[m.h].name.slice(0, 3)}</span>}
          {m.breakdown.goalsB > 0 && <span className="wkp-bd-chip"><b>+{m.breakdown.goalsB}</b> goals {TEAMS[m.a].name.slice(0, 3)}</span>}
          {m.breakdown.scorer > 0 && <span className="wkp-bd-chip"><b>+{m.breakdown.scorer}</b> doelpuntenmaker</span>}
          {m.breakdown.first > 0 && <span className="wkp-bd-chip"><b>+{m.breakdown.first}</b> 1e goal</span>}
          {m.breakdown.jokerBonus > 0 && <span className="wkp-bd-chip"><b>×2</b> joker</span>}
        </div>
      )}

      {/* invoervelden voor open wedstrijden */}
      {open && (
        <div className="wkp-predfields">
          <div className="wkp-field-row">
            <ScorerSelect m={m} value={scorer[m.id] || ""} onChange={(v) => { setScorer((s) => ({ ...s, [m.id]: v })); markUnsaved(); }} label="Doelpuntenmaker" hint="+35" />
            <ScorerSelect m={m} value={first[m.id] || ""} onChange={(v) => { setFirst((s) => ({ ...s, [m.id]: v })); markUnsaved(); }} label="1e doelpuntenmaker" hint="+75" />
          </div>
          <div className="wkp-pred-foot">
            <div className="wkp-jokertoggle">
              <button
                className={"switch" + (jokerHere ? " switch-on" : "") + (jokerUsedThisRound && !jokerHere ? " switch-disabled" : "")}
                onClick={toggleJoker}
                aria-pressed={jokerHere}
                disabled={jokerUsedThisRound && !jokerHere}
              >
                <span className="switch-knob" />
              </button>
              <span className="wkp-jokertoggle-l">
                <b>Joker ×2</b>
                <span>{jokerUsedThisRound && !jokerHere ? "al ingezet deze ronde" : "verdubbelt deze wedstrijd"}</span>
              </span>
            </div>
            <button
              className={"wkp-save" + (isSaved ? " wkp-save-done" : "")}
              onClick={() => setSaved((s) => ({ ...s, [m.id]: true }))}
            >
              {isSaved ? "✓ Opgeslagen" : "Opslaan"}
            </button>
          </div>
        </div>
      )}

      <div className="wkp-match-foot">
        <span className="wkp-yourpred">
          {done || live ? <>Jouw inzet: <strong>{p[0] ?? "–"}-{p[1] ?? "–"}</strong></>
            : hasPred ? <>Voorspeld: <strong>{p[0]}-{p[1]}</strong></>
            : <span className="todo-text">Nog niet voorspeld</span>}
        </span>
        {done && m.breakdown && (
          <span className={"ptpill " + (m.breakdown.perfect > 0 ? "pt-perfect" : m.breakdown.exact > 0 ? "pt-exact" : m.breakdown.total > 0 ? "pt-some" : "pt-miss")}>
            {m.breakdown.perfect > 0 ? "PERFECT · " : ""}{m.breakdown.total} pt
          </span>
        )}
        {live && <span className="ptpill pt-live">telt nog mee</span>}
      </div>
    </div>
  );
}

/* ============================================================ Ranglijst */
function Ranglijst() {
  const podium = PEOPLE.slice(0, 3);
  const order = [podium[1], podium[0], podium[2]];
  return (
    <div className="wkp-screen">
      <p className="wkp-intro">De <strong>totaalscore</strong> telt wedstrijdpunten, bonussen, joker, kampioen en fantasy-spelerpunten op. Wie bovenaan staat na de finale, wint.</p>
      <div className="wkp-podium">
        {order.map((pp) => {
          const rank = (pp === podium[0] ? 1 : pp === podium[1] ? 2 : 3) as 1 | 2 | 3;
          return (
            <div key={pp.name} className={"wkp-pod wkp-pod-" + rank}>
              <Medal rank={rank} />
              <Avatar name={pp.name} me={pp.me} size={rank === 1 ? 54 : 44} />
              <div className="wkp-pod-name">{pp.name}</div>
              <div className="wkp-pod-pts">{pp.pts}<span>pt</span></div>
              <div className="wkp-pod-base"><span className="wkp-pod-rank">{rank}</span></div>
            </div>
          );
        })}
      </div>
      <div className="wkp-lb">
        {PEOPLE.map((pp, i) => (
          <div key={pp.name} className={"wkp-lb-row" + (pp.me ? " wkp-lb-me" : "")}>
            <span className="wkp-lb-rank">{i < 3 ? <Medal rank={(i + 1) as 1 | 2 | 3} /> : i + 1}<Delta d={pp.d} /></span>
            <span className="wkp-lb-id">
              <Avatar name={pp.name} me={pp.me} size={36} />
              <span className="wkp-lb-idtext">
                <span className="wkp-lb-name">{pp.name}</span>
                <span className="wkp-lb-meta">
                  <span className="wkp-lb-chip"><Flag code={pp.champion} w={16} />{TEAMS[pp.champion].name}</span>
                  <span>·</span>
                  <span>{pp.fantasy} fantasy</span>
                </span>
              </span>
            </span>
            <span className="wkp-lb-right">
              <div className="wkp-lb-pts">{pp.pts}</div>
              <div className="wkp-lb-fantasy">{pp.exact} voltreffers</div>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================ Poules */
function Poules() {
  return (
    <div className="wkp-screen">
      <p className="wkp-intro">Stand van de poulefase. De <strong>bovenste twee</strong> van elke groep gaan door naar de knock-outs.</p>
      <div className="wkp-poule-grid">
        {GROUPS.map((g) => {
          const rows = TABLES[g.id];
          const sp = Math.max(...rows.map((r) => r.sp));
          return (
            <div key={g.id} className="wkp-card wkp-poule">
              <div className="wkp-poule-h">
                <span className="gbadge">Poule {g.id}</span>
                <span className="wkp-poule-meta">{sp > 0 ? `na ${sp} speelronde${sp === 1 ? "" : "s"}` : "nog niet begonnen"}</span>
              </div>
              <div className="ptable">
                <div className="ptrow pthead">
                  <span className="pt-pos">#</span><span className="pt-team">team</span>
                  <span className="pt-n">sp</span><span className="pt-n">+/-</span><span className="pt-pts">pt</span>
                </div>
                {rows.map((r, i) => (
                  <div key={r.code} className={"ptrow" + (i < 2 ? " pt-qual" : "")}>
                    <span className="pt-pos">{i + 1}</span>
                    <span className="pt-team"><Flag code={r.code} w={22} /><span>{TEAMS[r.code].name}</span></span>
                    <span className="pt-n">{r.sp}</span>
                    <span className="pt-n">{r.saldo > 0 ? "+" + r.saldo : r.saldo}</span>
                    <span className="pt-pts">{r.pt}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================ Profiel */
function Profiel({ total, champion, onLogout }: { total: number; champion: string; onLogout: () => void }) {
  const bonusPts = MATCHES.reduce((s, m) => s + (m.breakdown ? m.breakdown.scorer + m.breakdown.first + m.breakdown.perfect : 0), 0);
  const jokerPts = MATCHES.reduce((s, m) => s + (m.breakdown ? m.breakdown.jokerBonus : 0), 0);
  const basePts = myMatchPoints - bonusPts - jokerPts;
  const history = MATCHES.filter((m) => m.status === "done" && m.pred).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  return (
    <div className="wkp-screen">
      <div className="wkp-card wkp-prof-head">
        <Avatar name="Tom" me size={60} />
        <div className="wkp-prof-id">
          <div className="wkp-prof-name">Tom Hartman</div>
          <div className="wkp-prof-mail">tom@hartman.nl</div>
          <div className="wkp-prof-since">Lid sinds juni 2026 · code {POULE_META.code}</div>
        </div>
        <div className="wkp-prof-rank">
          <div className="wkp-prof-rank-v">{myRank}<span>e</span></div>
          <div className="wkp-prof-rank-l">{total} punten</div>
        </div>
      </div>

      <div className="wkp-sec-label">Puntenoverzicht</div>
      <div className="wkp-card wkp-breakdown">
        <BdRow icon="ball" l="Wedstrijdvoorspellingen" v={basePts} />
        <BdRow icon="star" l="Bonus (makers · perfect)" v={bonusPts} />
        <BdRow icon="x2" l="Jokerpunten" v={jokerPts} />
        <BdRow icon="fan" l="Fantasy-spelerpunten" v={myFantasyPoints} />
        <BdRow icon="cup" l={`Wereldkampioen (${TEAMS[champion].name})`} pending="nog te verdienen" />
        <div className="wkp-bd-row total">
          <span className="wkp-bd-l">Totaalscore</span>
          <span className="wkp-bd-v">{total} pt</span>
        </div>
      </div>

      <div className="wkp-sec-label">Fantasy-spelers</div>
      <div className="wkp-card wkp-fan">
        {MY_FANTASY.map((p) => (
          <div key={p.name} className="wkp-fan-row">
            <div className="wkp-fan-top">
              <Flag code={p.team} w={26} />
              <span className="wkp-fan-name">{p.name}</span>
              <span className="wkp-fan-pts">{p.total > 0 ? "+" : ""}{p.total} pt</span>
            </div>
            <div className="wkp-fan-ev">
              {p.events.map((e) => (
                <span key={e.label} className={"wkp-fan-chip" + (e.per < 0 ? " neg" : "")}>
                  {e.label}: {e.n}× <b>{e.per > 0 ? "+" : ""}{e.n * e.per}</b>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="wkp-sec-label">Historie voorspellingen · {myScorerHits} bonustreffers</div>
      <div className="wkp-card wkp-hist">
        {history.map((m) => (
          <div key={m.id} className="wkp-hist-row">
            <Flag code={m.h} w={20} />
            <span className="wkp-hist-match"><span>{TEAMS[m.h].name} – {TEAMS[m.a].name}</span></span>
            <span className="wkp-hist-score">{m.pred![0]}-{m.pred![1]} <span style={{ color: "var(--ink-faint)" }}>/ {m.result![0]}-{m.result![1]}</span></span>
            <span className={"ptpill " + (m.breakdown!.perfect > 0 ? "pt-perfect" : m.breakdown!.exact > 0 ? "pt-exact" : m.breakdown!.total > 0 ? "pt-some" : "pt-miss")}>{m.breakdown!.total}</span>
          </div>
        ))}
      </div>

      <button className="wkp-share">Uitnodiging delen · {POULE_META.code}</button>
      <button
        className="wkp-reset"
        onClick={() => {
          try {
            Object.keys(window.localStorage).filter((k) => k.startsWith(STORAGE_PREFIX)).forEach((k) => window.localStorage.removeItem(k));
          } catch { /* negeer */ }
          window.location.reload();
        }}
      >
        Lokale voorspellingen wissen
      </button>
      <button className="wkp-logout" onClick={onLogout}>Uitloggen</button>
    </div>
  );
}

function BdRow({ icon, l, v, pending }: { icon: string; l: string; v?: number; pending?: string }) {
  const glyph: Record<string, string> = { ball: "⚽", star: "★", x2: "×2", fan: "✦", cup: "🏆" };
  return (
    <div className="wkp-bd-row">
      <span className="wkp-bd-l"><span className="wkp-bd-ic">{glyph[icon]}</span>{l}</span>
      {pending ? <span className="wkp-bd-v pending">{pending}</span> : <span className="wkp-bd-v pos">+{v}</span>}
    </div>
  );
}

/* ============================================================ Champion modal */
function ChampionModal({ current, onPick, onClose }: { current: string; onPick: (c: string) => void; onClose: () => void }) {
  const codes = GROUPS.flatMap((g) => g.teams);
  return (
    <div className="wkp-modal-bg" onClick={onClose}>
      <div className="wkp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wkp-modal-h">
          <div>
            <div className="wkp-modal-title">Wereldkampioen</div>
            <div className="wkp-pick-sub">Kies wie het WK wint — goed = +{POINTS.champion} punten.</div>
          </div>
          <button className="wkp-modal-x" onClick={onClose}>✕</button>
        </div>
        <div className="wkp-teamgrid">
          {codes.map((c) => (
            <button key={c} className={"wkp-teamopt" + (c === current ? " wkp-teamopt-on" : "")} onClick={() => onPick(c)}>
              <Flag code={c} w={26} />{TEAMS[c].name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================ Landing (logged out) */
function Landing({ onEnter }: { onEnter: () => void }) {
  const [showAuth, setShowAuth] = useState(false);
  if (showAuth) return <LoginScreen onLogin={onEnter} onBack={() => setShowAuth(false)} />;
  return (
    <div className="wkp wkp-landing">
      <section className="wkp-land-hero">
        <div className="wkp-land-bunting" />
        <div className="wkp-land-logo"><LogoMark size={76} /></div>
        <div className="wkp-land-kicker">Familie &amp; vrienden · WK 2026</div>
        <h1 className="wkp-land-title">Hartman WK Poule</h1>
        <p className="wkp-land-sub">Voorspel elke wedstrijd, kies je wereldkampioen en fantasy-spelers, zet je joker in en stijg in het klassement. 48 landen, 12 poules, één winnaar.</p>
        <div className="wkp-land-hosts"><Flag code="USA" w={30} /><Flag code="CAN" w={30} /><Flag code="MEX" w={30} /></div>
        <div className="wkp-land-cta">
          <button className="wkp-btn wkp-btn-primary" onClick={() => setShowAuth(true)}>Inloggen / Aanmelden</button>
          <button className="wkp-btn wkp-btn-ghost" onClick={() => setShowAuth(true)}>Poule maken</button>
        </div>
      </section>

      <section className="wkp-land-points">
        <div className="wkp-land-points-h">Zo verdien je punten</div>
        <div className="wkp-land-points-s">Hoe scherper je voorspelt, hoe sneller je stijgt.</div>
        <div className="wkp-pgrid">
          <PCard v={`+${POINTS.exact}`} l="Exacte uitslag" tone="crimson" />
          <PCard v={`+${POINTS.toto}`} l="Juiste winnaar of gelijkspel" />
          <PCard v={`+${POINTS.goalA}`} l="Correct aantal goals per ploeg" />
          <PCard v={`+${POINTS.scorer}`} l="Correcte doelpuntenmaker" />
          <PCard v={`+${POINTS.first}`} l="Correcte 1e doelpuntenmaker" />
          <PCard v={`+${POINTS.perfect}`} l="Perfect Match bonus" tone="gold" />
          <PCard v="×2" l="Joker — 1 per speelronde" tone="crimson" />
          <PCard v={`+${POINTS.champion}`} l="Wereldkampioen correct" tone="gold" />
        </div>
      </section>
      <footer className="wkp-foot">Hartman WK Poule · besloten · verdwijnt weer na de finale</footer>
    </div>
  );
}

function PCard({ v, l, tone }: { v: string; l: string; tone?: "crimson" | "gold" }) {
  return (
    <div className="wkp-pcard">
      <div className={"wkp-pcard-v" + (tone ? " " + tone : "")}>{v}</div>
      <div className="wkp-pcard-l">{l}</div>
    </div>
  );
}

/* ============================================================ Login */
function LoginScreen({ onLogin, onBack }: { onLogin: () => void; onBack: () => void }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [f, setF] = useState({ naam: "", email: "", pw: "", code: "" });
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  const up = mode === "up";
  return (
    <div className="wkp wkp-auth-stage">
      <div className="wkp-auth-card">
        <button className="wkp-back" onClick={onBack}>← Terug</button>
        <div className="wkp-auth-title">HARTMAN<span>WK 2026 POULE</span></div>
        <div className="wkp-auth-bar" />
        <p className="wkp-auth-intro">{up ? "Maak een account en doe mee met de familiepoule voor het WK 2026." : "Log in om je voorspellingen te beheren en de stand te volgen."}</p>
        <div className="wkp-auth-toggle">
          <button className={"wkp-auth-tg" + (!up ? " on" : "")} onClick={() => setMode("in")}>Inloggen</button>
          <button className={"wkp-auth-tg" + (up ? " on" : "")} onClick={() => setMode("up")}>Aanmelden</button>
        </div>
        <div className="wkp-auth-form">
          {up && <Field label="Naam" value={f.naam} onChange={set("naam")} placeholder="Tom Hartman" />}
          <Field label="E-mail" type="email" value={f.email} onChange={set("email")} placeholder="tom@hartman.nl" />
          <Field label="Wachtwoord" type="password" value={f.pw} onChange={set("pw")} placeholder="••••••••" />
          {up && <Field label="Poulecode" value={f.code} onChange={set("code")} placeholder={POULE_META.code} />}
        </div>
        <button className="wkp-auth-submit" onClick={onLogin}>{up ? "Account aanmaken" : "Inloggen"}</button>
        <div className="wkp-auth-foot">
          {up ? <>Heb je al een account? <button className="wkp-auth-link" onClick={() => setMode("in")}>Inloggen</button></>
            : <>Nog geen account? <button className="wkp-auth-link" onClick={() => setMode("up")}>Aanmelden</button></>}
        </div>
        <div className="wkp-auth-note">Alleen op uitnodiging van de poulebeheerder.</div>
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange, placeholder }: { label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="field">
      <span className="field-l">{label}</span>
      <input className="field-i" type={type || "text"} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

/* ============================================================ Logo */
function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg className="wkp-logo" width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="var(--crimson)" />
      <circle cx="13" cy="12.5" r="5" fill="#FBC65A" />
      <path d="M9 20.5 a3.4 3.4 0 0 1 .3 -6.7 a4.4 4.4 0 0 1 8.4 1 a3 3 0 0 1 -.4 5.7z" fill="#fff" />
      <circle cx="21.5" cy="21" r="4.4" fill="#0f3a57" stroke="#fff" strokeWidth="1.2" />
      <path d="M21.5 18.4l1.9 1.4-.7 2.2h-2.4l-.7-2.2z" fill="#fff" />
    </svg>
  );
}
