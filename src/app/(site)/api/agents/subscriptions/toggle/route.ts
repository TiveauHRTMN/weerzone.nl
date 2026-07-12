import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { findPlace, isNLProvince } from "@/lib/places-data";
import {
  AGENT_SUBSCRIPTIONS_TABLE,
  isAgentKey,
  upsertAgentSubscription,
} from "@/lib/agents/subscriptions";

export const dynamic = "force-dynamic";

/**
 * Abonnement aan/uit voor de ingelogde gebruiker (spec agent-headsup §3E/F).
 * Aan = upsert (heractiveert bestaande rij); uit = unsubscribed_at zetten.
 * Push-áánzetten loopt níét hierlangs maar via /api/agents/push/register,
 * omdat daar de apparaat-registratie bij hoort.
 */
export async function POST(req: Request) {
  let body: { agent?: unknown; province?: unknown; place?: unknown; channel?: unknown; active?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige aanvraag" }, { status: 400 });
  }

  const agent = body.agent;
  const province = typeof body.province === "string" ? body.province : "";
  const placeSlug = typeof body.place === "string" ? body.place : "";
  const channel = body.channel === "push" ? "push" : body.channel === "email" ? "email" : null;
  const active = body.active === true;
  if (!isAgentKey(agent) || !isNLProvince(province) || !channel || !findPlace(province, placeSlug)) {
    return NextResponse.json({ error: "Ongeldige aanvraag" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Log eerst in" }, { status: 401 });

  const admin = createSupabaseAdminClient();
  if (active) {
    const result = await upsertAgentSubscription(admin, {
      userId: user.id,
      agent,
      province,
      placeSlug,
      channel,
    });
    if (!result.ok) {
      console.error("[subscriptions/toggle] aanzetten mislukt:", result.reason);
      return NextResponse.json({ error: "Opslaan lukte even niet" }, { status: 500 });
    }
    return NextResponse.json({ status: "on" });
  }

  const { error } = await admin
    .from(AGENT_SUBSCRIPTIONS_TABLE)
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("agent", agent)
    .eq("province", province)
    .eq("place_slug", placeSlug)
    .eq("channel", channel);
  if (error) {
    console.error("[subscriptions/toggle] uitzetten mislukt:", error.message);
    return NextResponse.json({ error: "Uitzetten lukte even niet" }, { status: 500 });
  }
  return NextResponse.json({ status: "off" });
}
