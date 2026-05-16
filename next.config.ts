import type { NextConfig } from "next";

// Content-Security-Policy in report-only mode — meet eerst de violations
// (PostHog, AdSense, Supabase, Mollie inline scripts/connects), schakel daarna
// pas over op enforcement door de header te hernoemen naar "Content-Security-Policy".
const cspReportOnly = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://*.posthog.com https://*.googlesyndication.com https://*.googletagservices.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://*.posthog.com https://pagead2.googlesyndication.com https://*.googlesyndication.com",
  "frame-src https://googleads.g.doubleclick.net https://www.google.com https://*.youtube.com https://*.youtube-nocookie.com",
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
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    cpus: 1,
  },
  async redirects() {
    return [
      { source: "/homepage", destination: "/", permanent: true },
      { source: "/piet", destination: "/mijnweer", permanent: true },
      { source: "/reed", destination: "/waarschuwingen", permanent: true },
    ];
  },
  webpack(config) {
    return config;
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
