# TripFit architecture

Status: accepted baseline for Slice 1
Last updated: 2026-07-12

## 1. Technical inventory

TripFit started as an empty directory inside the existing `kutweer` Git worktree. The parent project is unrelated and already contains uncommitted work. TripFit is therefore a self-contained npm project with its own `package.json`, lockfile, configuration, source tree and tests. Commands and commits must remain scoped to `tripfit/`.

The initial runtime baseline is:

- Next.js 16.2.10, App Router and Turbopack;
- React 19.2 and TypeScript in strict mode;
- Tailwind CSS 4;
- Node.js 24 LTS as the production target;
- no inherited configuration or source code from the parent application.

The Next.js 16.2.10 guides in `node_modules/next/dist/docs/` are authoritative. In particular, request APIs (`params`, `searchParams`, `cookies()` and `headers()`) are asynchronous, pages and layouts are Server Components by default, `middleware.ts` has been replaced by `proxy.ts`, and linting is a separate command because `next build` no longer runs it.

## 2. Architectural goals

TripFit is a living-trip platform, not a content portal. The architecture optimizes for five properties:

1. recommendations are deterministic, explainable and testable;
2. country content is replaceable through country packs, never embedded in React components;
3. live data providers are replaceable and always expose provenance and fallback state;
4. anonymous preview works without external credentials, while saved trips can move to Supabase safely;
5. every recommendation decision and user outcome can later be reconstructed.

## 3. System context

```text
Browser
  -> Next.js App Router (public pages, private trip shell, route handlers)
      -> application use cases
          -> domain rules (trip phase, season, ranking, pricing)
          -> repository ports
          -> provider ports
      -> infrastructure adapters
          -> PostgreSQL on Supabase through Prisma
          -> Supabase Auth (Slice 2)
          -> seed/mock providers (default)
          -> external providers (later, behind feature flags)
```

No UI component may import Prisma, Supabase or a vendor SDK. UI invokes application use cases; use cases depend on interfaces; infrastructure provides implementations.

## 4. Source layout and dependency direction

```text
src/
  app/                         # routes, layouts, metadata and route handlers
  components/                  # reusable presentation primitives
  features/
    onboarding/                # progressive trip input and validation feedback
    trip-preview/              # anonymous personalized preview
    destinations/              # public country and region presentation
  domain/
    countries/                 # CountryPack and coverage contracts
    trips/                     # living trip, route stops and phase rules
    activities/                # activity, season and weather contracts
    ranking/                   # deterministic scoring (Slice 3)
  providers/                   # provider ports and seed/mock adapters
  db/                          # Prisma boundary and repositories
  lib/                         # cross-cutting utilities without domain policy
  config/                      # validated environment and feature flags
prisma/
  schema.prisma                # PostgreSQL source of truth
  seed.ts                      # idempotent country-pack seed
tests/
  unit/                        # pure domain and use-case tests
  e2e/                         # browser-critical flows
```

Dependencies point inward:

```text
app/components -> features -> domain
                         \-> repository/provider ports
infrastructure adapters ------^ (implement ports)
```

`domain/` is framework-free TypeScript. React state, database calls and HTTP concerns are forbidden there.

## 5. Country-pack model

A country pack is the deployment-independent content boundary:

```ts
interface CountryPack {
  country: Country;
  regions: Region[];
  destinationClusters: DestinationCluster[];
  nationalContext: NationalContext;
  sourceCoverage: SourceCoverage;
}
```

Regions carry `FLAGSHIP`, `STANDARD` or `BASIC` coverage. Slugs, coordinates, aliases and preview highlights live in pack data. Components receive normalized country-pack view models and cannot branch on `dominican-republic`, Punta Cana or any other region name. Adding a Caribbean country means registering another pack, not changing the onboarding or preview components.

The Dominican Republic pack is the first implementation. Its three flagship regions are Punta Cana / Bávaro, Santo Domingo and Samaná / Las Terrenas. Standard and basic regions are represented from Slice 1; the deep activity catalog is intentionally completed in Slice 3.

## 6. Living-trip model

`Trip` is the aggregate root. It owns exact travel dates, travelers, interests and an ordered list of `TripStop` values. Stops may not overlap and must fall inside the trip interval. Every stop references a country-pack region and has its own arrival and departure date.

Dates are represented as ISO calendar dates (`YYYY-MM-DD`) at the domain boundary. They are converted to instants only at provider/database edges, preventing timezone shifts in travel days. The trip phase is derived, never manually edited:

```text
days until arrival > 42       PLANNING_LONG_RANGE
days until arrival 15..42     PLANNING_SUBSEASONAL
days until arrival 0..14      PLANNING_FORECAST
today within trip             IN_TRIP
today after departure         COMPLETED
```

Thresholds are configuration values so later experiments do not require component changes. Demo modes inject an evaluation date; they never alter stored trip dates.

## 7. Slice 1 request flow

