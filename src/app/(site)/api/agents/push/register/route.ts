import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { findPlace, isNLProvince } from "@/lib/places-data";
import { isAgentKey, upsertAgentSubscription } from "@/lib/agents/subscriptions";
import { PUSH_DEVICES_TABLE } from "@/lib/push";

export const dynamic = "force-dynamic";

interface RegisterBody {
  agent?: unknown;
  province?: unknown;
  place?: unknown;
  subscription?: { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  /** true = dit push-abonnement (agent+plaats) uitzetten. */
  disable?: unknown;
}

/**
 * Registreert web push voor een agent + plaats (blok b: Reed). Vereist een
 * ingelogde gebruiker — het apparaat (push_devices) hangt aan het account, het
 * abonnement (agent_subscriptions, channel='push') aan agent + plaats.
 */
export async function POST(req: Request) {
  let body: RegisterBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige aanvraag" }, { status: 400 });
  }

  const agent = body.agent;
  const province = typeof body.province === "string" ? body.province : "";
  const placeSlug = typeof body.place === "string" ? body.place : "";
  if (!isAgentKey(agent) || !isNLProvince(province) || !findPlace(province, placeSlug)) {
    return NextResponse.json({ error: "Ongeldige aanvraag" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Log eerst in" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();

  // Uitzetten: alleen het abonnement deactiveren; het apparaat kan andere
  // meldingen blijven ontvangen.
  if (body.disable === true) {
    const { error } = await admin
      .from("agent_subscriptions")
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("agent", agent)
      .eq("province", province)
      .eq("place_slug", placeSlug)
      .eq("channel", "push");
    if (error) {
      console.error("[push/register] uitzetten mislukt:", error.message);
      return NextResponse.json({ error: "Uitzetten lukte even niet" }, { status: 500 });
    }
    return NextResponse.json({ status: "disabled" });
  }

  const endpoint = typeof body.subscription?.endpoint === "string" ? body.subscription.endpoint : "";
  const p256dh = typeof body.subscription?.keys?.p256dh === "string" ? body.subscription.keys.p256dh : "";
  const auth = typeof body.subscription?.keys?.auth === "string" ? body.subscription.keys.auth : "";
  if (!endpoint.startsWith("https://") || !p256dh || !auth) {
    return NextResponse.json({ error: "Ongeldige push-registratie" }, { status: 400 });
  }

  // Apparaat vastleggen (endpoint is uniek; her-registratie op hetzelfde
  // apparaat vervangt sleutels en maakt het weer actief).
  const { error: deviceError } = await admin.from(PUSH_DEVICES_TABLE).upsert(
    { user_id: user.id, endpoint, p256dh, auth, disabled_at: null },
    { onConflict: "endpoint" },
  );
  if (deviceError) {
    console.error("[push/register] apparaat opslaan mislukt:", deviceError.message);
    return NextResponse.json({ error: "Opslaan lukte even niet" }, { status: 500 });
  }

  const result = await upsertAgentSubscription(admin, {
    userId: user.id,
    agent,
    province,
    placeSlug,
    channel: "push",
  });
  if (!result.ok) {
    console.error("[push/register] abonnement opslaan mislukt:", result.reason);
    return NextResponse.json({ error: "Opslaan lukte even niet" }, { status: 500 });
  }

  return NextResponse.json({ status: "subscribed" });
}
