import type { NextConfig } from "next";

// Content-Security-Policy in report-only mode — meet eerst de violations
// (PostHog, Supabase, Mollie inline scripts/connects), schakel daarna
// pas over op enforcement door de header te hernoemen naar "Content-Security-Policy".
const cspReportOnly = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.posthog.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://*.posthog.com",
  "frame-src https://www.google.com https://*.youtube.com https://*.youtube-nocookie.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

// Standaard set met robuuste security headers
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), browsing-topics=()",
  },
  {
    key: "Content-Security-Policy-Report-Only",
    value: cspReportOnly,
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Canonicals zijn slash-loos (https://weerzone.nl, https://weerzone.nl/weer/...)
  // dus zet trailingSlash expliciet uit om verwarring tussen Vercel-redirects en
  // canonical te voorkomen.
  trailingSlash: false,
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      { source: "/home",            destination: "/",               permanent: true },
      { source: "/homepage",        destination: "/",               permanent: true },
      { source: "/about",           destination: "/over",            permanent: true },
      { source: "/mijnweer",        destination: "/vandaag",        permanent: true },
      { source: "/mijn-weer",       destination: "/vandaag",        permanent: true },
      { source: "/jouwweer",        destination: "/vandaag",        permanent: true },
      { source: "/waarschuwingen",  destination: "/vandaag#reed",   permanent: true },
      { source: "/piet",            destination: "/vandaag#piet",   permanent: true },
      { source: "/reed",            destination: "/vandaag#reed",   permanent: true },
      { source: "/koos",            destination: "/vandaag#koos",   permanent: true },
      { source: "/prijzen",         destination: "/",               permanent: true },
      // /zakelijk (B2B-laag) verwijderd: geen commerciële laag tot KvK.
      { source: "/zakelijk",         destination: "/",               permanent: true },
      { source: "/zakelijk/:path*",  destination: "/",               permanent: true },
      { source: "/app/checkout/:path*", destination: "/mijn-weerzone", permanent: true },
      // Reiszone is verwijderd in v2 (agent-first relaunch). Alle Reiszone-URLs
      // worden hard naar de homepage gestuurd; voor crawlers is dat een 308.
      { source: "/reisweer",        destination: "/",               permanent: true },
      { source: "/reisweer/:path*", destination: "/",               permanent: true },
      { source: "/reiszone",        destination: "/",               permanent: true },
      { source: "/reiszone/:path*", destination: "/",               permanent: true },
    ];
  },
  async headers() {
    return [
      {
        // Apply these headers to all routes in your application.
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
