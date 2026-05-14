import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type FIFAName = { Description?: string };
type FIFAMatch = {
  IdMatch: number;
  MatchNumber: number;
  Date: string;
  Home?: { TeamName?: FIFAName[]; Abbreviation?: string };
  Away?: { TeamName?: FIFAName[]; Abbreviation?: string };
  PlaceHolderA?: string;
  PlaceHolderB?: string;
};

const FIFA_COMPETITION_ID = 17;
const FIFA_SEASON_URL =
  "https://api.fifa.com/api/v3/seasons?idCompetition=17&from=2026-06-01T00:00:00Z&to=2026-07-31T23:59:59Z&language=en";

async function fetchFifaSeasonId() {
  const response = await fetch(FIFA_SEASON_URL);
  if (!response.ok) {
    throw new Error(`FIFA season lookup failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  const seasons = Array.isArray(payload?.Results) ? payload.Results : [];
  const season = seasons.find((entry: { Name?: FIFAName[] }) =>
    entry?.Name?.some((name) => String(name?.Description || "").includes("World Cup 2026")),
  ) ?? seasons[0];

  if (!season?.IdSeason) {
    throw new Error("No FIFA World Cup 2026 season found.");
  }

  return Number(season.IdSeason);
}

async function fetchFifaMatches(seasonId: number) {
  const url =
    `https://api.fifa.com/api/v3/calendar/matches?idCompetition=${FIFA_COMPETITION_ID}` +
    `&idSeason=${seasonId}&from=2026-06-01T00:00:00Z&to=2026-07-31T23:59:59Z&language=en&count=200`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`FIFA match lookup failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  return (Array.isArray(payload?.Results) ? payload.Results : []) as FIFAMatch[];
}

function resolveTeamLabel(match: FIFAMatch, side: "home" | "away") {
  const team = side === "home" ? match.Home : match.Away;
  const raw = team?.TeamName?.[0]?.Description || team?.Abbreviation;
  if (raw) return raw;

  const placeholder = side === "home" ? match.PlaceHolderA : match.PlaceHolderB;
  if (placeholder) return `Plaats ${placeholder}`;

  return `Match ${match.MatchNumber}`;
}

async function seedWK2026() {
  const supabase = createSupabaseAdminClient();

  const { data: tournament, error: tError } = await supabase
    .from("poule_tournaments")
    .upsert(
      {
        name: "Hartman WK 2026",
        slug: "hartman-wk-2026",
        start_date: "2026-06-11T00:00:00Z",
        end_date: "2026-07-19T00:00:00Z",
        is_active: true,
      },
      { onConflict: "slug" },
    )
    .select()
    .single();

  if (tError) {
    console.error("Error seeding tournament:", tError);
    return;
  }

  console.log("Tournament seeded:", tournament.name);

  const seasonId = await fetchFifaSeasonId();
  const fifaMatches = await fetchFifaMatches(seasonId);

  const matches = fifaMatches.map((match) => ({
    tournament_id: tournament.id,
    api_match_id: String(match.IdMatch),
    home_team: resolveTeamLabel(match, "home"),
    away_team: resolveTeamLabel(match, "away"),
    kickoff: match.Date,
    status: "scheduled" as const,
  }));

  const { error: deleteError } = await supabase
    .from("poule_matches")
    .delete()
    .eq("tournament_id", tournament.id);

  if (deleteError) {
    console.error("Error clearing old matches:", deleteError);
    return;
  }

  const { error: mError } = await supabase
    .from("poule_matches")
    .upsert(matches, { onConflict: "api_match_id" });

  if (mError) {
    console.error("Error seeding matches:", mError);
  } else {
    console.log(`Matches seeded: ${matches.length}`);
  }
}

seedWK2026().catch(console.error);
