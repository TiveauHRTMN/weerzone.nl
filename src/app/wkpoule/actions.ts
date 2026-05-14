"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { findWkInvite } from "@/lib/wkpoule-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureHartmanWkPouleMembership } from "@/lib/poule";
import { Resend } from "resend";

export async function createGroupAction(
  name: string,
): Promise<{ ok: true; groupId: string } | { ok: false; error: string }> {
  void name;
  return { ok: false, error: "Niet van toepassing" };
}

export async function joinGroupAction(inviteCode: string) {
  return { ok: false, error: "Niet van toepassing" };
}

export async function submitPredictionsAction(matchId: string, home: number, away: number) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd");

  if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0 || home > 30 || away > 30) {
    return { ok: false, error: "Gebruik hele scores van 0 t/m 30." };
  }

  const admin = createSupabaseAdminClient();
  const { data: match, error: matchError } = await admin
    .from("poule_matches")
    .select("kickoff, status")
    .eq("id", matchId)
    .maybeSingle();

  if (matchError || !match) {
    return { ok: false, error: "Wedstrijd niet gevonden." };
  }

  if (match.status !== "scheduled" || Date.now() >= new Date(match.kickoff).getTime()) {
    return { ok: false, error: "Deze speeldag is gesloten." };
  }

  const group = await ensureHartmanWkPouleMembership(user.id, {
    email: user.email,
    fullName: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null,
  });

  if (!group) {
    return { ok: false, error: "Je kon niet aan de poule worden toegevoegd." };
  }

  const { error } = await admin
    .from("poule_predictions")
    .upsert({
      user_id: user.id,
      match_id: matchId,
      home_prediction: home,
      away_prediction: away,
    }, { onConflict: "user_id,match_id" });

  if (error) {
    console.error("Prediction submit error:", error);
    return { ok: false, error: error.message };
  }

  revalidatePath("/wkpoule");
  return { ok: true };
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  const admin = createSupabaseAdminClient();

  const { data: profile, error: profileError } = await admin
    .from("user_profile")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (profileError) {
    console.error("WK user profile lookup error:", profileError.message);
  }

  if (profile?.id) return profile.id;

  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      console.error("WK auth user lookup error:", error.message);
      return null;
    }

    const found = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (found) return found.id;
    if (data.users.length < 1000) break;
  }

  return null;
}

export async function redeemInviteCodeAction(rawCode: string) {
  const invite = findWkInvite(rawCode);
  if (!invite) {
    return { ok: false, error: "Ongeldige code" };
  }
  return { ok: true, label: invite.label };
}

export async function sendWkMagicLinkAction(args: { fullName: string; email: string }) {
  const fullName = args.fullName.trim();
  const email = args.email.trim().toLowerCase();

  if (!fullName) {
    return { ok: false, error: "Vul je naam in." };
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Vul een geldig e-mailadres in." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Mailversturing is niet geconfigureerd." };
  }

  const admin = createSupabaseAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://weerzone.nl";
  const redirectTo = `${siteUrl}/auth/callback?next=/wkpoule`;
  let userId: string | null = null;

  const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      source: "wkpoule",
    },
  });

  userId = createdUser.user?.id ?? null;

  if (createError && !createError.message.toLowerCase().includes("already registered")) {
    return { ok: false, error: createError.message };
  }

  if (createError) {
    userId = await findUserIdByEmail(email);
    if (userId) {
      const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          source: "wkpoule",
        },
      });

      if (updateError) {
        console.error("WK auth user update error:", updateError.message);
      }
    }
  }

  if (userId) {
    const group = await ensureHartmanWkPouleMembership(userId, { email, fullName });
    if (!group) {
      return { ok: false, error: "Je toegang is aangemaakt, maar de poule kon niet worden gekoppeld." };
    }
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: "Hartman WK 2026 <info@weerzone.nl>",
    to: email,
    subject: "Je toegang tot Hartman WK 2026",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
        <h2>Hartman WK 2026</h2>
        <p>Hallo ${fullName},</p>
        <p>Gebruik deze link om toegang te krijgen tot de poule:</p>
        <p><a href="${data.properties.action_link}">Open de poule</a></p>
        <p>Na het openen kom je direct terug in de Hartman WK 2026-omgeving.</p>
      </div>
    `,
  });

  return { ok: true };
}
