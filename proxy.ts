import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const pathname = request.nextUrl.pathname;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-wz-locale", "nl");
  
  // 1. Skip middleware for static assets, public files, and non-app routes
  if (
    pathname.includes('.') || 
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    !pathname.startsWith('/app')
  ) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // 2. Define Public App Routes (NO redirect to login)
  const isPublicRoute = 
    pathname === "/app/login" || 
    pathname === "/app/signup" || 
    pathname === "/app/reset" ||
    pathname === "/app/onboarding"; // Onboarding is public-ish but needs user data later

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: requestHeaders } });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  // 3. LOOP PROTECTION: If we are on a public route, just continue
  if (isPublicRoute) {
    return response;
  }

  // 4. Protect private app routes
  if (!user) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[MIDDLEWARE] No user found for ${pathname}, redirecting to login`);
    }
    const redirectUrl = new URL("/app/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    
    // Copy cookies to the redirect response
    const redirectResponse = NextResponse.redirect(redirectUrl);
    response.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  return response;
}

export default proxy;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
