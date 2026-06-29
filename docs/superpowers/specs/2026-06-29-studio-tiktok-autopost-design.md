# Mariana Studio → TikTok auto-post (via Buffer) met per-slide goedkeur-gate

**Datum:** 2026-06-29
**Status:** Design — goedgekeurd door Rowan, klaar voor implementatieplan
**Branch-context:** werkmap staat op `feat/account-deletion`; Studio-code leeft daar (zie `project_mariana_studio`). Implementatie volgt de bestaande Studio-bestanden.

## Doel

De laatste handmatige stap in Mariana Studio sluiten: in plaats van per slide een PNG downloaden en zelf op TikTok plaatsen, plaatst Studio de slide **automatisch via Buffer naar TikTok** — maar pas nadat de eigenaar per afbeelding een **"Bekeken & akkoord"-vinkje** heeft gezet. Er is géén onbewaakt publicatiepad: geen vinkje = geen post.

## Kernkeuze: browser blijft de renderer

De afbeelding wordt in de **browser** gerenderd met de bestaande `html-to-image` `toPng` (1080×1920), niet server-side. Redenen:

- De huidige `toPng`-pijplijn produceert exact de look die op het scherm staat, inclusief `contentEditable`-bewerkingen — die worden gratis meegenomen.
- De mens is op het moment van goedkeuren tóch aanwezig; "wat je ziet is wat geplaatst wordt".
- Geen risico op visuele drift tussen een server-renderer en de design-component.

## Review-ritme: nabij elk slot

De eigenaar reviewt **nabij elk slot** (niet één ochtendbatch), zodat data vers is — met name slide 2 (14:00 "nu gemeten" + warmste plek) die live temps op openingsmoment ophaalt.

Slots: 08:00 Dagverwachting · 14:00 Actueel · 20:00 Vandaag & Morgen · 22:00 Heads-up (alleen als `slide4` bestaat).

## Flow (per slot)

1. **~10–15 min vóór een slot** stuurt een nudge-cron een e-mail (Resend, `mariana@weerzone.nl` → `info@weerzone.nl`) met een deeplink `https://weerzone.nl/admin/studio?slot=slide2`.
2. Eigenaar opent Studio. De betreffende slide is vers (slide 2 live temps kloppen omdat het ~14:00 is). Tekst/caption desgewenst aanpassen.
3. Eigenaar zet het vinkje **"✓ Bekeken & akkoord — plaats op TikTok"** op die kaart.
4. Browser rendert de 1080×1920 PNG → POST `{slot, png, caption}` naar de server → server uploadt PNG naar Supabase Storage (publieke URL) → roept Buffer API aan om **nu** naar het TikTok-kanaal te publiceren → kaart vergrendelt naar **"Geplaatst om 14:03"**.

## Onderdelen

### 1. `StudioClient.tsx` (UI-wijzigingen)
- Per slide-kaart: een **bewerkbare caption-textarea**, voorgevuld uit slide-inhoud (titel + intro + standaard hashtags zoals `#weer #weerzone #weerbericht`). Wat in de box staat op goedkeurmoment = de TikTok-caption.
- Een **"✓ Bekeken & akkoord — plaats op TikTok"** knop/checkbox per kaart.
- Bij aanvinken: render PNG (bestaande `toPng`) → POST naar `/api/studio/publish` → toon "bezig met plaatsen…" → bij succes vergrendelde badge **"Geplaatst om HH:MM"**.
- Posted-state wordt van de server geladen bij openen, zodat heropenen toont wat vandaag al geplaatst is (geen dubbele post na refresh).
- `?slot=slideN` in de URL scrollt naar / markeert de juiste kaart.

### 2. `/api/studio/publish` (nieuw, POST)
- Gated door bestaande `studioAccessOk(req)` (founder-sessie of `STUDIO_SECRET`).
- Body: `{ slot: "slide1"|"slide2"|"slide3"|"slide4", pngDataUrl: string, caption: string }`.
- **Idempotentie-/lock-check**: bestaat er al een geslaagde post voor `(forecast_date, slot)`? Zo ja → 409, niets doen.
- Upload PNG naar Supabase Storage, bucket `studio-posts`, pad `{forecast_date}/{slot}.png` → publieke URL.
- Buffer API create-update: TikTok-profiel, `media[photo]=<publicUrl>`, `text=<caption>`, `now=true`.
- Schrijf resultaat weg in `studio_posts` (buffer-id, image_url, caption, posted_at, status).
- Retourneert status + posted_at aan UI. Bij Buffer-fout: schrijf geen lock (of status `failed`) zodat de kaart ontgrendeld blijft voor retry.

### 3. `/api/cron/studio-nudge` (nieuw) + `vercel.json`
- Query `?slot=slideN`. Stuurt de nudge-e-mail via Resend met deeplink.
- 4 cron-entries in `vercel.json` op UTC-equivalent van 07:45 / 13:45 / 19:45 / 21:45 CEST.
- Slide-4 nudge: alleen mailen als de Studio-dag van vandaag een `slide4` heeft (anders stil overslaan).
- Cron alleen toegevoegd in `vercel.json` (anders vuurt hij niet — repo-conventie).

### 4. Schema: `studio_posts`
Nieuwe tabel, migratie in `supabase/migrations/`. Kolommen (indicatief):
- `id` (pk), `forecast_date` (date), `slot` (text), `status` (text: `posted`|`failed`), `buffer_id` (text), `image_url` (text), `caption` (text), `posted_at` (timestamptz), `created_at`.
- Unieke constraint op `(forecast_date, slot)` waar `status='posted'` → harde lock tegen dubbele posts.
- Migratie wordt handmatig in de Supabase SQL-editor gedraaid (migraties in repo ≠ live; zie `feedback_prod_db_migrations`).

### 5. Secrets / setup (handmatig door Rowan)
- Vercel env: `BUFFER_ACCESS_TOKEN`, `BUFFER_TIKTOK_PROFILE_ID`.
- Supabase: publieke Storage-bucket `studio-posts` aanmaken.
- Migratie `studio_posts` draaien in SQL-editor.

## Veiligheid & openstaande verificatie

- **Mens-gated**: geen vinkje → geen post. Per-slot lock blokkeert dubbele posts. Buffer-fouten verschijnen in de UI en laten de kaart ontgrendeld voor retry.
- **Build-time verificatie (Buffer + TikTok foto-posts):** Buffer's publieke API is al jaren grotendeels gesloten voor nieuwe apps en TikTok-ondersteuning via derden is beperkt (foto-/carrousel-posts vereisen soms TikTok's eigen publicatie-goedkeuring; sommige tiers krijgen alleen "reminder"-notificaties i.p.v. echte auto-publish). Tijdens implementatie wordt geverifieerd of het token een TikTok-kanaal met **foto**-posts kan aansturen.
  - **Fallback** als auto-publish niet kan: post als **geplande draft** naar Buffer (`now` weg, scheduled/draft) — eigenaar tikt in de Buffer-app op publiceren. Zelfde UI en flow; alleen de laatste hop verandert. Dit wordt direct gemeld zodra testbaar.

## Niet in scope (YAGNI)

- Server-side rendering van de PNG.
- Ochtendbatch-goedkeuring / vooraf inplannen van forecast-slides.
- Web push notificaties (e-mail volstaat).
- Andere kanalen dan TikTok (Instagram/X) — pas als TikTok-pad bewezen werkt.