```text
GET /
  -> Server Component loads the Dominican Republic country pack
  -> interactive Onboarding client island receives serializable region options
  -> four progressive steps validate destination/dates, party, interests and stops
  -> form creates a compact URL-safe anonymous preview request

GET /preview?...
  -> async searchParams are parsed with Zod
  -> application use case normalizes the trip and derives its phase
  -> seed provider selects route-aware, seasonal preview highlights
  -> Server Component renders personal route, relevant opportunities and next actions
  -> route is noindex and creates no account or public trip record
```

The preview request contains no name, e-mail or precise accommodation address. Once authentication arrives in Slice 2, the validated preview can be persisted as a private trip through a server-side use case.

## 8. Persistence

PostgreSQL on Supabase is the production datastore. Prisma 7 supplies the type-safe schema and migration workflow. The schema is normalized around:

- `Country`, `Region` and `DestinationCluster`;
- `Activity`, `SeasonWindow` and source provenance;
- `Trip`, ordered `TripStop`, travelers and interests;
- recommendation snapshots and score breakdowns;
- recommendation outcomes, analytics events and affiliate clicks;
- Trip Pass state and offers.

Slice 1 creates the country, region and trip foundations plus an idempotent Dominican Republic seed. Anonymous preview reads the checked-in country pack so it remains fully functional when `DATABASE_URL` is absent. Database-backed repositories become the production default once configured; absence of credentials is an explicit `SEED_FALLBACK`, never a silent partial failure.

All user-owned rows receive a `userId` in Slice 2. Authorization is enforced in server-side repositories/use cases and later reinforced by Supabase Row Level Security. Personal pages are `noindex`, excluded from sitemaps and never fetched by public identifiers alone.

## 9. Provider architecture and provenance

Each live source implements a narrow port such as `WeatherProvider`, `NewsProvider`, `TravelAdvisoryProvider`, `PlacesProvider`, `CurrencyProvider`, `GeocodingProvider` or `ActivityProvider`.

Normalized responses include:

```ts
interface ProviderMetadata {
  source: string;
  retrievedAt: string;
  lastVerifiedAt: string;
  confidence: number;
  rawReference?: string;
  fallbackStatus: "LIVE" | "CACHED" | "SEED_FALLBACK" | "UNAVAILABLE";
}
```

Provider selection happens in a server-only composition root. A circuit-breaking fallback chain can be added without changing domain rules. Seed providers are first-class adapters and make local development, tests and demos deterministic.

## 10. Recommendation architecture

The ranking engine introduced in Slice 3 is a pure function. It receives a trip context, activity facts, provider observations and configurable weights. It returns an immutable `RecommendationScore` with every subscore and explanation factor. AI may rewrite those factors for readability but cannot change the total, eligibility or ordering.

Organic score and commercial offer data are separate inputs. Affiliate commission is never a ranking feature. Sponsored placement, if introduced, is visibly labeled and stored separately.

Recommendation snapshots persist the facts and weights used at decision time. Outcomes append events instead of mutating history, forming the future recommendation learning dataset.

## 11. Rendering, caching and mutations

- Public destination content is statically rendered where possible and revalidated deliberately.
- Anonymous previews are request-specific Server Components and `noindex`.
- Interactive state is isolated to the onboarding form; country data and preview composition remain server-side.
- Route handlers and Server Actions validate untrusted input with Zod.
- Next.js 16 request APIs are always awaited.
- No `use cache` directive is introduced until a single cache policy is designed and `cacheComponents` is intentionally enabled.
- Mutations re-check authentication and ownership inside the use case; hiding a button is never authorization.

## 12. SEO, privacy and trust

Public country and region routes own canonical metadata, breadcrumbs and valid JSON-LD. Personal and preview routes declare `robots: noindex, nofollow`; private trips stay out of every sitemap. Date-combination pages are created only when editorial value and unique seasonal content exist.

Every current-information view can show source, verification time, confidence and whether information is official, locally verified, current, historical, indicative or AI-summarized. Analytics never stores child ages or precise route details as free-form event properties.

## 13. Testing and quality gates

The required local and CI order is:

```text
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
```

Vitest covers pure domain policies and use cases. Playwright covers the multi-step anonymous flow on a mobile viewport first, then desktop smoke coverage. Database integration tests use an explicit test database and never fall back to production credentials.

A slice is not complete when only the UI renders: validation, empty/error states, keyboard operation, responsive layout and production build must all pass.

## 14. Deployment and configuration

The default deployment target is Vercel plus a Supabase project in the nearest suitable region. Environment variables are parsed once in `src/config/env.ts`. Feature flags control database reads, demo modes, authentication providers, Trip Pass payments and external providers.

Production targets Node.js 24 LTS. Secrets are server-only; only variables explicitly prefixed with `NEXT_PUBLIC_` may enter browser bundles.

## 15. Slice boundaries

Slice 1 delivers the standalone project, PostgreSQL schema/migrations, country pack, multi-region onboarding and valuable anonymous preview. Authentication and persistence of user-owned trips belong to Slice 2. Full activity depth, deterministic daily ranking and score snapshots belong to Slice 3. This keeps the first vertical flow real without hiding future concerns inside temporary component logic.
