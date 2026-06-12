import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

function isAssetPath(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/manifest.webmanifest" ||
    /\.(?:xml|txt|json|webmanifest|png|jpg|jpeg|gif|svg|webp|ico|css|js|map)$/.test(pathname)
  );
}

function isPublicPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/vandaag" ||
    pathname === "/morgen" ||
    pathname === "/over" ||
    pathname === "/contact" ||
    pathname === "/jouwweer" ||
    pathname === "/piet" ||
    pathname === "/reed" ||
    pathname === "/koos" ||
    pathname === "/steve" ||
    pathname === "/waarschuwingen" ||
    pathname === "/embed" ||
    pathname === "/widget" ||
    pathname === "/voorwaarden" ||
    pathname === "/privacy" ||
    (pathname === "/weer" || pathname.startsWith("/weer/")) ||
    (pathname === "/zakelijk" || pathname.startsWith("/zakelijk/")) ||
    (pathname === "/steun" || pathname.startsWith("/steun/")) ||
    pathname === "/app/login" ||
    pathname === "/app/signup" ||
    pathname.startsWith("/app/reset") ||
    pathname.startsWith("/app/verify") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/wkpoule") ||
    pathname.startsWith("/hartmanwk2026")
  );
}

const PROVINCE_SLUGS = new Set([
  "groningen", "friesland", "drenthe", "overijssel", "flevoland",
  "gelderland", "utrecht", "noord-holland", "zuid-holland", "zeeland",
  "noord-brabant", "limburg", "48-uur", "onweer", "regen", "themas",
]);

const CITY_TO_PROVINCE: Record<string, string> = {
  amsterdam: "noord-holland",
  rotterdam: "zuid-holland",
  "den-haag": "zuid-holland",
  "the-hague": "zuid-holland",
  eindhoven: "noord-brabant",
  tilburg: "noord-brabant",
  almere: "flevoland",
  breda: "noord-brabant",
  nijmegen: "gelderland",
  apeldoorn: "gelderland",
  enschede: "overijssel",
  haarlem: "noord-holland",
  arnhem: "gelderland",
  amersfoort: "utrecht",
  zwolle: "overijssel",
  zaanstad: "noord-holland",
  "s-hertogenbosch": "noord-brabant",
  "den-bosch": "noord-brabant",
  haarlemmermeer: "noord-holland",
  zoetermeer: "zuid-holland",
  leiden: "zuid-holland",
  maastricht: "limburg",
  dordrecht: "zuid-holland",
  ede: "gelderland",
  "alphen-aan-den-rijn": "zuid-holland",
  westland: "zuid-holland",
  alkmaar: "noord-holland",
  emmen: "drenthe",
  delft: "zuid-holland",
  venlo: "limburg",
  deventer: "overijssel",
  helmond: "noord-brabant",
  oss: "noord-brabant",
  leeuwarden: "friesland",
  "sittard-geleen": "limburg",
  amstelveen: "noord-holland",
  heerlen: "limburg",
  nissewaard: "zuid-holland",
  hilversum: "noord-holland",
  hengelo: "overijssel",
  purmerend: "noord-holland",
  roosendaal: "noord-brabant",
  schiedam: "zuid-holland",
  vlaardingen: "zuid-holland",
  lelystad: "flevoland",
  gouda: "zuid-holland",
  almelo: "overijssel",
  assen: "drenthe",
  hoorn: "noord-holland",
  veenendaal: "utrecht",
  middelburg: "zeeland",
};

function cityRedirect(pathname: string, search: string, requestUrl: string): NextResponse | null {
  const match = pathname.match(/^\/weer\/([a-z0-9-]+)\/?$/);
  if (!match) return null;
  const slug = match[1];
  if (PROVINCE_SLUGS.has(slug)) return null;
  const province = CITY_TO_PROVINCE[slug];
  if (!province) return null;
  return NextResponse.redirect(new URL(`/weer/${province}/${slug}${search}`, requestUrl), 308);
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const requestHost = request.headers.get("host")?.split(":", 1)[0].toLowerCase();
  if (requestHost === "www.weerzone.nl") {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.hostname = "weerzone.nl";
    return NextResponse.redirect(canonicalUrl, 308);
  }

  if (isAssetPath(pathname)) return NextResponse.next();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  if (pathname.startsWith("/wkpoule")) requestHeaders.set("x-site-skin", "wk");

  if (pathname === "/poule") {
    return NextResponse.redirect(new URL(`/wkpoule${search}`, request.url), 308);
  }
  if (pathname.startsWith("/poule/")) {
    return NextResponse.redirect(new URL(pathname.replace(/^\/poule/, "/wkpoule") + search, request.url), 308);
  }

  const city = cityRedirect(pathname, search, request.url);
  if (city) return city;

  let response = NextResponse.next({ request: { headers: requestHeaders } });
  if (isPublicPath(pathname)) return response;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return NextResponse.redirect(new URL("/", request.url));

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: requestHeaders } });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options as CookieOptions);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) {
    const onboardingUrl = new URL("/", request.url);
    onboardingUrl.searchParams.set("van", pathname);
    return NextResponse.redirect(onboardingUrl);
  }

  return response;
}

export default proxy;

export const config = {
  matcher: ["/:path*"],
};
