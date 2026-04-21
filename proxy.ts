import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Next 16 Proxy (voorheen middleware).
 * - Refresht Supabase-sessie cookies bij elke matchende request.
 * - Beschermt /app/* voor niet-ingelogde gebruikers (behalve /app/onboarding).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(toSet) {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Founder Verification (Inline voor Edge-compatibility)
  const FOUNDER_EMAILS = ["rwnhrtmn@gmail.com", "iamrowanonl@gmail.com", "info@weerzone.nl"];
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAppRoute = pathname.startsWith("/app");
  const isOnboarding = pathname.startsWith("/app/onboarding");



  if (isAppRoute && !isOnboarding && !user) {
    const redirectUrl = new URL("/app/onboarding", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

