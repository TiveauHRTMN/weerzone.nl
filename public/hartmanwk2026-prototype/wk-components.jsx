/* Hartman WK Poule — gedeelde componenten */

// ---------- Vlag (SVG, gedreven door spec in WK.T[code].fl) ----------
function starPath(cx, cy, r, ir) {
  ir = ir || r * 0.382; let p = '';
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + i * Math.PI / 5;
    const rr = i % 2 ? ir : r;
    p += (i ? 'L' : 'M') + (cx + Math.cos(ang) * rr).toFixed(2) + ',' + (cy + Math.sin(ang) * rr).toFixed(2);
  }
  return p + 'Z';
}

function flagBase(base) {
  const [kind, ...rest] = base;
  if (kind === 'solid') return [<rect key="b" x="0" y="0" width="30" height="20" fill={rest[0]} />];
  if (kind === 'h') { const n = rest.length; return rest.map((c, i) => <rect key={i} x="0" y={(i * 20 / n).toFixed(3)} width="30" height={(20 / n + 0.05).toFixed(3)} fill={c} />); }
  if (kind === 'v') { const n = rest.length; return rest.map((c, i) => <rect key={i} x={(i * 30 / n).toFixed(3)} y="0" width={(30 / n + 0.05).toFixed(3)} height="20" fill={c} />); }
  if (kind === 'rep') { const [c1, c2, n] = rest; const out = []; for (let i = 0; i < n; i++) out.push(<rect key={i} x="0" y={(i * 20 / n).toFixed(3)} width="30" height={(20 / n + 0.05).toFixed(3)} fill={i % 2 ? c2 : c1} />); return out; }
  return [];
}

function flagOp(op, i) {
  switch (op.t) {
    case 'r': return <rect key={i} x={op.x} y={op.y} width={op.w} height={op.h} fill={op.c} />;
    case 'p': return <polygon key={i} points={op.d} fill={op.c} />;
    case 'c': return <circle key={i} cx={op.cx} cy={op.cy} r={op.r} fill={op.c || 'none'} stroke={op.stroke} strokeWidth={op.sw} />;
    case 's': return <path key={i} d={starPath(op.cx, op.cy, op.r, op.ir)} fill={op.c || 'none'} stroke={op.stroke} strokeWidth={op.sw} />;
    case 'path': return <path key={i} d={op.d} fill={op.c || 'none'} stroke={op.stroke} strokeWidth={op.sw} />;
    case 'l': return <line key={i} x1={op.x1} y1={op.y1} x2={op.x2} y2={op.y2} stroke={op.c} strokeWidth={op.sw} />;
    default: return null;
  }
}

function Flag({ code, w = 30 }) {
  const team = window.WK.T[code];
  if (!team) return null;
  const fl = team.fl;
  const base = Array.isArray(fl) ? fl : fl.b;
  const ops = Array.isArray(fl) ? [] : (fl.o || []);
  const h = w * 20 / 30;
  return (
    <svg viewBox="0 0 30 20" width={w} height={h} className="team-flag" preserveAspectRatio="xMidYMid slice"
      style={{ borderRadius: 3, display: 'block', flex: '0 0 auto', boxShadow: 'inset 0 0 0 1px rgba(15,40,65,.14)', overflow: 'hidden' }}>
      {flagBase(base)}
      {ops.map(flagOp)}
    </svg>
  );
}

function TeamName({ code }) {
  const team = window.WK.T[code];
  return <span>{team ? team.name : code}</span>;
}

/* Ranglijst toont alleen de voornaam ("Melissa"); pas bij twee dezelfde voornamen
   komt er een achternaam-initiaal bij ("Rowan H."). Volledige naam blijft op de
   eigen kaart, het account en in de WhatsApp-tekst staan. */
function shortName(name, allNames) {
  const parts = String(name || '').trim().split(/\s+/);
  const first = parts[0] || '';
  const dubbel = (allNames || []).filter((n) =>
    (String(n || '').trim().split(/\s+/)[0] || '').toLowerCase() === first.toLowerCase()
  ).length > 1;
  if (!dubbel || parts.length < 2) return first;
  return first + ' ' + parts[parts.length - 1][0].toUpperCase() + '.';
}

