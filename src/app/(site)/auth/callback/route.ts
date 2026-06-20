import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensurePouleMembershipForInvite } from "@/lib/poule";

/**
 * Auth-callback. Verwerkt drie soorten terugkeer-links:
 *
 *  1. OTP-verify  (`token_hash` + `type`) — onze branded magic-links. Deze
 *     worden server-side via `admin.generateLink` gemaakt en wijzen rechtstreeks
 *     naar deze route, zónder PKCE-verifier. We wisselen ze in met `verifyOtp`.
 *  2. PKCE-code   (`code`) — client-geïnitieerde OAuth / signInWithOtp.
 *     Ingewisseld met `exchangeCodeForSession`.
 *
 * Historische bug: deze route kende alléén pad 2, terwijl de mail pad 1 stuurt.
 * Daardoor kwam elke magic-link uit op /app/signup?error=auth (= niet inloggen).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = (searchParams.get("type") as EmailOtpType | null) ?? "magiclink";
  const rawNext = searchParams.get("next") ?? "/app";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/app";

  const supabase = await createSupabaseServerClient();

  const dev = process.env.NODE_ENV !== "production";

  let exchangeError: string | null = null;

  if (tokenHash) {
    // Pad 1: branded magic-link / OTP-verify.
    if (dev) console.log(`[AUTH-CALLBACK] verifyOtp type=${type}`);
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    exchangeError = error?.message ?? null;
  } else if (code) {
    // Pad 2: PKCE-code (OAuth).
    if (dev) console.log(`[AUTH-CALLBACK] exchangeCodeForSession`);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    exchangeError = error?.message ?? null;
  } else {
    exchangeError = "geen code of token_hash in callback";
  }

  if (!exchangeError) {
    const { data: { user } } = await supabase.auth.getUser();
    if (dev) console.log(`[AUTH-CALLBACK] Success! User: ${user?.email}`);

    if (user && next.startsWith("/wkpoule")) {
      const nextUrl = new URL(next, origin);
      await ensurePouleMembershipForInvite(user.id, {
        inviteCode: nextUrl.searchParams.get("inviteCode") || nextUrl.searchParams.get("code"),
        groupId: nextUrl.searchParams.get("groupId") || nextUrl.searchParams.get("poolId"),
      }, {
        email: user.email,
        fullName: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null,
      });
    }

    return NextResponse.redirect(`${origin}${next}`);
  }

  console.error(`[AUTH-CALLBACK] Inwisselen mislukt:`, exchangeError);
  return NextResponse.redirect(`${origin}/app/login?error=link`);
}
