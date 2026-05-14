import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarDays, Clock, QrCode, Trophy, Users } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureHartmanWkPouleMembership, getGroupStandings } from "@/lib/poule";
import PredictionRow from "@/components/PredictionRow";

type MatchRow = {
  id: string;
  kickoff: string;
  home_team: string;
  away_team: string;
  status: string;
  poule_predictions?: Array<{
    user_id: string;
    home_prediction: number;
    away_prediction: number;
  }>;
};

const TIME_ZONE = "Europe/Amsterdam";

function getDayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDayTitle(date: Date) {
  return date.toLocaleDateString("nl-NL", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("nl-NL", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
}

function hasPrediction(match: MatchRow, userId: string) {
  return match.poule_predictions?.some((prediction) => prediction.user_id === userId) ?? false;
}

export default async function WkPouleDashboard() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/wkpoule/inloggen");

  const { data: profile } = await supabase
    .from("user_profile")
    .select("full_name,email")
    .eq("id", user.id)
    .maybeSingle();

  const group = await ensureHartmanWkPouleMembership(user.id, {
    email: profile?.email || user.email,
    fullName:
      profile?.full_name ||
      (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null),
  });

  if (!group) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-slate-300">De poule kon niet worden geladen.</div>;
  }

  const standings = await getGroupStandings(group.id);
  const currentStanding = standings.find((entry) => entry.user_id === user.id);
  const currentRank = currentStanding ? standings.findIndex((entry) => entry.user_id === user.id) + 1 : null;

  const { data: matches } = await supabase
    .from("poule_matches")
    .select(`
      *,
      poule_predictions (
        user_id,
        home_prediction,
        away_prediction
      )
    `)
    .eq("status", "scheduled")
    .order("kickoff", { ascending: true });

  const matchRows = ((matches ?? []) as MatchRow[]).slice();
  const groupedMatches = matchRows.reduce<Record<string, MatchRow[]>>((groups, match) => {
    const dayKey = getDayKey(new Date(match.kickoff));
    if (!groups[dayKey]) groups[dayKey] = [];
    groups[dayKey].push(match);
    return groups;
  }, {});

  const now = Date.now();
  const daySummaries = Object.entries(groupedMatches)
    .map(([dayKey, dayMatches]) => {
      const firstKickoff = new Date(dayMatches[0].kickoff);
      const isLocked = now >= firstKickoff.getTime();
      const filled = dayMatches.filter((match) => hasPrediction(match, user.id)).length;
      return { dayKey, dayMatches, firstKickoff, isLocked, filled };
    })
    .sort((a, b) => a.firstKickoff.getTime() - b.firstKickoff.getTime());

  const todayKey = getDayKey(new Date());
  const heroDay = daySummaries.find((day) => day.dayKey === todayKey) ?? daySummaries.find((day) => !day.isLocked) ?? daySummaries[0] ?? null;
  const heroMatches = heroDay?.dayMatches.slice(0, 3) ?? [];
  const savedPredictions = matchRows.filter((match) => hasPrediction(match, user.id)).length;
  const predictionProgress = matchRows.length > 0 ? Math.round((savedPredictions / matchRows.length) * 100) : 0;
  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Jij";
  const topFive = standings.slice(0, 5);
  const participantsPreview = standings.slice(0, 12);

  return (
    <div className="text-white">
      <section className="mx-auto max-w-6xl px-3 py-4 sm:px-5 lg:px-6">
        <div className="relative grid overflow-hidden rounded-[28px] border border-white/12 bg-white/[0.075] shadow-[0_22px_80px_rgba(0,0,0,0.34)] backdrop-blur-3xl lg:grid-cols-[0.95fr_1.05fr]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),transparent_32%,rgba(255,255,255,0.05)_72%,transparent_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,#ef4444_0%,#2563eb_50%,#16a34a_100%)]" />

          <div className="relative px-5 py-6 md:px-7 lg:px-8">
            <div className="mb-5 flex items-center gap-2 text-[11px] font-semibold uppercase text-slate-300">
              <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_18px_rgba(239,68,68,0.8)]" />
              <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_18px_rgba(37,99,235,0.8)]" />
              <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_18px_rgba(22,163,74,0.8)]" />
              Canada / USA / Mexico
            </div>

            <h1 className="max-w-3xl text-3xl font-black leading-none text-white sm:text-4xl md:text-5xl">
              Hartman WK 2026
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200 sm:text-base">
              {displayName}, alles wat telt staat direct bovenaan.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={heroDay ? "#speelschema-vandaag" : "#ranking"}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-950 shadow-[0_12px_36px_rgba(255,255,255,0.16)] transition hover:bg-slate-200"
              >
                Vandaag
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/wkpoule/inloggen"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/14 bg-white/[0.07] px-4 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/[0.12]"
              >
                <QrCode className="h-4 w-4 text-blue-300" />
                Login / QR
              </Link>
            </div>

            <div className="mt-6 grid max-w-2xl grid-cols-3 gap-2">
              <div className="rounded-2xl border border-white/12 bg-white/[0.07] p-3 backdrop-blur-2xl">
                <div className="text-xs font-semibold uppercase text-red-300">Plek</div>
                <div className="mt-1 text-2xl font-black text-white sm:text-3xl">{currentRank ? `#${currentRank}` : "-"}</div>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/[0.07] p-3 backdrop-blur-2xl">
                <div className="text-xs font-semibold uppercase text-blue-300">Ingevuld</div>
                <div className="mt-1 text-2xl font-black text-white sm:text-3xl">{predictionProgress}%</div>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/[0.07] p-3 backdrop-blur-2xl">
                <div className="text-xs font-semibold uppercase text-green-300">Spelers</div>
                <div className="mt-1 text-2xl font-black text-white sm:text-3xl">{standings.length}</div>
              </div>
            </div>
          </div>

          <div className="relative flex items-center px-5 pb-5 md:px-7 lg:px-8 lg:py-6">
            <div className="w-full rounded-[24px] border border-white/12 bg-black/18 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.26)] backdrop-blur-3xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-400">Vandaag</div>
                  <div className="mt-1 text-xl font-black text-white sm:text-2xl">
                    {heroDay ? formatDayTitle(heroDay.firstKickoff) : "Geen speeldag"}
                  </div>
                </div>
                <CalendarDays className="h-5 w-5 text-slate-400" />
              </div>

              <div className="mt-4 divide-y divide-white/10">
                {heroMatches.length > 0 ? (
                  heroMatches.map((match) => (
                    <div key={match.id} className="grid grid-cols-[1fr_auto] gap-4 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white sm:text-base">{match.home_team}</div>
                        <div className="mt-1 truncate text-sm text-slate-400">{match.away_team}</div>
                      </div>
                      <div className="text-sm font-semibold text-slate-200">{formatTime(new Date(match.kickoff))}</div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-sm text-slate-400">Geen wedstrijden om te tonen.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-6 px-3 pb-12 sm:px-5 lg:px-6">
        <section id="speelschema-vandaag" className="scroll-mt-24 rounded-[24px] border border-white/10 bg-white/[0.045] p-3 shadow-[0_16px_55px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase text-slate-300">
            <Clock className="h-4 w-4 text-red-400" />
            Speelschema vandaag
          </div>
          <div className="grid gap-3">
            {heroMatches.length > 0 ? (
              heroMatches.map((match) => {
                const prediction = match.poule_predictions?.find((item) => item.user_id === user.id);
                return (
                  <PredictionRow
                    key={match.id}
                    matchId={match.id}
                    homeTeam={match.home_team}
                    awayTeam={match.away_team}
                    kickoffLabel={formatTime(new Date(match.kickoff))}
                    initialHome={prediction?.home_prediction}
                    initialAway={prediction?.away_prediction}
                    locked={heroDay?.isLocked ?? false}
                    lockLabel={heroDay?.isLocked ? "Gesloten" : "Open"}
                  />
                );
              })
            ) : (
              <div className="border border-white/10 px-4 py-8 text-center text-slate-400">
                Geen wedstrijden geladen.
              </div>
            )}
          </div>
        </section>

        <section id="ranking" className="scroll-mt-24 rounded-[24px] border border-white/10 bg-white/[0.045] p-3 shadow-[0_16px_55px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase text-slate-300">
            <Trophy className="h-4 w-4 text-blue-400" />
            Ranking
          </div>
          <div className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
            <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-white/10 bg-black/10">
              <div className="p-4">
                <div className="text-xs font-semibold uppercase text-slate-500">Jij</div>
                <div className="mt-2 text-3xl font-black">{currentRank ? `#${currentRank}` : "-"}</div>
                <div className="mt-1 text-sm text-slate-400">{currentStanding?.total_points ?? 0} punten</div>
              </div>
              <div className="border-x border-white/10 p-4">
                <div className="text-xs font-semibold uppercase text-slate-500">Exact</div>
                <div className="mt-2 text-3xl font-black">{currentStanding?.exact_scores ?? 0}</div>
              </div>
              <div className="p-4">
                <div className="text-xs font-semibold uppercase text-slate-500">Win</div>
                <div className="mt-2 text-3xl font-black">{currentStanding?.correct_winners ?? 0}</div>
              </div>
            </div>
            <div className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-black/10 px-3">
              {topFive.map((entry, index) => (
                <div key={entry.user_id} className="grid grid-cols-[42px_1fr_auto] items-center gap-3 py-3">
                  <div className="text-slate-500">#{index + 1}</div>
                  <div className="min-w-0 truncate font-semibold text-white">{entry.display_name}</div>
                  <div className="font-semibold text-slate-300">{entry.total_points}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="deelnemers" className="scroll-mt-24 rounded-[24px] border border-white/10 bg-white/[0.045] p-3 shadow-[0_16px_55px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase text-slate-300">
            <Users className="h-4 w-4 text-green-400" />
            Deelnemers
          </div>
          <div className="flex flex-wrap gap-2">
            {participantsPreview.map((entry, index) => (
              <span
                key={entry.user_id}
                className={`inline-flex items-center gap-2 border px-3 py-2 text-sm font-semibold ${
                  entry.user_id === user.id ? "border-blue-300/40 text-white" : "border-white/10 text-slate-300"
                }`}
              >
                <span className="text-slate-500">#{index + 1}</span>
                {entry.display_name}
              </span>
            ))}
          </div>
        </section>

        <section id="speelschema-overall" className="scroll-mt-24 rounded-[24px] border border-white/10 bg-white/[0.045] p-3 shadow-[0_16px_55px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase text-slate-300">
            <CalendarDays className="h-4 w-4 text-red-400" />
            Speelschema overall
          </div>
          <div className="space-y-5">
            {daySummaries.length > 0 ? (
              daySummaries.map((day) => (
                <section key={day.dayKey} className="space-y-3">
                  <div>
                    <div className="text-base font-semibold text-white sm:text-lg">{formatDayTitle(day.firstKickoff)}</div>
                    <div className="text-sm text-slate-400">
                      {day.filled}/{day.dayMatches.length} voorspellingen ingevuld
                    </div>
                  </div>
                  <div className="grid gap-3">
                    {day.dayMatches.map((match) => {
                      const prediction = match.poule_predictions?.find((item) => item.user_id === user.id);
                      return (
                        <PredictionRow
                          key={match.id}
                          matchId={match.id}
                          homeTeam={match.home_team}
                          awayTeam={match.away_team}
                          kickoffLabel={formatTime(new Date(match.kickoff))}
                          initialHome={prediction?.home_prediction}
                          initialAway={prediction?.away_prediction}
                          locked={day.isLocked}
                          lockLabel={day.isLocked ? "Gesloten" : "Open"}
                        />
                      );
                    })}
                  </div>
                </section>
              ))
            ) : (
              <div className="border border-white/10 px-4 py-8 text-center text-slate-400">
                Geen wedstrijden op de rol.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

