@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Next.js dev server (default http://localhost:3000)
- `npm run build` — generates the sitemap (`scripts/gen-sitemap.ts` via tsx) then runs `next build`. The sitemap step is part of the build; it is not optional.
- `npm start` — production server (after `build`)
- One-off scripts in `scripts/` and root (`check-metrics.ts`, `proxy.ts`, etc.) are run with `npx tsx <file>`. There is no test runner, lint script, or formatter configured — don't invent one.

## Stack

- Next.js 16 (App Router) + React 19 — see `AGENTS.md`: APIs may differ from training-data Next.js. Consult `node_modules/next/dist/docs/` before assuming behavior.
- Tailwind CSS v4 (PostCSS plugin, no `tailwind.config.*` — config is inline in `globals.css`).
- TypeScript with `@/*` → `src/*` path alias.
- Supabase (SSR + admin clients in `src/lib/supabase/{client,server,admin}.ts`, plus a legacy `src/lib/supabase.ts` `getSupabase()` used by server components like `layout.tsx`). SQL schemas live in `supabase/*.sql` and `supabase/migrations/`.
- Auth via Supabase magic links (`src/app/auth`, `src/components/AuthGate.tsx`, `AuthShell.tsx`).
- Payments: Mollie (`src/lib/mollie.ts`, `src/app/api/checkout-persona`, `src/app/api/webhooks`).
- Email: Resend + React Email templates (`src/lib/*-email.ts`, `supabase/email-templates/`).
- LLMs/AI: Anthropic SDK, OpenAI, Google Generative AI — used by the orchestrators below.
- Analytics: PostHog (`src/instrumentation-client.ts`, `PostHogPageView.tsx`).

## Architecture

This is **WEERZONE** (`weerzone.nl`) — a Dutch hyperlocal weather product with affiliate, B2B, and persona-subscription monetization layered on top.

User-facing copy is Dutch. See `memory/feedback_tone.md`: net taalgebruik, no meteorology jargon.

### Routing layout (`src/app/`)

App Router with parallel feature areas, each typically owning its own `page.tsx` plus colocated server actions:
- `homepage/`, `weer/`, `widget/`, `embed/` — weather UI surfaces
- `piet/`, `reed/` — persona-driven experiences (paid tier)
- `zakelijk/`, `prijzen/` — B2B / pricing
- `admin/`, `debug/` — internal tooling
- `auth/`, `contact/`, `privacy/`, `social/` — supporting pages
- `api/` — route handlers; notable groups: `wws/` (truth/orchestrator endpoints), `cron/` (scheduled jobs), `webhooks/` (Mollie + others), `affiliate/`, `amazon/`, `b2b/`, `chat/`, `commentary/`, `share/`, `subscribe/`, `unsubscribe/`, `visuals/`
- `actions.ts` — top-level server actions
- `opengraph-image.tsx`, `not-found.tsx`, `ads.txt`, `providers.tsx`

`layout.tsx` is **async** and reads `system_state` from Supabase to render an optional global `AffiliateBanner`. It mounts `WzNavbar`, `CookieBanner`, `InstallPrompt`, `FounderBanner`, `GlobalPersonaModal`, and a Suspense-wrapped `PostHogPageView` inside `Providers`.

### `src/lib/` — domain logic

Functionality is split into small modules rather than a service layer. Notable clusters:
- **Weather**: `weather.ts`, `weatherCache.ts`, `climate.ts`, `commentary.ts`
- **Affiliates / Amazon / Bol**: `affiliates.ts`, `affiliate-orchestrator.ts`, `amazon-{catalog,live,matcher,paapi}.ts`, `bol.ts`, `smart-affiliate-email.ts`
- **B2B pipeline**: `b2b-{discovery,emails,relevance}.ts`, `wws-business-orchestrator.ts`
- **Personas / subscriptions**: `personas.ts`, `persona-{brief,email}.ts`
- **WWS truth/orchestrator pipeline**: `wws-truth-server.ts`, `wws-orchestrator.ts` — these wire LLMs to weather + place data
- **Places / location**: `places.json`, `places-data.ts`, `location-cookies.ts`
- **Cross-cutting**: `seo.ts`, `analytics.ts`, `agent-logger.ts`, `social-proof.ts`, `impact-engine.ts`, `session-context.tsx`, `types.ts`

When adding logic, prefer extending an existing `lib/*.ts` file over introducing a new abstraction layer.

### Components (`src/components/`)

Flat directory of feature components (no `ui/` subfolder convention). The `wz/` subfolder holds the global navbar (`WzNavbar`). Persona/paywall flow centers on `GlobalPersonaModal`, `PersonaModal`, `PersonaCard`, `PremiumGate`, `AuthGate`.

### Scripts (`scripts/`)

Operational tsx scripts (sitemap gen, place ingestion, SEO batches, Google ping, affiliate stats). They share `src/lib` modules and assume env vars are loaded (most use `dotenv`).

## Conventions specific to this repo

- `next.config.ts` is empty — there are no rewrites/headers/image config to honor. Add config there if needed; don't sprinkle it elsewhere.
- The `src/pages/` directory exists alongside `src/app/`; check both when locating a route.
- Three Supabase entry points coexist (`lib/supabase.ts`, `lib/supabase/{client,server,admin}.ts`). Match the one already used in the file you're editing rather than swapping clients.
- The build step pre-generates `public/sitemap.xml` from `scripts/gen-sitemap.ts`. Editing routes that should appear in the sitemap means updating that script too.
