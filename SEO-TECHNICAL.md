# Technical SEO Audit — weerzone.nl

**Audit date:** 2026-05-16
**Scope:** Live site (https://weerzone.nl) + local source (`C:\Users\rwnhr\kutweer`)
**Tooling:** curl HEAD/GET, source-file review, public robots/sitemap/llms endpoints. CrUX field data not available (no API key in this session).

---

## Technical Score: **72 / 100**

Solid SSR foundation, robust security headers, AI crawlers welcomed correctly, and a working dynamic sitemap-index. The score is dragged down by (1) no `hreflang` despite live `/de/` and `/fr/` locales, (2) `robots.ts` listing fewer sitemaps than the live sitemap-index, (3) no IndexNow, (4) no CSP header, and (5) `force-dynamic` root layout that disables HTML caching site-wide.

---

## Category Breakdown

| Category         | Status | Score   |
| ---------------- | ------ | ------- |
| Crawlability     | warn   | 75/100  |
| Indexability     | warn   | 70/100  |
| Security         | warn   | 80/100  |
| URL Structure    | pass   | 90/100  |
| Mobile           | pass   | 95/100  |
| Core Web Vitals  | warn   | 60/100  |
| Structured Data  | pass   | 85/100  |
| JS Rendering     | pass   | 90/100  |
| IndexNow         | fail   | 0/100   |

---

## 1. Crawlability — 75/100 (warn)

**Live `https://weerzone.nl/robots.txt`:**
- `User-agent: *` allowed at root, disallowed: `/api/`, `/admin/`, `/auth/`, `/app/`, `/*?*`
- AI crawlers explicitly allowed: `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`, `PerplexityBot`
- Training-only crawler blocked: `CCBot`
- `Bingbot crawl-delay: 1`

**Issues:**

1. **Sitemap mismatch between robots.txt and sitemap-index.** `src/app/robots.ts:22-28` lists 5 sitemaps (root, static, nl, be, de) but the live `sitemap.xml` index references 6 (adds `sitemap-fr.xml` + `sitemap-lu.xml`). Both extra sitemaps return `200 OK`, so they're indexable via the index — but search engines that read `robots.txt` for sitemap discovery will miss the FR + LU files.
   **Fix:** add to `src/app/robots.ts`:
   ```ts
   sitemap: [
     "https://weerzone.nl/sitemap.xml",
     "https://weerzone.nl/sitemap-static.xml",
     "https://weerzone.nl/sitemap-nl.xml",
     "https://weerzone.nl/sitemap-be.xml",
     "https://weerzone.nl/sitemap-de.xml",
     "https://weerzone.nl/sitemap-fr.xml",
     "https://weerzone.nl/sitemap-lu.xml",
   ],
   ```

2. **`Disallow: /*?*` is overly broad.** It blocks every URL containing a query string, including UTM-tagged campaign URLs, AdSense referral params, and any `?ref=...` affiliate links. Search engines won't index them (they'd see a noindex-equivalent via the disallow). If you want canonicalisation rather than blocking, drop this rule and rely on `<link rel="canonical">` (which is already present).
   **Fix:** remove `"/*?*"` from the `disallow` array in `src/app/robots.ts:9`.

3. **AdSense crawler (`Mediapartners-Google`) not explicitly allowed.** It falls through to the `*` rule, which means query-string URLs and `/api/`-style paths are inadvertently blocked from ad serving inspection. Add an explicit allow:
   ```ts
   { userAgent: "Mediapartners-Google", allow: "/" },
   ```

4. **Google-Extended (Gemini training) is not blocked.** Today it falls through to the `*` rule which `allow: /`s. Decide intentionally — if you don't want your content used for Gemini training while still being eligible for Google Search + AI Overviews, add:
   ```ts
   { userAgent: "Google-Extended", disallow: "/" },
   ```

---

## 2. Indexability — 70/100 (warn)

