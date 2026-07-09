import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { findPlace, isNLProvince } from "@/lib/places-data";
import { isAgentKey, upsertAgentSubscription } from "@/lib/agents/subscriptions";

export const dynamic = "force-dynamic";

/**
 * Landingspunt van de abonnement-magic-link. /auth/callback heeft de OTP al
 * ingewisseld en de sessie-cookies gezet; hier maken we de abonnement-rij aan
 * en sturen we terug naar de plaatspagina met ?abonnement=<agent> zodat het
 * inschrijfblok de bevestiging toont (en subscribe_confirmed logt).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const agent = searchParams.get("agent");
  const province = searchParams.get("province") ?? "";
  const placeSlug = searchParams.get("place") ?? "";

  if (!isAgentKey(agent) || !isNLProvince(province) || !findPlace(province, placeSlug)) {
    return NextResponse.redirect(`${origin}/vandaag`);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/app/login?error=link`);
  }

  const admin = createSupabaseAdminClient();
  const result = await upsertAgentSubscription(admin, {
    userId: user.id,
    agent,
    province,
    placeSlug,
  });
  if (!result.ok) {
    console.error("[agents/subscribe/confirm] upsert mislukt:", result.reason);
    // Ingelogd is de gebruiker wél; laat de plaatspagina het opnieuw proberen.
    return NextResponse.redirect(`${origin}/weer/${province}/${placeSlug}?abonnement=mislukt`);
  }

  return NextResponse.redirect(`${origin}/weer/${province}/${placeSlug}?abonnement=${agent}`);
}
