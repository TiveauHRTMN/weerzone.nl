import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  HARTMANWK_RESULTS_TABLE,
  HARTMANWK_PLAYER_STATS_TABLE,
  HARTMANWK_MEMBERS_TABLE,
  normalizePlayerKey,
} from "@/lib/hartmanwk";
import { HARTMANWK_GROUP_MATCHES, teamName } from "@/lib/hartmanwk-matches";
import { saveResultAction, savePlayerStatAction } from "./actions";

export const dynamic = "force-dynamic";

type PageProps = { searchParams?: Promise<{ token?: string }> };

const wrap: React.CSSProperties = {
  minHeight: "100vh",
  background: "#0D0F12",
  color: "#fff",
  fontFamily: "var(--wkp-font, Inter), system-ui, sans-serif",
  padding: "24px 16px 64px",
};
const card: React.CSSProperties = {
  background: "#23272E",
  border: "1px solid #343A43",
  borderRadius: 14,
  padding: "14px 16px",
};
const input: React.CSSProperties = {
  width: 52,
  background: "#0D0F12",
  border: "1px solid #343A43",
  borderRadius: 8,
  color: "#fff",
  padding: "8px 6px",
  fontSize: 16,
  textAlign: "center",
};
const btn: React.CSSProperties = {
  background: "#3B8EEA",
  border: "none",
  borderRadius: 8,
  color: "#fff",
  fontWeight: 700,
  padding: "8px 14px",
  cursor: "pointer",
};
const label: React.CSSProperties = { fontSize: 11, color: "#8E96A1", display: "block", marginBottom: 3 };