**Confirmed in live homepage HTML:**
- `<link rel="canonical" href="https://weerzone.nl"/>` ✓ (self-referencing)
- `<title>WEERZONE - Hyperlokaal weer voor vandaag en morgen</title>` ✓
- Meta description present ✓
- No `<meta name="robots" content="noindex">` ✓
- 3× `application/ld+json` blocks in initial HTML ✓

**Issues:**

1. **No `hreflang` tags despite live `/de/` and `/fr/` locales.** The site serves Dutch (`/`), German (`/de/`), French (`/fr/`), and LU sitemaps exist. Without `hreflang`, Google treats these as competing duplicates rather than language variants. Add to `metadata.alternates.languages` in `src/app/(site)/page.tsx` and the equivalent locale roots:
   ```ts
   alternates: {
     canonical: "https://weerzone.nl",
     languages: {
       "nl-NL": "https://weerzone.nl",
       "nl-BE": "https://weerzone.nl",
       "de-DE": "https://weerzone.nl/de",
       "fr-FR": "https://weerzone.nl/fr",
       "x-default": "https://weerzone.nl",
     },
   },
   ```
   And mirror per locale on `/de/page.tsx` and `/fr/page.tsx`.

2. **`/homepage` redirect is declared in three places.** `next.config.ts:41` declares a `permanent: true` redirect, AND `src/app/(site)/homepage/page.tsx` still exists with `permanentRedirect("/")` and `robots.index: false`. The next.config redirect wins (handled before page resolution), so the page file is dead code. Remove `src/app/(site)/homepage/` to avoid future confusion.

3. **Disallow:`/api/` + JSON-LD search action.** The WebSite schema in `src/app/(site)/page.tsx` exposes a SearchAction. Confirm it doesn't point at an `/api/` URL (which is blocked); if it does, move the search-target outside `/api/`.

---

## 3. Security — 80/100 (warn)

**Live response headers (from `curl -I https://weerzone.nl/`):**

| Header | Value | Status |
| --- | --- | --- |
| Strict-Transport-Security | `max-age=63072000; includeSubDomains; preload` | ✅ |
| X-Frame-Options | `DENY` | ✅ |
| X-Content-Type-Options | `nosniff` | ✅ |
| Referrer-Policy | `strict-origin-when-cross-origin` | ✅ |
| Permissions-Policy | `camera=(), microphone=(), geolocation=(self), browsing-topics=()` | ✅ |
| Content-Security-Policy | *not set* | ❌ |
| X-Powered-By | `Next.js` | ⚠️ (info disclosure) |

**Fixes:**

1. **Add a CSP.** Even a starter `report-only` CSP is useful. Because of inline JSON-LD + AdSense + PostHog + Mollie, you'll need `script-src` allowances. Add to `next.config.ts:4-29`:
   ```ts
   {
     key: "Content-Security-Policy-Report-Only",
     value: [
       "default-src 'self'",
       "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://*.posthog.com",
       "style-src 'self' 'unsafe-inline'",
       "img-src 'self' data: https:",
       "connect-src 'self' https://*.supabase.co https://*.posthog.com https://pagead2.googlesyndication.com",
       "frame-src https://googleads.g.doubleclick.net https://www.google.com",
       "frame-ancestors 'none'",
     ].join("; "),
   },
   ```
   Watch the report endpoint for a week, then switch to enforcement.

2. **Strip `X-Powered-By`.** Add `poweredByHeader: false` to `next.config.ts:31`. Minor, but it removes a fingerprinting signal.