// ---------- Weericoon (SVG) ----------
function WeatherIcon({ c, size = 18 }) {
  const s = size;
  const sun = (cx, cy, r, color = '#F6A724') => (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={color} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
        const rad = (a * Math.PI) / 180;
        const x1 = cx + Math.cos(rad) * (r + 1.5), y1 = cy + Math.sin(rad) * (r + 1.5);
        const x2 = cx + Math.cos(rad) * (r + 3.6), y2 = cy + Math.sin(rad) * (r + 3.6);
        return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.4" strokeLinecap="round" />;
      })}
    </g>
  );
  const cloud = (fill = '#C3D3E0') => (
    <path d="M7 17 a4 4 0 0 1 0.4 -7.9 a5 5 0 0 1 9.5 1.2 a3.4 3.4 0 0 1 -0.4 6.7 z" fill={fill} />
  );
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" style={{ display: 'block' }}>
      {c === 'sun' && sun(12, 12, 5.5)}
      {c === 'part' && <g>{sun(8.5, 8.5, 4)}{cloud('#D7E3EC')}</g>}
      {c === 'cloud' && cloud('#B8C8D6')}
      {c === 'rain' && <g>{cloud('#A9BBCB')}
        {[8, 12, 16].map((x, i) => <line key={i} x1={x} y1={18.5} x2={x - 1.5} y2={22} stroke="#5FA8DC" strokeWidth="1.6" strokeLinecap="round" />)}
      </g>}
    </svg>
  );
}

function WeatherChip({ weer }) {
  if (!weer) return null;
  return (
    <span className="weerchip" title="Weer bij de speelstad">
      <WeatherIcon c={weer.c} size={16} />
      <span>{weer.t}°</span>
    </span>
  );
}

// ---------- Avatar (initialen) ----------
function Avatar({ name, me, size = 38, photo }) {
  const palette = ['#1E83C8', '#2E9E8F', '#C77D2E', '#7A6BD6', '#C25B7E', '#3E8E5A', '#5E89B0'];
  const clean = name.replace(/\(.*?\)/g, '').trim();
  const parts = clean.split(' ');
  const initials = (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
  let hash = 0; for (let i = 0; i < clean.length; i++) hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  const bg = me ? 'var(--accent)' : palette[Math.abs(hash) % palette.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg, color: '#fff',
      display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: size * 0.38,
      flex: '0 0 auto', letterSpacing: '.02em', overflow: 'hidden',
      boxShadow: me ? '0 0 0 3px rgba(232,138,40,.22)' : 'none',
    }}>
      {photo ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : initials}
    </div>
  );
}

// ---------- Nav-iconen ----------
function Icon({ name, size = 22, stroke = 'currentColor' }) {
  const p = { fill: 'none', stroke, strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    stand: <g {...p}><path d="M6 20V10M12 20V4M18 20v-7" /></g>,
    ball: <g {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5l3.5 2.6-1.3 4.1h-4.4L8.5 10.1z" /><path d="M12 7.5V4M15.5 10.1l3-1.6M14.2 14.2l1.8 3M9.8 14.2l-1.8 3M8.5 10.1l-3-1.6" /></g>,
    star: <g {...p}><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9z" /></g>,
    cal: <g {...p}><rect x="3.5" y="4.5" width="17" height="16" rx="2.5" /><path d="M3.5 9h17M8 3v3M16 3v3" /></g>,
    groups: <g {...p}><rect x="3.5" y="3.5" width="7" height="7" rx="1.6" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.6" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.6" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.6" /></g>,
    user: <g {...p}><circle cx="12" cy="8.5" r="3.7" /><path d="M5 20a7 7 0 0 1 14 0" /></g>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24">{paths[name]}</svg>;
}

function Delta({ d }) {
  if (d === 0) return null;
  const up = d > 0;
  return <span className={'delta ' + (up ? 'delta-up' : 'delta-down') + (Math.abs(d) >= 3 ? ' delta-jump' : '')}
    title={up ? `${d} plekken gestegen` : `${Math.abs(d)} plekken gezakt`}>
    <svg width="9" height="9" viewBox="0 0 10 10" style={{ display: 'block' }}>
      <path d={up ? 'M5 1L9 7H1z' : 'M5 9L1 3h8z'} fill="currentColor" /></svg>
    <span>{up ? '+' : '-'}{Math.abs(d)}</span>
  </span>;
}

// ---------- Groepsbadge ----------
function GroupBadge({ id, soft }) {
  return <span className={'gbadge' + (soft ? ' gbadge-soft' : '')}>{id === 'KO' ? 'Knock-out' : 'Poule ' + id}</span>;
}

// ---------- Statistiektegel ----------
function StatTile({ label, value, accent, sub }) {
  return (
    <div className="stat-tile">
      <div className="st-value" style={accent ? { color: 'var(--accent)' } : null}>{value}{sub && <span className="st-sub">{sub}</span>}</div>
      <div className="st-label">{label}</div>
    </div>
  );
}

Object.assign(window, { Flag, TeamName, shortName, WeatherIcon, WeatherChip, Avatar, Icon, Delta, GroupBadge, StatTile });
