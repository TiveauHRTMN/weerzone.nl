import { createSupabaseAdminClient } from "./supabase/admin";
import { PouleGroup, UserPouleStats } from "./types";

export const WK_POULE_NAME = "Hartman WK 2026";
export const WK_POULE_INVITE_CODE = (process.env.WK_POULE_INVITE_CODE || "HARTMAN-WK-2026").toUpperCase();

export type PouleInviteTarget = {
  inviteCode?: string | null;
  groupId?: string | null;
};

type WkProfileInput = {
  email?: string | null;
  fullName?: string | null;
};

type PouleMemberRow = {
  user_id: string;
  joined_at?: string | null;
};

type UserProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type PredictionRow = {
  user_id: string;
  group_id: string;
  match_id: string;
  home_prediction: number;
  away_prediction: number;
  calculated_points: number | null;
};

type MatchScoreRow = {
  id: string;
  home_score: number | null;
  away_score: number | null;
};

function normalizeInviteCode(inviteCode: string) {
  return inviteCode.trim().toUpperCase();
}

function cleanTarget(target?: PouleInviteTarget | null): Required<PouleInviteTarget> {
  return {
    inviteCode: target?.inviteCode?.trim() || null,
    groupId: target?.groupId?.trim() || null,
  };
}

async function upsertWkProfile(userId: string, profile?: WkProfileInput) {
  const email = profile?.email?.trim().toLowerCase();
  const fullName = profile?.fullName?.trim();

  if (!email && !fullName) return;

  const supabase = createSupabaseAdminClient();
  const payload: Record<string, string> = {
    id: userId,
    updated_at: new Date().toISOString(),
  };

  if (email) payload.email = email;
  if (fullName) payload.full_name = fullName;

  const { error } = await supabase
    .from("user_profile")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    console.error("WK profile upsert error:", error.message);
  }
}

async function getOrCreateHartmanWkPouleGroup(): Promise<PouleGroup | null> {
  const supabase = createSupabaseAdminClient();

  const { data: groupByCode, error: codeError } = await supabase
    .from("poule_groups")
    .select("*")
    .eq("invite_code", WK_POULE_INVITE_CODE)
    .maybeSingle();

  if (codeError) {
    console.error("WK group lookup by invite code error:", codeError.message);
  }

  if (groupByCode) return groupByCode as PouleGroup;

  const { data: groupByName, error: nameError } = await supabase
    .from("poule_groups")
    .select("*")
    .eq("name", WK_POULE_NAME)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (nameError) {
    console.error("WK group lookup by name error:", nameError.message);
  }

  if (groupByName) {
    const updates: Record<string, string> = {};
    if (groupByName.invite_code !== WK_POULE_INVITE_CODE) updates.invite_code = WK_POULE_INVITE_CODE;
    if (groupByName.name !== WK_POULE_NAME) updates.name = WK_POULE_NAME;

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from("poule_groups")
        .update(updates)
        .eq("id", groupByName.id);

      if (updateError) {
        console.error("WK group update error:", updateError.message);
      }
    }

    return {
      ...(groupByName as PouleGroup),
      name: WK_POULE_NAME,
      invite_code: WK_POULE_INVITE_CODE,
    };
  }

  const { data, error } = await supabase
    .from("poule_groups")
    .insert({
      name: WK_POULE_NAME,
      invite_code: WK_POULE_INVITE_CODE,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating Hartman WK poule group:", error.message);

    const { data: fallback } = await supabase
      .from("poule_groups")
      .select("*")
      .eq("invite_code", WK_POULE_INVITE_CODE)
      .maybeSingle();

    return (fallback as PouleGroup | null) ?? null;
  }

  return data as PouleGroup;
}

export async function getPouleGroupByInviteTarget(target?: PouleInviteTarget | null): Promise<PouleGroup | null> {
  const { inviteCode, groupId } = cleanTarget(target);
  const supabase = createSupabaseAdminClient();

  if (groupId) {
    const { data, error } = await supabase
      .from("poule_groups")
      .select("*")
      .eq("id", groupId)
      .maybeSingle();

    if (error) {
      console.error("WK group lookup by id error:", error.message);
      return null;
    }

    return (data as PouleGroup | null) ?? null;
  }

  if (inviteCode) {
    const normalized = normalizeInviteCode(inviteCode);
    if (normalized === WK_POULE_INVITE_CODE) {
      return getOrCreateHartmanWkPouleGroup();
    }

    const { data, error } = await supabase
      .from("poule_groups")
      .select("*")
      .eq("invite_code", normalized)
      .maybeSingle();

    if (error) {
      console.error("WK group lookup by invite target error:", error.message);
      return null;
    }

    return (data as PouleGroup | null) ?? null;
  }

  return getOrCreateHartmanWkPouleGroup();
}

/**
 * Maak een nieuwe poule groep aan.
 */
export async function createPouleGroup(name: string, userId: string): Promise<PouleGroup | null> {
  const supabase = createSupabaseAdminClient();
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const { data, error } = await supabase
    .from("poule_groups")
    .insert({
      name,
      owner_id: userId,
      invite_code: inviteCode,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating poule group:", error.message);
    return null;
  }

  await joinPouleGroup(data.id, userId);

  return data;
}

/**
 * Word lid van een poule groep via een uitnodigingscode.
 */
export async function joinPouleGroupByCode(inviteCode: string, userId: string): Promise<boolean> {
  const supabase = createSupabaseAdminClient();

  const { data: group, error: groupError } = await supabase
    .from("poule_groups")
    .select("id")
    .eq("invite_code", normalizeInviteCode(inviteCode))
    .single();

  if (groupError || !group) {
    if (groupError) console.error("Join by invite code error:", groupError.message);
    return false;
  }

  return joinPouleGroup(group.id, userId);
}

export async function joinPouleGroup(groupId: string, userId: string): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("poule_group_members")
    .upsert(
      {
        group_id: groupId,
        user_id: userId,
      },
      { onConflict: "group_id,user_id", ignoreDuplicates: true },
    );

  if (error) {
    console.error("Join poule group error:", error.message);
    return false;
  }

  return true;
}

