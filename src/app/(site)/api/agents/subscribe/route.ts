import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { findPlace, isNLProvince } from "@/lib/places-data";
import { isAgentKey, upsertAgentSubscription } from "@/lib/agents/subscriptions";
import { getAgentSubscribeMagicLinkHtml } from "@/lib/magic-link-email";

export const dynamic = "force-dynamic";

/**
 * Abonnement op een agent voor één plaats (handoff 2026-07-10, blok a).
 *
 * Ingelogd  → one-tap: abonnement-rij direct aanmaken.
 * Uitgelogd → branded magic link (zelfde patroon als sendBrandedMagicLink in
 *             app/actions.ts): één klik in de mail logt in via /auth/callback
 *             en landt op /api/agents/subscribe/confirm, die de rij aanmaakt.
 */
export async function POST(req: Request) {
  let body: { agent?: unknown; province?: unknown; place?: unknown; email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige aanvraag" }, { status: 400 });
  }

  const agent = body.agent;
  const province = typeof body.province === "string" ? body.province : "";
  const placeSlug = typeof body.place === "string" ? body.place : "";
  if (!isAgentKey(agent) || !isNLProvince(province)) {
    return NextResponse.json({ error: "Ongeldige aanvraag" }, { status: 400 });
  }
  const place = findPlace(province, placeSlug);
  if (!place) {
    return NextResponse.json({ error: "Onbekende plaats" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = createSupabaseAdminClient();

  // Ingelogd: one-tap.
  if (user) {
    const result = await upsertAgentSubscription(admin, {
      userId: user.id,
      agent,
      province,
      placeSlug,
    });
    if (!result.ok) {
      console.error("[agents/subscribe] upsert mislukt:", result.reason);
      return NextResponse.json({ error: "Opslaan lukte even niet" }, { status: 500 });
    }
    return NextResponse.json({ status: "subscribed" });
  }

  // Uitgelogd: magic link naar het opgegeven adres.
  const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Vul een geldig e-mailadres in" }, { status: 400 });
  }
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "Mail is even niet beschikbaar" }, { status: 500 });
  }

  // Zorg dat het account bestaat en bevestigd is — met email_confirm:true blijft
  // Supabase zelf stil en sturen wíj de enige mail (zelfde truc als actions.ts).
  const { error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (createError && !createError.message.toLowerCase().includes("already")) {
    console.error("[agents/subscribe] createUser mislukt:", createError.message);
    return NextResponse.json({ error: "Aanmelden lukte even niet" }, { status: 500 });
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkError || !linkData?.properties?.hashed_token) {
    console.error("[agents/subscribe] generateLink mislukt:", linkError?.message);
    return NextResponse.json({ error: "Aanmelden lukte even niet" }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://weerzone.nl";
  const next =
    `/api/agents/subscribe/confirm` +
    `?agent=${agent}&province=${encodeURIComponent(province)}&place=${encodeURIComponent(placeSlug)}`;
  const actionLink =
    `${siteUrl}/auth/callback` +
    `?token_hash=${encodeURIComponent(linkData.properties.hashed_token)}` +
    `&type=magiclink&next=${encodeURIComponent(next)}`;

  const resend = new Resend(resendKey);
  const { error: sendError } = await resend.emails.send({
    from: "Piet van Weerzone <piet@weerzone.nl>",
    to: email,
    subject: `Piet staat klaar voor ${place.name} — één klik`,
    html: getAgentSubscribeMagicLinkHtml(place.name, actionLink),
  });
  if (sendError) {
    console.error("[agents/subscribe] mail versturen mislukt:", sendError.message);
    return NextResponse.json({ error: "Mail versturen lukte even niet" }, { status: 500 });
  }

  return NextResponse.json({ status: "link_sent" });
}
