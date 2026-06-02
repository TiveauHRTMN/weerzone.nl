import { NextRequest, NextResponse } from "next/server";

function isAssetPath(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/manifest.webmanifest" ||
    /\.(?:xml|png|jpg|jpeg|gif|svg|webp|ico|css|js|map)$/.test(pathname)
  );
}

// Slugs die zowel als provincie (canonical) bestaan; daar mogen we niet ingrijpen.
const PROVINCE_SLUGS = new Set([
  "groningen", "friesland", "drenthe", "overijssel", "flevoland",
  "gelderland", "utrecht", "noord-holland", "zuid-holland", "zeeland",
  "noord-brabant", "limburg",
  "48-uur", "onweer", "regen", "themas",
]);

// City-slug → province voor de top NL+BE-steden zonder provincieprefix.
// Beperkt tot ~80 entries om de middleware-bundle klein te houden.
const CITY_TO_PROVINCE: Record<string, string> = {
  // NL — top 50
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
  // BE — top 10
};

function cityRedirect(pathname: string, search: string, requestUrl: string): NextResponse | null {
  // Match alleen exact /weer/<slug> — niet /weer/<province>/<place>.
  const match = pathname.match(/^\/weer\/([a-z0-9-]+)\/?$/);
  if (!match) return null;
  const slug = match[1];
  if (PROVINCE_SLUGS.has(slug)) return null;
  const province = CITY_TO_PROVINCE[slug];
  if (!province) return null;
  return NextResponse.redirect(new URL(`/weer/${province}/${slug}${search}`, requestUrl), 308);
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isAssetPath(pathname)) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  // Injecteert pathname zodat de root layout het HTML lang-attribuut dynamisch
  // kan instellen (NL vs DE) zonder een volledige i18n-bibliotheek.
  requestHeaders.set("x-pathname", pathname);
  if (pathname.startsWith("/wkpoule")) {
    requestHeaders.set("x-site-skin", "wk");
  }

  if (pathname === "/poule") {
    return NextResponse.redirect(new URL(`/wkpoule${search}`, request.url), 308);
  }

  if (pathname.startsWith("/poule/")) {
    return NextResponse.redirect(new URL(pathname.replace(/^\/poule/, "/wkpoule") + search, request.url), 308);
  }

  const city = cityRedirect(pathname, search, request.url);
  if (city) return city;

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/:path*"],
};
