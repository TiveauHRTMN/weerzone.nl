# TripFit

TripFit is Caribbean Live Travel Intelligence: one living trip that changes with route, dates, season, weather, company and prior choices.

> Niet wat er te doen is. Wat voor jouw reis nú het beste is.

This repository contains the production-oriented first vertical slice for the Dominican Republic. An anonymous traveler can configure an exact multi-region trip and open a personalized, route-aware preview before registration.

## What works in Slice 1

- premium mobile-first public homepage;
- progressive destination/date, party, interest and route onboarding;
- adults, children and exact child ages;
- continuous multi-stop trips across 13 Dominican Republic regions;
- server-rendered, validated and `noindex` personal preview;
- trip-phase calculation without false long-range forecast precision;
- 39 destination clusters and 52 seasonal/route preview highlights;
- public country page and 13 statically generated region pages;
- canonicals, breadcrumbs, JSON-LD, robots and sitemap foundations;
- Prisma 7/PostgreSQL schema, migration and idempotent seed;
- deterministic seed/mock operation without external credentials;
- strict TypeScript, ESLint, Vitest and mobile/desktop Playwright gates.

Authentication and saving private trips are Slice 2. The full activity catalog and weighted daily ranking engine are Slice 3; the preview does not misrepresent its seed highlights as live recommendations.

## Stack

- Next.js 16.2 App Router and React 19;
- TypeScript strict and Tailwind CSS 4;
- PostgreSQL on Supabase through Prisma 7 and `@prisma/adapter-pg`;
- Zod 4 validation;
- Vitest 4 and Playwright 1.61;
- Node.js 24 LTS and npm 11.

## Local setup

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Open `http://localhost:3000`. `DATABASE_URL` is optional for the complete anonymous preview flow.

To load the database seed, configure a PostgreSQL URL first:

```powershell
npm run db:migrate
npm run db:seed
```

## Quality gates

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
```

`test:e2e` builds the production artifact and runs the main scenario in mobile and desktop Chromium. Use `test:e2e:fast` only when a current build and server are already available.

## Main routes

| Route | Rendering/indexing |
| --- | --- |
| `/` | static, public and indexable |
| `/dominicaanse-republiek` | static, public and indexable |
| `/dominicaanse-republiek/[region]` | SSG for all pack regions |
| `/preview?...` | dynamic, anonymous and `noindex` |
| `/robots.txt` | blocks preview and future private route families |
| `/sitemap.xml` | public country and region pages only |

## Data and database

The checked-in country pack under `src/domain/countries/packs/` is the credential-free preview source. Database records explicitly carry `isSeedData`; provider responses carry source, retrieval/verification time, confidence and fallback state.

Useful commands:

```powershell
npm run db:generate
npm run db:validate
npm run db:migrate
npm run db:migrate:deploy
npm run db:seed
npm run db:studio
```

Migration commands fail closed without a valid `DIRECT_URL` or `DATABASE_URL`. See `ENVIRONMENT.md` for Supabase connection guidance.

## Architecture

React components do not own country or ranking policy. The dependency direction is:

```text
app/components -> features -> domain
                         \-> repository/provider ports
Prisma and provider adapters --------^
```

Next.js pages are Server Components by default; the progressive onboarding is the deliberate client island. Request APIs follow Next.js 16 async conventions.

## Documentation

- `ARCHITECTURE.md` — boundaries, decisions and request flow;
- `PRODUCT.md` — promise, journey and product principles;
- `DATA_MODEL.md` — aggregates, persistence and deletion policy;
- `PROVIDERS.md` — normalized provider/fallback contract;
- `RANKING_ENGINE.md` — deterministic ranking specification;
- `ANALYTICS.md` — events, privacy and funnel definitions;
- `SEED_DATA.md` — seed contents and verification policy;
- `ENVIRONMENT.md` — setup, migrations and deployment;
- `ROADMAP.md` — vertical-slice delivery plan.

## Deployment

The intended target is Vercel with Supabase PostgreSQL. Pin Node 24, run `db:migrate:deploy`, seed controlled reference data, keep unfinished provider/payment flags off, run all quality gates, then deploy. The anonymous preview continues to work when database or external providers are unavailable.