export default async function BeheerPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const token = (sp.token ?? "").trim();
  const expected = process.env.HARTMANWK_ADMIN_TOKEN;
  const authed = Boolean(expected) && token === expected;

  if (!authed) {
    return (
      <div style={wrap}>
        <div style={{ maxWidth: 420, margin: "10vh auto 0", ...card }}>
          <h1 style={{ fontSize: 20, margin: "0 0 4px" }}>Beheer — Hartman WK 2026</h1>
          <p style={{ color: "#8E96A1", fontSize: 14, marginTop: 0 }}>
            {expected
              ? "Voer de beheersleutel in om uitslagen en speler-statjes te beheren."
              : "Beheer is uitgeschakeld: zet eerst HARTMANWK_ADMIN_TOKEN in de omgeving."}
          </p>
          {expected && (
            <form method="get" style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <input
                name="token"
                type="password"
                placeholder="Beheersleutel"
                style={{ ...input, width: "100%", textAlign: "left" }}
                autoComplete="off"
              />
              <button type="submit" style={btn}>Open</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  const admin = createSupabaseAdminClient();
  const [resultsRes, statsRes, membersRes] = await Promise.all([
    admin.from(HARTMANWK_RESULTS_TABLE).select("match_id, home, away"),
    admin.from(HARTMANWK_PLAYER_STATS_TABLE).select("player_key, display_name, goals, assists, minutes, yellow, red"),
    admin.from(HARTMANWK_MEMBERS_TABLE).select("player_pick"),
  ]);

  const resultByMatch = new Map<string, { home: number; away: number }>(
    (resultsRes.data ?? []).map((r) => [r.match_id as string, { home: r.home as number, away: r.away as number }]),
  );
  const statByKey = new Map<string, { display_name: string; goals: number; assists: number; minutes: number; yellow: number; red: number }>(
    (statsRes.data ?? []).map((s) => [
      s.player_key as string,
      {
        display_name: s.display_name as string,
        goals: s.goals as number, assists: s.assists as number, minutes: s.minutes as number,
        yellow: s.yellow as number, red: s.red as number,
      },
    ]),
  );

  // Unieke gekozen spelers (uit deelnemers), met hoeveel deelnemers ze koos.
  const pickCounts = new Map<string, { name: string; count: number }>();
  for (const m of membersRes.data ?? []) {
    const pick = (m.player_pick as string | null)?.trim();
    if (!pick) continue;
    const key = normalizePlayerKey(pick);
    const existing = pickCounts.get(key);
    if (existing) existing.count += 1;
    else pickCounts.set(key, { name: pick, count: 1 });
  }
  const pickedPlayers = [...pickCounts.entries()].sort((a, b) => b[1].count - a[1].count);

  const groups = [...new Set(HARTMANWK_GROUP_MATCHES.map((m) => m.gid))];

  return (
    <div style={wrap}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 2px" }}>Beheer — Hartman WK 2026</h1>
        <p style={{ color: "#8E96A1", fontSize: 13, marginTop: 0 }}>
          Voer hier de echte uitslagen en de statjes van de gekozen sterspelers in. De ranglijst rekent automatisch.
        </p>

        {/* ---------------- Sterspelers ---------------- */}
        <h2 style={{ fontSize: 16, margin: "22px 0 10px" }}>Sterspelers ({pickedPlayers.length})</h2>
        {pickedPlayers.length === 0 ? (
          <div style={{ ...card, color: "#8E96A1", fontSize: 14 }}>Nog geen deelnemer heeft een speler gekozen.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {pickedPlayers.map(([key, { name, count }]) => {
              const s = statByKey.get(key);
              return (
                <form key={key} action={savePlayerStatAction} style={{ ...card }}>
                  <input type="hidden" name="token" value={token} />
                  <input type="hidden" name="player" value={name} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                    <strong style={{ fontSize: 15 }}>{name}</strong>
                    <span style={{ color: "#8E96A1", fontSize: 12 }}>{count} deelnemer{count === 1 ? "" : "s"}</span>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                    {([
                      ["minutes", "Minuten"], ["goals", "Goals"], ["assists", "Assists"],
                      ["yellow", "Geel"], ["red", "Rood"],
                    ] as const).map(([field, lab]) => (
                      <label key={field}>
                        <span style={label}>{lab}</span>
                        <input
                          style={input}
                          name={field}
                          type="number"
                          min={0}
                          defaultValue={s ? (s[field] as number) : 0}
                        />
                      </label>
                    ))}
                    <button type="submit" style={btn}>Opslaan</button>
                  </div>
                </form>
              );
            })}
          </div>
        )}

        {/* ---------------- Uitslagen ---------------- */}
        <h2 style={{ fontSize: 16, margin: "26px 0 10px" }}>Uitslagen groepsfase</h2>
        <div style={{ display: "grid", gap: 18 }}>
          {groups.map((gid) => (
            <div key={gid}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".08em", color: "#8E96A1", marginBottom: 8 }}>
                POULE {gid}
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {HARTMANWK_GROUP_MATCHES.filter((m) => m.gid === gid).map((m) => {
                  const r = resultByMatch.get(m.id);
                  return (
                    <form key={m.id} action={saveResultAction} style={{ ...card, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <input type="hidden" name="token" value={token} />
                      <input type="hidden" name="matchId" value={m.id} />
                      <span style={{ flex: 1, minWidth: 180, fontWeight: 600, fontSize: 14 }}>
                        {teamName(m.home)} <span style={{ color: "#8E96A1" }}>–</span> {teamName(m.away)}
                      </span>
                      <span style={{ color: "#8E96A1", fontSize: 12, width: 64 }}>{m.date.slice(8, 10)}-{m.date.slice(5, 7)} {m.time}</span>
                      <input style={input} name="home" type="number" min={0} defaultValue={r ? r.home : ""} placeholder="-" />
                      <span style={{ color: "#8E96A1" }}>–</span>
                      <input style={input} name="away" type="number" min={0} defaultValue={r ? r.away : ""} placeholder="-" />
                      <button type="submit" style={btn}>{r ? "Bijwerken" : "Opslaan"}</button>
                    </form>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
