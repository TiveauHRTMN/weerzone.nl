@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Next.js dev server (default http://localhost:3000)
- `npm run build` — `next build`. `typescript.ignoreBuildErrors: true` is set in `next.config.ts`, so a green build does **not** mean type-clean. Run `npx tsc --noEmit` separately when type-correctness matters.
- `npm start` — production server (after `build`)
- `npm run script:youtube` — only npm-defined script besides `next`. Everything else in `scripts/` and the loose root files (`check-metrics.ts`, `proxy.ts`, `test-buffer.ts`, `test-db-faq.ts`) runs via `npx tsx <file>`. Most assume env vars are loaded — they use `dotenv` internally.
- Playwright is installed (`@playwright/test`, `playwright.config.ts`, `tests/`). Run with `npx playwright test`. There is currently one example spec; the repo has no other test runner, lint script, or formatter — don't invent one.

## Stack

- Next.js 16 (App Router) + React 19 — see `AGENTS.md`: APIs may differ from training-data Next.js. Consult `node_modules/next/dist/docs/` before assuming behavior.
- Tailwind CSS v4 (PostCSS plugin, no `tailwind.config.*` — config is inline in `src/app/globals.css`).
- TypeScript with `@/*` → `src/*` path alias.
- Supabase — three coexisting entry points; match the one the file already uses:
  - `src/lib/supabase.ts` `getSupabase()` (legacy, used by server components like `layout.tsx`)
  - `src/lib/supabase/{client,server,admin}.ts` (SSR cookie-aware + service-role admin)
  - SQL lives in `supabase/*.sql` and `supabase/migrations/`
- Auth: Supabase magic links (`src/app/(site)/auth`, `AuthShell.tsx`, `wz/WzAuthShell.tsx`); auth-page copy + locale lives in `src/lib/auth-i18n.tsx`
- Payments: Mollie (`src/lib/mollie.ts`, `(site)/api/checkout-persona`, `(site)/api/webhooks`)
- Email: Resend + React Email templates (`src/lib/*-email.ts`, `supabase/email-templates/`)
- LLMs/AI: Anthropic SDK, OpenAI, Google Generative AI — wired through the orchestrators in `src/lib`
- Analytics: PostHog (`src/instrumentation-client.ts`, `PostHogPageView.tsx`), Vercel Analytics + Speed Insights

## Architecture

This is **WEERZONE** (`weerzone.nl`) — a Dutch hyperlocal weather product with affiliate, B2B, persona-subscription, and a travel sub-brand (Reiszone) layered on top.

User-facing copy is Dutch (or the locale's language). Tone rules in `memory/feedback_tone.md` and `memory/feedback_weerzone_tone.md`.

### Locale (NL-only)

**The product is NL-only.** The DE/FR/ES/BE/LU locales were removed in the v2 agent-first relaunch — their page routes, sitemaps, persona endpoints (Karl/Luc), forecast libs, and pulse banners are all deleted. `src/config/locales.ts` and `src/lib/hreflang.ts` still exist but are soft-disabled: the `Locale` type still names `de | fr | es` and `LOCALES` still has those keys, yet every one resolves to NL, `detectLocale()` always returns `"nl"`, and hreflang only ever emits `nl-NL` + `x-default`. Collapsing the type back to `"nl"` is a deliberate follow-up (it touches ~12 files via `=== "de"` checks and can't be verified until `tsc --noEmit` is unbroken). Don't add new locales.

Personas are now the four agents (Piet/Reed/Koos/Steve), not language variants — see `src/lib/agents/` and the spec in `docs/superpowers/specs/`.

### Routing layout (`src/app/`)

The root `layout.tsx` is async, reads `system_state` from Supabase, and renders the global `SiteShell` (which owns the navbar/footer/banners). All user-facing pages live under the `(site)` route group; that group's `layout.tsx` is a pass-through (a duplicate shell there caused double-render under PPR streaming — see the comment in that file).

Inside `(site)/`:
- `page.tsx`, `mijnweer`, `weer/`, `waarschuwingen/`, `widget/`, `embed/`, `jouwweer/`, `vergelijken/` — weather UI surfaces
- `reiszone/` — travel sub-brand (`[province]`, `[theme]`, `weatherpromise`)
- `magnolia/` — internal/partner area (separate `layout.tsx`)
- `zakelijk/`, `prijzen/`, `steun/` — B2B / pricing / support
- `admin/`, `debug/` — internal tooling
- `auth/`, `contact/`, `privacy/`, `over/`, `social/` — supporting pages
- `api/` — see below

Legacy `/piet` and `/reed` are 301'd to `/mijnweer` and `/waarschuwingen` via `next.config.ts` `redirects()`. Use the new paths.

`src/pages/` does **not** exist — App Router only.

### API routes (`src/app/(site)/api/`)

Notable groups:
- `wws/` — truth/orchestrator endpoints (LLM-driven weather narrative)
- `cron/` — scheduled jobs, registered in `vercel.json` (`crons[]`). When adding a cron handler, also register it in `vercel.json` or it won't fire.
- `webhooks/` — Mollie + others
- `knmi-*` (radar, station, warnings, forecast, climate), `dwd-*` (DE warnings), `mariana/` (SEO content agent), `magnolia/` (partner)
- `piet-weerbericht` — persona forecast endpoint (the DE `karl-wetterbericht` and FR `luc-bulletin` endpoints were removed with the foreign locales)
- `affiliate/`, `amazon/`, `b2b/`, `chat/`, `commentary/`, `share/`, `subscribe/`, `unsubscribe/`, `visuals/`, `indexnow/`, `wkpoule/`, `nearest-place/`

### `src/lib/` — domain logic

Functionality is split into small flat modules rather than a service layer. Notable clusters:
- **Weather data**: `weather.ts`, `weatherCache.ts`, `climate.ts`, `external-ai-weather.ts`, `google-weather.ts`, `knmi-edr.ts`, `knmi-warnings.ts`, `dwd-briefing.ts`, `dwd-warnings.ts`, `estofex.ts`
- **Persona forecasts**: `personas.ts`, `persona-brief.ts`, `persona-email.ts`, `piet-briefing.ts`, `piet-forecast.ts` (the DE `karl-forecast.ts` was removed with the foreign locales)
- **Affiliates / Amazon / Bol**: `affiliates.ts`, `affiliate-orchestrator.ts`, `amazon-{catalog,live,matcher,paapi}.ts`, `bol.ts`, `smart-affiliate-email.ts`
- **B2B pipeline**: `b2b-{discovery,emails,relevance}.ts`, `wws-business-orchestrator.ts`
- **WWS truth/orchestrator pipeline**: `wws-truth-server.ts`, `wws-orchestrator.ts` — wire LLMs to weather + place data
- **Reiszone (travel sub-brand)**: `reiszone-{accommodation,commerce,intelligence,routing,themes}.ts`, `weatherpromise.ts`
- **Places / location**: `places.json`, `places-data.ts`, `location-cookies.ts`, `location-profile.ts`, `persist-city.ts`
- **SEO / discovery**: `seo.ts`, `schema.ts`, `hreflang.ts`, `indexnow.ts`, `sitemap-data.ts`
- **Cross-cutting**: `analytics.ts`, `agent-logger.ts`, `social-proof.ts`, `impact-engine.ts`, `risk-analysis.ts`, `session-context.tsx`, `types.ts`

When adding logic, prefer extending an existing `lib/*.ts` file over introducing a new abstraction layer.

### Components (`src/components/`)

Flat directory of ~90 feature components — no `ui/` subfolder convention. The `wz/` subfolder owns the global chrome (`SiteShell` mounts `wz/GlobalNav`, `WzFooter`, etc.). Persona/paywall flow centers on `GlobalPersonaModal`, `PersonaModal`, `PersonaCard`, `PremiumGate`. (The locale-specific pulse banners `BEPulse`/`DEPulse`/`ESPulse`/`FRPulse`/`LuxPulse` were removed with the foreign locales.)

### Scripts (`scripts/`)

Operational tsx (+ a few `.py`) scripts: sitemap gen, place ingestion (`ingest-*`, `seed-*`, `harvest-*`, `discover-*`, `refine-*`), SEO batches (`hermes-batch-seo`, `seo-status`, `check-seo-full`), Google ping (`ping-google`), persona testing (`test-*`), YouTube script generation. They share `src/lib` modules and assume env vars are loaded.

### Sibling top-level directories

The repo root holds adjacent projects that share infra but ship independently — do **not** edit them as part of Weerzone work unless asked:
- `magnolia/` — Python codebase (separate product, partly mirrored by the `(site)/magnolia` UI)
- `paperclip-hq/`, `hermes-agent-main/`, `agents/`, `pipeline/`, `youtube-scripts/`, `skills/` — agent infra and content pipelines

## Conventions specific to this repo

- `next.config.ts` is **not** empty: it sets a Report-Only CSP, full security header bundle, legacy redirects (`/homepage`, `/piet`, `/reed`, `/reisweer/*`), `trailingSlash: false`, `typescript.ignoreBuildErrors: true`, and `experimental.cpus: 1`. Add new headers/rewrites/redirects here, not ad-hoc in routes.
- Sitemaps (NL-only): the index lives at `src/app/sitemap.xml/route.ts` and points at two child routes — `sitemap-static.xml/route.ts` and `sitemap-nl.xml/route.ts`. All builders live in `src/lib/sitemap-data.ts` (`SITEMAP_FILES`, `buildSitemapIndex`, `buildStaticSitemap`, `buildNLSitemap`). The foreign child routes (`sitemap-be/de/de-east/es/fr/lu`) and their `public/` snapshots were deleted. `scripts/gen-sitemap.ts` regenerates the three `public/*.xml` snapshots (`npx tsx scripts/gen-sitemap.ts`) — **not** wired into `npm run build`. Note `public/sitemap.xml` exists and **overrides** the dynamic route, so keep it in sync (it currently matches). Prefer editing `sitemap-data.ts`.
- Cron jobs only fire if listed in `vercel.json`. Creating a route under `(site)/api/cron/` is not enough.
- NL-only: don't add per-locale routes or strings. `src/config/locales.ts` is soft-disabled (everything resolves to NL) — see the "Locale (NL-only)" section above.
- When touching auth or layouts, remember the root layout already mounts `SiteShell`. The `(site)` layout is intentionally a pass-through to avoid double-rendering under PPR streaming.
- `tsconfig`'s `ignoreBuildErrors` is real — local `tsc --noEmit` is the only signal you have for type drift.
