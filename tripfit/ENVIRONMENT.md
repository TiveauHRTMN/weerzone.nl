# Environment and operations

## Runtime

Production targets Node.js 24 LTS and npm 11, pinned in `.node-version`, `.nvmrc`, `package.json` and the lockfile. Next.js requires Node 20.9 or newer; Prisma 7 also supports Node 24.

## Local setup

```bash
npm install
Copy-Item .env.example .env
npm run dev
```

Open `http://localhost:3000`. The homepage and anonymous preview need no database or external API credentials.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | production | Canonical application origin. |
| `DATABASE_URL` | database features | PostgreSQL runtime/seed connection. |
| `DIRECT_URL` | hosted pooled database | Direct PostgreSQL URL for migrations. |
| `NEXT_PUBLIC_SUPABASE_URL` | Slice 2 | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Slice 2 | Browser-safe Supabase anonymous key. |
| `SUPABASE_SERVICE_ROLE_KEY` | server jobs only | Privileged operations; never browser-exposed. |
| `FEATURE_DATABASE_READS` | no | Activate database repositories. |
| `FEATURE_DEMO_MODES` | no | Enable development phase controls. |
| `FEATURE_TRIP_PASS_PAYMENTS` | no | Activate payment adapter. |
| `FEATURE_EXTERNAL_PROVIDERS` | no | Activate live provider composition. |

Server environment parsing rejects malformed URLs/flags and never logs credential-bearing database values.

## Database workflow

```bash
npm run db:generate          # regenerate type-safe client; no DB needed
npm run db:validate          # validate Prisma schema; no DB needed
npm run db:migrate           # create/apply a local migration; DB required
npm run db:migrate:deploy    # production/CI migration; DB required
npm run db:seed              # idempotent DR seed; DB required
npm run db:studio            # local data browser
```

Use a direct connection for migrations when the Supabase runtime URL uses a transaction pooler. Never point tests or local migrations at production.

## Quality commands

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
```

Playwright starts the development server automatically unless `PLAYWRIGHT_BASE_URL` targets an existing environment. Mobile Chromium is the first project; desktop Chromium is the second.

## Deployment

1. provision Supabase PostgreSQL and apply migrations with `db:migrate:deploy`;
2. seed controlled reference data once per environment;
3. configure environment variables and keep live/provider/payment flags off until their slice is verified;
4. run all quality gates against the production build;
5. deploy the Next.js application to Vercel with Node 24;
6. smoke-test public pages, noindex preview/private metadata and provider fallback state;
7. activate features incrementally and retain the previous deployment for rollback.

The app must continue serving checked-in public/preview data during a database or external-provider outage. User-owned mutations fail explicitly rather than pretending they were saved.
