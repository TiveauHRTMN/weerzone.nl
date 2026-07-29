# Calor implementation plan

Status: repository audit completed  
Audit date: 2026-07-26  
Public launch target: 2026-08-10

## 1. Current architecture

Calor is a standalone Next.js 16.2.10 App Router application on React 19.2.7 and
strict TypeScript. Tailwind CSS 4 provides the existing visual system. Pages are
Server Components by default; onboarding, authentication forms and the trip
album are deliberate client islands.

The application uses:

- PostgreSQL on Supabase through Prisma 7 and `@prisma/adapter-pg`;
- Supabase Auth through `@supabase/ssr`;
- Supabase Storage for private trip media;
- Zod 4 at request and form boundaries;
- Vitest for unit tests and Playwright for mobile/desktop flows;
- Vercel-compatible App Router pages, Server Actions, route handlers and
  `proxy.ts`.

The dependency direction is largely sound:

```text
app/components -> features -> domain
                         \-> database and provider ports
Prisma/Supabase adapters ----------------^
```

Public routes currently include the homepage, a Dominican Republic landing page
and static region pages. Personal preview, dashboard, account, trip, album and
live-day routes are already present and excluded from indexing.

Authentication supports Supabase magic links and Google OAuth. Authenticated
trip reads always include `userId`; trip mutations perform the same ownership
check. Anonymous visitors can build a URL-encoded, validated preview without
persisting personal data. Saving requires authentication.

The normalized database already contains countries, regions, destination
clusters, activities, season windows, sources, trips, stops, travelers,
interests, recommendations, outcomes, travel signals, early analytics,
affiliate offers/clicks and Trip Pass records. Initial migrations enable RLS and
create a private user-scoped Storage bucket.

The Dominican Republic country pack is checked-in seed/reference content. It
keeps local development usable without credentials and explicitly marks seed
and fallback data.

## 2. Repository audit findings

### Routing, rendering and SEO

- App Router only; no Pages Router.
- Public country and region content is server rendered/static.
- Region routes use `generateStaticParams`.
- Root metadata, canonicals, robots, manifest, breadcrumbs and a single sitemap
  exist.
- Personal and preview routes are `noindex`, but staging-wide noindex and
  content-quality gating do not yet exist.
- The public route set is much smaller than the required SEO architecture.
- Structured data exists but is not yet centrally validated or complete.

### Data and state

- There is no global client state library. Form-local state and URL state are
  used appropriately.
- Prisma is the server persistence boundary; country-pack data is the
  deterministic credential-free fallback.
- The existing `Activity` model covers part of the requested travel-option
  contract but does not uniformly represent events, restaurants, beaches,
  shopping, transport, eSIM, accommodation and providers.
- Traveler storage currently captures adults, children and interests, but not
  the complete reusable traveler profile, budget, pace, mobility, food,
  transport and accommodation-area preferences.
- Recommendation rows can persist score snapshots, but the production ranking
  pipeline itself is not implemented.

### Authentication and authorization

- Supabase session refresh is centralized in `proxy.ts`.
- Server-side authentication uses `supabase.auth.getUser()`, not untrusted
  session claims.
- Private Prisma queries scope by both trip ID and user ID.
- RLS protects private reads through Supabase APIs.
- Current RLS is read-oriented; direct authenticated writes are denied and app
  writes rely on the trusted server connection. This must stay explicit and be
  integration-tested.
- `Trip.userId` is nullable for preview handoff, which increases the risk of an
  accidentally orphaned persisted trip. Application writes currently supply an
  owner; the schema should enforce ownership once migrations permit.

### Environment and feature controls

- Environment validation is centralized and server-only.
- Existing flags cover database reads, demos, payments and external providers.
- The requested Calor feature contract is missing.
- Supabase public values are read directly in browser/proxy adapters. This is
  acceptable for public Supabase credentials, but feature decisions must not be
  spread across components.
- Safe defaults are already mostly false; public launch, affiliates, AI,
  live mode, local partners and Weerzone require explicit typed flags.

### Analytics and integrations

- The schema has a small analytics enum and documentation, but there is no
  application-level typed event API, consent gate, attribution store or
  dashboard query.
- No production analytics vendor is wired.
- Affiliate tables are early placeholders; provider adapters, allowlisted
  redirects, impression tracking, conversion/payout state and disabled-feature
  fallbacks are absent.
- No weather/news/event provider integrations or provider composition root exist.
- No AI provider exists. This is safe: deterministic ranking and validated
  template fallback must land first.

### Existing tests and quality

Baseline on 2026-07-26:

- `npm run typecheck`: passed;
- `npm run lint`: passed with one unrelated warning in `.remember/tmp`;
- `npm test`: 12 files and 46 tests passed.

Unit coverage exists for dates, phases, preview parsing/building, trip saving,
ownership query construction, seed data and country-pack integrity. E2E tests
cover onboarding/preview and private route protection. Required ranking,
filters, analytics, affiliate, SEO quality, Today output and attribution tests
are missing.

## 3. Missing components

1. A central `CalorFeatureFlags` service with server-safe defaults and public
   client projection.
2. A complete relational travel-option/provider schema and migration.
3. Full traveler profiles and per-trip preference snapshots.
4. Typed first-party analytics, consent handling and first/last-touch UTM
   attribution.
5. Deterministic eligibility, scoring, diversity and explanation services.
6. A complete `generateDailyTravelPlan` application service.
7. Structured, schema-validated AI wording with a deterministic fallback.
8. Local-provider management and verification flow.
9. Provider-agnostic affiliate adapters and guarded outbound redirects.
10. Reusable SEO templates, quality validator, noindex policy and expanded
    sitemap/schema architecture.
