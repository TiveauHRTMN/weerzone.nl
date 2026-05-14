import { NextRequest, NextResponse } from "next/server";

function isAssetPath(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/manifest.webmanifest" ||
    /\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map)$/.test(pathname)
  );
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

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/:path*"],
};
