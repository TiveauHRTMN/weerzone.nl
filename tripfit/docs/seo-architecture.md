# Public SEO architecture

Public pages are Server Components and should be static or deliberately
revalidated. Personal previews, accounts, dashboards, trips and live-day pages
are never indexable.

Every candidate page passes `validateSeoQuality` before metadata is emitted as
indexable. It needs a unique introduction, two substantial local blocks, five
recommendations, weather or season context, three internal links, destination
metadata, a verification date, a clear action, no placeholders and low
duplication. Failure means `noindex,follow` and exclusion from sitemaps.

Reusable templates may control layout, metadata, breadcrumbs and JSON-LD, but
page facts and local copy must remain distinct. Schema is emitted only for
visible information. `Event` requires a real verified event; `FAQPage` requires
visible questions; recommendation lists use `ItemList`.

The launch flag controls crawler access. With
`NEXT_PUBLIC_CALOR_PUBLIC_LAUNCH=false`, `robots.txt` disallows the entire host.
Production activation requires canonical-host verification and sitemap checks.

