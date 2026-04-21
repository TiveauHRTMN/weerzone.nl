import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Magic-link / OAuth callback: wisselt `code` om voor een sessie
 * en stuurt door naar `next` (default /app).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      const redirectUrl = new URL(next, origin);
      
      const response = NextResponse.redirect(redirectUrl.href);



      return response;
    }
  }

  return NextResponse.redirect(`${origin}/app/onboarding?error=auth`);
}
