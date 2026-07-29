# Launch checklist — 10 August 2026

## Infrastructure

- [ ] Production and preview Vercel environments are separate.
- [ ] Node 24 and npm 11 match `package.json`.
- [ ] Production Supabase URLs and keys are present; no secrets use
  `NEXT_PUBLIC_`.
- [ ] `prisma migrate deploy` succeeds against a backed-up production database.
- [ ] Seed runs idempotently and contains no fake live availability or prices.
- [ ] RLS owner, anonymous and authenticated integration tests pass.
- [ ] Private `trip-media` bucket and policies are verified.
- [ ] `/api/health` returns 200 with the expected launch state.

## Feature flags

- [ ] Preview/staging: `NEXT_PUBLIC_CALOR_PUBLIC_LAUNCH=false`.
- [ ] Production launch: public launch is enabled only after final approval.
- [ ] Affiliates remain false until agreements, disclosure and adapters pass.
- [ ] Payments remain false until KvK/legal and Mollie production readiness.
- [ ] AI recommendations activate only after schema/fallback monitoring passes.
- [ ] Local partners expose verified records only.
- [ ] Weerzone referral starts with an approved limited cohort.

## Content and SEO

- [ ] Ten launch destinations have unique verified content.
- [ ] Thin pages return `noindex,follow` and are absent from sitemaps.
- [ ] Titles, descriptions, canonicals, OG/Twitter images and breadcrumbs pass.
- [ ] Visible JSON-LD matches visible page content.
- [ ] Production `robots.txt` and sitemap use `https://calortravel.nl`.
- [ ] Staging is globally noindex.
- [ ] 404s, redirects, broken links and missing images are checked.

## Product, privacy and commerce

- [ ] Consent gate controls non-essential analytics.
- [ ] Privacy statement, retention periods and erasure flow are approved.
- [ ] No personal data appears in analytics properties or logs.
- [ ] Affiliate disclosure and external contract-party wording are visible.
- [ ] External links use `sponsored noopener noreferrer`.
- [ ] No external excursion checkout is presented as a Calor transaction.
- [ ] First/last-touch attribution and Weerzone campaign capture are verified.

## Reliability and quality

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run test:e2e`
- [ ] Mobile keyboard, screen-reader labels, loading, empty and error states pass.
- [ ] LCP < 2.5s, CLS < 0.1 and realistic INP < 200ms on key pages.
- [ ] Provider timeout, bounded retry, cache freshness and fallback behavior pass.
- [ ] Error monitoring, alert ownership and database backup restore are tested.

## Manual production sequence

1. Freeze content and back up Supabase.
2. Deploy migrations, then seed verified reference data.
3. Deploy Vercel with public launch, affiliates and payments still off.
4. Run health, auth, trip ownership, Today, robots, sitemap and mobile smoke tests.
5. Enable public launch and verify indexing headers.
6. Monitor errors, latency, funnels and source freshness.
7. Enable commercial/referral features later, individually, after approval.

