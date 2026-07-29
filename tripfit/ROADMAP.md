# TripFit delivery roadmap

The roadmap is organized as vertical slices. Each slice ends with typecheck, lint, unit tests, production build, mobile visual review and relevant Playwright coverage.

## Slice 1 — Open a trip

Status: complete

- standalone Next.js foundation;
- PostgreSQL/Prisma country and trip data model;
- Dominican Republic country pack and region coverage;
- progressive multi-region onboarding;
- personalized anonymous preview;
- seed/mock operation without credentials.

Exit criterion: an anonymous traveler can open a useful route-aware preview end to end.

## Slice 2 — Save a private living trip

- Supabase magic-link authentication and optional Google login;
- preview-to-account handoff;
- private trip persistence and ownership authorization;
- dashboard shell and ordered multi-region route;
- saved activities and reservations foundation;
- private-route noindex and RLS policies.

Exit criterion: a user can securely reopen only their own saved trip.

## Slice 3 — Explainable recommendations

- deep Dominican Republic activity catalog at required coverage levels;
- seasons, opening windows, age rules and logistics facts;
- configurable deterministic ranking engine;
- immutable score breakdown and explanation factors;
- Today and personalized Discover surfaces;
- recommendation outcome events.

Exit criterion: Today produces stable, testable and explainable recommendations from trip context.

## Slice 4 — Live conditions

- weather provider port and mock/live adapters;
- long-range, subseasonal, forecast and in-trip presentation policies;
- rain, wind, heat, lightning and sea-state rules;
- Plan A, Plan B and postpone decisions;
- four development demo modes.

Exit criterion: the same trip visibly changes across time modes without inventing forecast precision.

## Slice 5 — Country intelligence

- Country Pulse impact classification;
- separate official travel advisories;
- route-aware news summaries;
- culture and place context;
- currency and practical provider adapters.

Exit criterion: users see only country signals with a defensible relationship to their trip.

## Slice 6 — Commercial and acquisition foundation

- configurable Trip Pass pricing and validity;
- payment feature flag and provider boundary;
- affiliate offers/click measurement with sponsored labels;
- analytics forwarding adapter;
- public destination, activity and seasonal SEO expansion;
- sitemaps, canonicals, JSON-LD and breadcrumb hardening.

Exit criterion: monetization can be activated without changing organic recommendations.

## Slice 7 — Production hardening

- complete critical unit and Playwright suites;
- performance budgets and observability;
- accessibility audit and remediations;
- provider failure exercises and operational runbooks;
- seed verification process and full documentation review;
- deployment rehearsal and rollback procedure.

Exit criterion: critical flows are fast, accessible, observable and recoverable in production.