export async function isPouleGroupMember(groupId: string, userId: string): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("poule_group_members")
    .select("group_id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Poule membership check error:", error.message);
    return false;
  }

  return Boolean(data);
}

export async function ensurePouleMembershipForInvite(
  userId: string,
  target?: PouleInviteTarget | null,
  profile?: WkProfileInput,
): Promise<PouleGroup | null> {
  await upsertWkProfile(userId, profile);

  const group = await getPouleGroupByInviteTarget(target);
  if (!group) return null;

  const joined = await joinPouleGroup(group.id, userId);
  return joined ? group : null;
}

export async function ensureHartmanWkPouleMembership(
  userId: string,
  profile?: WkProfileInput,
): Promise<PouleGroup | null> {
  return ensurePouleMembershipForInvite(userId, { inviteCode: WK_POULE_INVITE_CODE }, profile);
}

/**
 * Haal de ranglijst op voor een specifieke groep.
 * Deze query is bewust in losse stappen opgeknipt zodat leden zonder voorspellingen
 * zichtbaar blijven en relatieproblemen in Supabase geen lege ranglijst geven.
 */
export async function getGroupStandings(groupId: string): Promise<UserPouleStats[]> {
  const supabase = createSupabaseAdminClient();

  const { data: members, error: membersError } = await supabase
    .from("poule_group_members")
    .select("user_id, joined_at")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });

  if (membersError) {
    console.error("Poule members read error:", membersError.message);
    return [];
  }

  const memberRows = (members ?? []) as PouleMemberRow[];
  const userIds = memberRows.map((member) => member.user_id);
  if (userIds.length === 0) return [];

  const [{ data: profiles, error: profilesError }, { data: predictions, error: predictionsError }] = await Promise.all([
    supabase
      .from("user_profile")
      .select("id, full_name, email")
      .in("id", userIds),
    supabase
      .from("poule_predictions")
      .select("user_id, group_id, match_id, home_prediction, away_prediction, calculated_points")
      .eq("group_id", groupId)
      .in("user_id", userIds),
  ]);

  if (profilesError) {
    console.error("Poule profiles read error:", profilesError.message);
  }

  if (predictionsError) {
    console.error("Poule predictions read error:", predictionsError.message);
  }

  const predictionRows = ((predictions ?? []) as PredictionRow[]);
  const matchIds = Array.from(new Set(predictionRows.map((prediction) => prediction.match_id)));
  let matchScoreById = new Map<string, MatchScoreRow>();

  if (matchIds.length > 0) {
    const { data: matches, error: matchesError } = await supabase
      .from("poule_matches")
      .select("id, home_score, away_score")
      .in("id", matchIds);

    if (matchesError) {
      console.error("Poule match scores read error:", matchesError.message);
    } else {
      matchScoreById = new Map(((matches ?? []) as MatchScoreRow[]).map((match) => [match.id, match]));
    }
  }

  const profileById = new Map(
    ((profiles ?? []) as UserProfileRow[]).map((profile) => [profile.id, profile]),
  );

  const predictionsByUser = new Map<string, PredictionRow[]>();
  for (const prediction of predictionRows) {
    const userPredictions = predictionsByUser.get(prediction.user_id) ?? [];
    userPredictions.push(prediction);
    predictionsByUser.set(prediction.user_id, userPredictions);
  }

  const standings = memberRows.map((member, memberIndex) => {
    const userPredictions = predictionsByUser.get(member.user_id) ?? [];
    const profile = profileById.get(member.user_id);
    let totalPoints = 0;
    let exactScores = 0;
    let correctWinners = 0;

    for (const prediction of userPredictions) {
      totalPoints += prediction.calculated_points || 0;

      const real = matchScoreById.get(prediction.match_id);
      if (real && real.home_score !== null && real.away_score !== null) {
        if (prediction.home_prediction === real.home_score && prediction.away_prediction === real.away_score) {
          exactScores++;
        } else if ((prediction.calculated_points || 0) >= 5) {
          correctWinners++;
        }
      }
    }

    const displayName = profile?.full_name || profile?.email?.split("@")[0] || "Anoniem";

    return {
      user_id: member.user_id,
      display_name: displayName,
      total_points: totalPoints,
      exact_scores: exactScores,
      correct_winners: correctWinners,
      member_index: memberIndex,
    };
  });

  return standings
    .sort((a, b) => b.total_points - a.total_points || a.member_index - b.member_index)
    .map(({ member_index: _memberIndex, ...entry }) => entry);
}

/**
 * Update uitslagen via externe API (placeholder logica).
 */
export async function syncMatchScores(tournamentSlug: string) {
  const supabase = createSupabaseAdminClient();
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;

  if (!apiKey) {
    console.warn("Geen FOOTBALL_DATA_API_KEY gevonden, skip sync.");
    return;
  }

  // Hier komt de fetch naar de externe voetbal-API.
  // De database trigger update punten zodra wedstrijden als finished worden opgeslagen.
  void supabase;
  void tournamentSlug;
}
