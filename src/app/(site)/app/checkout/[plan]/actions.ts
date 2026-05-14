"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PERSONAS, type PersonaTier } from "@/lib/personas";

export interface ConfirmCheckoutInput {
  tier: PersonaTier;
  name: string;
  postcode: string;
  gpsLat?: number | null;
  gpsLon?: number | null;
  gpsLabel?: string | null;
}

export interface ConfirmCheckoutResult {
  ok: boolean;
  error?: string;
}

/**
 * Bevestig aanmelding voor een Tijdelijk-gratis abonnement.
 * - Updatet user_profile (naam, postcode, GPS).
 * - Zorgt dat er één actief abonnement op deze tier staat (trialing,
 *   founder tot 2026-06-01).
 * - Zet GPS-locatie als primaire locatie.
 * - Geen Mollie — betalen komt pas na launch.
 */
export async function confirmCheckout(
  input: ConfirmCheckoutInput
): Promise<ConfirmCheckoutResult> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Niet ingelogd. Log opnieuw in en probeer het nogmaals." };
  }

  const persona = PERSONAS[input.tier];
  if (!persona) {
    return { ok: false, error: "Ongeldig abonnement." };
  }

  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "Vul je naam in." };
  }

  // 1. Profiel bijwerken
  const profilePatch: Record<string, unknown> = {
    id: user.id,
    email: user.email!,
    full_name: name,
    postcode: input.postcode.trim() || null,
    updated_at: new Date().toISOString(),
  };
  if (typeof input.gpsLat === "number" && typeof input.gpsLon === "number") {
    profilePatch.primary_lat = input.gpsLat;
    profilePatch.primary_lon = input.gpsLon;
  }
  const { error: profileErr } = await supabase.from("user_profile").upsert(profilePatch);
  if (profileErr) {
    return { ok: false, error: `Profiel opslaan mislukt: ${profileErr.message}` };
  }

  // 2. Primaire locatie bijwerken (GPS)
  if (
    typeof input.gpsLat === "number" &&
    typeof input.gpsLon === "number" &&
    input.gpsLabel
  ) {
    // Bestaande primary? → overschrijven. Niet? → insert.
    const { data: existing } = await supabase
      .from("user_locations")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_primary", true)
      .maybeSingle();

    const locRow = {
      user_id: user.id,
      label: input.gpsLabel,
      lat: input.gpsLat,
      lon: input.gpsLon,
      is_primary: true,
      persona_scope: [input.tier],
    };

    if (existing?.id) {
      await supabase.from("user_locations").update(locRow).eq("id", existing.id);
    } else {
      await supabase.from("user_locations").insert(locRow);
    }
  }

  // 3. Abonnement zekerstellen
  //    De handle_new_user-trigger heeft bij signup al een sub gemaakt als
  //    er een chosen_tier in metadata stond. Hier zorgen we dat die rij
  //    (a) bestaat en (b) de juiste tier/price heeft. De unieke index op
  //    (user_id, tier) WHERE status IN (trialing, active, past_due)
  //    voorkomt duplicaten binnen dezelfde tier.
  const trialEnd = "2026-06-01T00:00:00+02:00";

  const { data: currentActive } = await supabase
    .from("subscriptions")
    .select("id, tier, status")
    .eq("user_id", user.id)
    .in("status", ["trialing", "active", "past_due"]);

  const sameTier = currentActive?.find((s) => s.tier === input.tier);

  if (sameTier) {
    // Sub op deze tier bestaat al → bijwerken (is_founder, trial, price).
    await supabase
      .from("subscriptions")
      .update({
        status: "trialing",
        is_founder: true,
        trial_end: trialEnd,
        founder_price_cents: persona.founderPriceCents,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sameTier.id);
  } else {
    // Eventueel actieve sub op andere tier → annuleren.
    if (currentActive && currentActive.length > 0) {
      await supabase
        .from("subscriptions")
        .update({
          status: "canceled",
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .in(
          "id",
          currentActive.map((s) => s.id)
        );
    }

    const { error: subErr } = await supabase.from("subscriptions").insert({
      user_id: user.id,
      tier: input.tier,
      status: "trialing",
      is_founder: true,
      trial_end: trialEnd,
      founder_price_cents: persona.founderPriceCents,
    });
    if (subErr) {
      return { ok: false, error: `Abonnement aanmaken mislukt: ${subErr.message}` };
    }
  }

  return { ok: true };
}