11. Disabled-by-default Weerzone referral and landing attribution.
12. Rate limits, bounded provider retries/timeouts, observability and launch
    health checks.

## 4. Proposed data flows

### Anonymous discovery and trip handoff

```text
public destination page
  -> validated onboarding input
  -> deterministic preview from checked-in/verified data
  -> optional account authentication
  -> server action revalidates input and owner
  -> transactional trip + profile snapshot persistence
```

### Daily recommendation

```text
owned trip + profile + trip day
  -> verified available options
  -> date/age/safety/location hard filters
  -> weather/budget/profile/quality/local scoring
  -> deterministic tie breaks and diversity
  -> immutable score snapshot
  -> optional validated AI wording
  -> deterministic wording fallback
  -> cached Today in Calor plan
```

### Commercial outbound link

```text
recommendation (organic rank)
  -> eligible external offer shown separately
  -> affiliate feature check
  -> server validates provider and destination
  -> click + attribution recorded
  -> sponsored external redirect

feature off -> neutral Calor detail/fallback page
```

### Analytics and attribution

```text
consented interaction
  -> typed allowlisted event
  -> privacy-safe first-party record
  -> optional asynchronous vendor forwarding

landing UTM -> first-touch cookie + last-touch cookie
            -> server-side attribution snapshot on conversion
```

## 5. Database changes and migration order

1. Add Calor enums and normalized providers, options, locations, availability,
   weather suitability and option-source relations.
2. Add traveler profiles, trip preference snapshots and saved generic options.
3. Expand analytics events, attribution fields and idempotency keys.
4. Add local providers, provider-region relations and verification fields.
5. Replace/extend affiliate offer and click structures with campaign,
   placement, conversion, commission, currency and payout state.
6. Add daily-plan and recommendation-reason persistence where caching requires
   it.
7. Add indexes and uniqueness constraints after backfilling compatible existing
   data.
8. Enable RLS on every new table, then add public-read and owner-only policies.
9. Seed the ten launch destinations and verified reference entities
   idempotently.

Migrations must be additive first. Existing UI queries remain supported until
their replacement service is tested. No destructive migration is allowed before
production data inspection and backup.

## 6. Security and privacy risks

- A trusted Prisma connection can bypass non-forced RLS; every private query and
  mutation must retain explicit owner predicates.
- Analytics JSON must use event-specific allowlists to prevent emails, child
  ages, accommodation details or personal URLs from leaking.
- Affiliate redirect endpoints create open-redirect risk and need provider/domain
  allowlists.
- Service-role credentials must never reach client modules.
- Public seed content must not be presented as live availability, live pricing
  or verified current events.
- AI output needs strict schemas and must never alter facts, eligibility, price,
  opening hours or rank.
- Local-provider contact fields require role-controlled administration and
  audit timestamps.
- Public launch and indexing need environment-aware fail-closed behavior.
- Server Actions require Zod validation, authentication, ownership and bounded
  payload sizes.
- Attribution cookies and first-party analytics require consent and documented
  retention.

## 7. Technical debt

- Product copy and some source files contain mojibake characters.
- Earlier architecture documents still use the TripFit working name.
- Prisma is imported by some feature services despite the documented repository
  port boundary.
- Existing RLS migration comments and actual server behavior need integration
  verification against Supabase.
- The Playwright production-server script assumes a prior build.
- Lint includes `.remember/tmp`, causing an unrelated warning.
- Sitemap host values are hardcoded instead of derived from validated deployment
  configuration.
- Live-day currently falls back to catalog order rather than a real ranking
  engine and does not yet produce morning/afternoon/evening plans.

## 8. Test strategy

- Pure unit tests for all filters, score factors, deterministic ordering,
  diversity, quality gating, feature flags, URL building, AI schemas/fallback
  and attribution parsing.
- Repository integration tests against a dedicated Supabase/PostgreSQL test
  database for RLS, ownership, transactions, click idempotency and analytics.
- Route/service tests for affiliate-disabled behavior, outbound allowlists,
  noindex rules, sitemaps and Today plan generation.
- Playwright tests for anonymous preview, account handoff, saved trip, Today,
  public SEO routes, disabled commercial UI, referral landing and accessibility
  smoke checks.
- Quality gate order: typecheck, lint, unit/integration tests, production build,
  E2E, launch-check script.

## 9. Launch blockers

- Production Supabase project, connection URLs and validated migrations.
- Verified RLS behavior and database backup policy.
- Complete verified launch content for the ten named destinations.
- Real weather/news/events sources and freshness/timeout policy.
- Consent, privacy statement, affiliate disclosure and retention policy.
- Error monitoring and health endpoint.
- Production analytics decision and consent-aware configuration.
- Staging-wide noindex and production-only launch flag.
- Broken-link, metadata, image and mobile checks.
- KvK/commercial readiness and provider agreements before affiliates.
- Mollie production credentials and legal readiness before payments. Payments
  remain out of scope for phase-one external services and disabled by default.

## 10. Execution order

Implementation follows the requested order without redesign:

1. central feature flags;
2. additive database/data-model migrations;
3. trips and profiles;
4. analytics and attribution;
5. deterministic ranking;
6. Today in Calor;
7. local providers;
8. affiliate adapters;
9. public SEO architecture;
10. Weerzone referral;
11. performance and reliability;
12. launch documentation and full validation.

