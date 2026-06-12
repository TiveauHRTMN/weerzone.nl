import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensurePouleMembershipForInvite } from "@/lib/poule";

/**
 * Magic-link / OAuth callback: wisselt `code` om voor een sessie
 * en stuurt door naar `next` (default /app).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/app";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/app";

  if (code) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[AUTH-CALLBACK] Exchanging code for session...`);
    }
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (process.env.NODE_ENV !== "production") {
        console.log(`[AUTH-CALLBACK] Success! User: ${user?.email}`);
      }

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
    } else {
      console.error(`[AUTH-CALLBACK] Error exchanging code:`, error.message);
    }
  }

  // Fallback if no code or error
  return NextResponse.redirect(`${origin}/app/signup?error=auth`);
}