3. **HSTS already preload-eligible** (`max-age 63072000`, `includeSubDomains`, `preload`). Verify weerzone.nl is on the [HSTS preload list](https://hstspreload.org/?domain=weerzone.nl) and submit if not.

---

## 4. URL Structure — 90/100 (pass)

- ✅ Clean hierarchical URLs: `/weer/{province}/{place}`, `/weer/themas/{slug}`, `/de/wetter/{bundesland}/{ort}`
- ✅ Hyphenated slugs
- ✅ No query-string-based content URLs
- ✅ HTTP→HTTPS via `308 Permanent Redirect`
- ✅ `www` → apex via `307 Temporary Redirect`
- ⚠️ The www→apex is a 307, not a 301/308. Search engines treat it as ambiguous (the redirect can change). On Vercel, this is configured via the dashboard's "redirect to" toggle — verify it's set to "Permanent (308)" rather than the temp default.

---

## 5. Mobile — 95/100 (pass)

- ✅ `<meta name="viewport" content="width=device-width, initial-scale=1"/>` in initial HTML
- ✅ Tailwind v4 responsive utilities throughout components
- ✅ `<meta name="theme-color" content="#0f172a"/>` in root layout
- Could not verify touch-target sizing without browser rendering. Per recent commits (`perf(cookie-banner): shrink mobile banner to single-row pill`, `style(nav): unify hamburger menu`), mobile is being actively maintained.

---

## 6. Core Web Vitals — 60/100 (warn, unmeasured)

**Not measured in this audit** (no CrUX API key available — the request returned `API_KEY_INVALID`). Recommend running PageSpeed Insights manually at https://pagespeed.web.dev/?url=https%3A%2F%2Fweerzone.nl%2F to get field data.

**Predictive concerns from the HTML payload:**

1. **`Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`** on every HTML response (including deep weather pages). Root layout is `export const dynamic = "force-dynamic"` (`src/app/layout.tsx:66`), so every visit is a fresh SSR — no CDN HTML caching. This inflates TTFB and makes LCP worse for repeat visitors. Consider:
   - Splitting personalization (location cookie, Supabase fetch) into a client component, then making the layout statically rendered with PPR/`use cache` (Next 16 cache components — see CLAUDE.md).
   - Or using `revalidate = 60` instead of `force-dynamic` so HTML is cacheable for at least a minute.

2. **HTML payload is 170 KB** on the homepage. About 15 async script chunks are preloaded in `<head>`. AdSense loader was just added (preloaded with `fetchPriority="low"` correctly), but the chunk count suggests bundle-splitting could be more aggressive.

3. **LCP candidate is `/brand/weerzone-logo.png`** (preloaded via `<link rel="preload" as="image" imageSrcSet>`). Good — but verify it's served as AVIF/WebP via Next.js image optimization (the preload uses `/_next/image?url=...` so it should be).

4. **INP risk: AdSense initialization.** The new `<Script strategy="afterInteractive">` for `adsbygoogle.js` plus the in-page `<AdSenseSlot>` push will cause a third-party JS task spike after hydration. Monitor INP in CrUX once AdSense serves real ads. Consider `strategy="lazyOnload"` if INP regresses.

---

## 7. Structured Data — 85/100 (pass)

**Detected in initial HTML (`<script type="application/ld+json">`):**
- `Organization` (with `sameAs` links to YouTube, X, Instagram, TikTok, Reddit, Wikidata Q139675943)
- `WebApplication` (category `WeatherApplication`, includes `offers` price 0)
- `WebSite` (homepage-specific)
- `SearchAction` (via `schemaSearchAction()` in `src/lib/seo.ts`/`schema.ts`)

**Recommendations:**

1. **Add `BreadcrumbList`** on `/weer/{province}/{place}` pages. Easy win for SERP breadcrumbs.
2. **Add `WeatherForecast`** structured data (Schema.org) on weather pages — there is no standard `WeatherForecast` in schema.org, but you can use a custom `Dataset` or `Article` with `temporalCoverage` to expose the 48h horizon.
3. **Add `FAQPage`** to `/over` (FAQ section already exists per `llms.txt` reference) — but use sparingly per Google's December 2025 guidance (FAQ rich results are only shown for `gov/edu/well-known authoritative sites`).
4. **Verify SearchAction `target` URL is crawlable** — see Indexability #3.

---

## 8. JS Rendering — 90/100 (pass)

- ✅ Critical SEO elements in initial server-rendered HTML: title, meta description, canonical, JSON-LD, viewport, theme-color
- ✅ Body content includes weather copy server-side (verified via raw HTML — "WEERZONE" appears 140× in the unrendered HTML, indicating content not deferred to client)
- ✅ Next.js 16 App Router with `force-dynamic` = pure SSR on every request
- ⚠️ Per Google's December 2025 JS-SEO update: canonical, robots meta, and structured data are all in the initial HTML response, so no JS-injection ambiguity. Good.
- ⚠️ AdSense `<ins class="adsbygoogle">` requires JS to render — but it's not SEO content, so this is fine.

---

## 9. IndexNow — 0/100 (fail)

- ❌ No `/api/indexnow` endpoint (`src/app/api/indexnow/` does not exist)
- ❌ No IndexNow verification key file in `public/` (only `ads.txt` and `llms.txt` present)

**Why it matters:** IndexNow pushes URL updates to Bing, Yandex, Naver, and Seznam instantly. For a site with thousands of weather location pages and frequently changing forecast content, this would dramatically reduce indexing lag on non-Google engines.

**Fix:**

1. Generate a key: e.g., `weerzone-indexnow-{32-char-uuid}`.
2. Drop the key value into `public/{key}.txt` containing just the key string.
3. After deploys / content publishes, POST to `https://api.indexnow.org/indexnow`:
   ```json
   {
     "host": "weerzone.nl",
     "key": "your-key",
     "keyLocation": "https://weerzone.nl/your-key.txt",
     "urlList": ["https://weerzone.nl/weer/...", ...]
   }
   ```
4. Wire it into the existing `scripts/` workflow that runs after sitemap regeneration.

---

## Critical Issues (fix immediately)

1. **Add `hreflang` alternates** for `nl-NL`, `nl-BE`, `de-DE`, `fr-FR`, `x-default`. Without it, the DE/FR locales compete with the NL root.
2. **Add `Mediapartners-Google` allow** to `src/app/robots.ts` so AdSense crawler isn't caught by `/*?*` disallow.

## High Priority (fix within 1 week)

3. **Sync sitemap list in `robots.ts`** to include FR + LU (currently missing 2 of 6 sitemaps).
4. **Remove the overly broad `Disallow: /*?*`** rule. It blocks every UTM-tagged or affiliate URL from indexing without giving you any benefit `<link rel="canonical">` doesn't already provide.
5. **Add Content-Security-Policy** (start with `Content-Security-Policy-Report-Only`).
6. **Remove the dead `/homepage` page** at `src/app/(site)/homepage/page.tsx` — `next.config.ts` already redirects it.
7. **Decide on Google-Extended** — add explicit allow or disallow rather than relying on the wildcard fallthrough.

## Medium Priority (fix within 1 month)

8. **Implement IndexNow.** Quick win for Bing visibility on a content-rich site.
9. **Replace `force-dynamic` root layout** with a hybrid pattern: static shell + client-side personalization (or `revalidate = 60`). Will unlock HTML caching and improve TTFB/LCP.
10. **Add `BreadcrumbList`** structured data to weather location pages.
11. **Submit weerzone.nl to the HSTS preload list** at https://hstspreload.org/?domain=weerzone.nl.
12. **Set `poweredByHeader: false`** in `next.config.ts`.

## Low Priority (backlog)

13. Audit `experimental.cpus: 1` in `next.config.ts:37` — this caps the Next build to a single CPU and slows builds. Likely was set during a memory issue; revisit when local hardware allows.
14. Consider verifying the www→apex redirect is 308 not 307 (Vercel project setting).
15. Once AdSense is live, monitor INP regressions and consider `Script strategy="lazyOnload"` for `adsbygoogle.js`.
