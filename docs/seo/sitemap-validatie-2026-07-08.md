# Sitemap-validatierapport — weerzone.nl (2026-07-08)

## Samenvatting

De live sitemap bevat **14.039 URL's** (29 statisch + 14.010 plaatsen) — de volledige WaaS-laag staat er dus al in, geen ~3K. Het cijfer ~3K komt vrijwel zeker uit een verouderde bron (GSC-leesmoment of de gecommitte code, die maar 1.785 URL's oplevert). **Het grootste risico is dat de full-WaaS-wijziging niet gecommit is**: elke schone (git-based) deploy zet de sitemap stilletjes terug naar 1.785 URL's.

## Gemeten feiten (live, 2026-07-08)

| Check | Resultaat |
|---|---|
| `sitemap.xml` (index) | ✅ Geldig, 2 children, in robots.txt |
| `sitemap-static.xml` | ✅ 29 URL's, geldige XML |
| `sitemap-nl.xml` | ✅ 14.010 URL's, geldige XML, 0 duplicaten |
| Totaal vs 50k-limiet | ✅ 14.039 — ruim binnen limiet, index-split aanwezig |
| HTTPS-only | ✅ Alle URL's `https://weerzone.nl` |
| Steekproef HTTP-status (6 URL's, verspreid) | ✅ Allemaal 200 |
| `<priority>`/`<changefreq>` in output | ✅ Niet geëmit (genegeerd door Google — goed) |
| Noindex-pagina's in sitemap | ✅ `/steve` bewust weggelaten |

URL-verdeling per provincie: Noord-Brabant 2.275, Gelderland 2.227, Zuid-Holland 1.491, Overijssel 1.270, Limburg 1.249, Noord-Holland 1.171, Friesland 1.045, Groningen 884, Zeeland 852, Drenthe 796, Flevoland 393, Utrecht 357.

## Issues

### 🛑 Kritiek — full-WaaS-sitemap is niet gecommit
`src/lib/sitemap-data.ts` heeft de gate-verwijdering (`return true` i.p.v. `venueType || population >= 1000`) alleen in de werkmap. Gecommitte code levert **1.785** URL's; live draait 14.010 via een dirty CLI-deploy. Elke deploy vanaf git (of een tweede sessie die de werkmap reset) halveert de sitemap tienvoudig zonder waarschuwing. **Fix: commit de wijziging op `feat/studio-tiktok-autopost`.**

### 🔴 Hoog — 1.665 plaatsen (12%) onder de verkeerde provincie
Bekend uit de validatie van 2026-07-06 (`scripts/validate-place-provinces.ts`, ook nog niet gecommit). In de steekproef van dit rapport zaten er al twee: `gelderland/camping-pbc-austerlitz` (Austerlitz = Utrecht) en `limburg/opoeteren` (ligt in Belgisch Limburg — hoort helemaal niet in een NL-sitemap). De pagina geeft 200 met een self-canonical naar de **foute** URL, dus Google indexeert geografisch onjuiste URL's. Fix zoals eerder gepland: data corrigeren in `places-data` + 308-redirects van oude naar nieuwe provincie-URL's; niet-NL-plaatsen eruit.

### 🟡 Middel — GSC toont vermoedelijk nog het oude aantal
Google herleest sitemaps traag. Na de commit + deploy: in Search Console de sitemap opnieuw indienen en IndexNow pingen (`scripts/ping-google.ts` / `api/indexnow`) zodat de 14K-versie sneller wordt opgepikt.

### 🟡 Middel — thin-content-risico op 14K programmatische pagina's
De gate stond er juist voor een "jong domein". Hij mag weg *mits* Mariana Local elke pagina daadwerkelijk een eigen hyperlokale verwachting geeft (dat is de aanname in de nieuwe code-comment). Plaatsen zonder eigen inhoud (identieke tekst, alleen plaatsnaam gewisseld) zijn op deze schaal een indexatie-risico. Aanbeveling: steekproefsgewijs verifiëren dat kleine plaatsen (<1000 inw.) uniek gevulde pagina's tonen vóór GSC-herindiening.

### 🔵 Laag — alle `lastmod` identiek (vandaag)
Elke URL krijgt `todayIso()`. Voor uurlijks weer is "vandaag gewijzigd" inhoudelijk waar, maar 14K identieke datums verzwakken het signaal. Acceptabel; geen actie nodig.

### ℹ️ Info
- `public/sitemap.xml`-snapshot bestaat niet meer (CLAUDE.md zegt van wel — documentatie verouderd); dynamische routes serveren, dat is prima.
- `priority`/`changefreq` worden wel opgebouwd in `SitemapEntry` maar nooit geëmit — dode velden, mag opgeruimd.
- Sitemap-index kan door `s-maxage=43200` + SWR tot ~36u een oudere `lastmod` tonen dan de children — cosmetisch.

## Uitgevoerd (2026-07-09)

1. ✅ Gecommit: sitemap-gate weg (554106c) — de 14K overleeft nu git-based deploys.
2. ✅ Provincie-fix (87219be): 1.667 provincies gecorrigeerd, 236 niet-NL-plaatsen verwijderd (vrijwel allemaal Belgisch-Limburg incl. Hasselt/Genk/Tongeren), Bocholtz-coords gefixt. 308-fallback in de plaatspagina stuurt oude foute URL's naar de canonical. Live geverifieerd. Sitemap: 14.010 → **13.775** URL's.
3. ✅ Mariana Local-steekproef (5 kleine plaatsen): paragraaftekst-overlap 67–85%. Elke pagina heeft eigen live weerdata + een variërende modelbriefing — geen kaal thin-content, maar de briefing leest regionaal i.p.v. hyperlokaal en bevat meteo-jargon ("T850", "CAPE-spreiding") dat botst met de toonregels.
4. ✅ IndexNow: 3.521 gewijzigde URL's ingediend (api.indexnow.org + Bing, beide 200). ❌ Google-ping: `google.com/ping` is sinds juni 2023 permanent dood (404) — `pingSearchConsole()` in `src/app/actions.ts` is dead code. **GSC-herindiening moet handmatig** (Search Console → Sitemaps → sitemap.xml opnieuw indienen).
