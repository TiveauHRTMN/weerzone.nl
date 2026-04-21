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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAppRoute = pathname.startsWith("/app");
  const isOnboarding = pathname.startsWith("/app/onboarding");

  // Founder Persistence: Als de gebruiker een founder is (info@weerzone.nl), 
  // verlengen we de session cookies naar 10 jaar zodat ze "altijd" ingelogd blijven.
  const { isFounderEmail } = await import("@/lib/founders");
  if (user && isFounderEmail(user.email)) {
    const sessionCookies = request.cookies.getAll().filter(c => c.name.startsWith("sb-"));
    sessionCookies.forEach(cookie => {
      response.cookies.set(cookie.name, cookie.value, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365 * 10, // 10 jaar
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      });
    });
  }

  if (isAppRoute && !isOnboarding && !user) {
    const redirectUrl = new URL("/app/onboarding", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // Sla static/image/favicons over — run op alles behalve deze
    "/((?!_next/static|_next/image|favicon|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif|js|css|woff2?)$).*)",
  ],
};
