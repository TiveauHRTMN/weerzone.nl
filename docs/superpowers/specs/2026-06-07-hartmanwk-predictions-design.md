# Hartman WK 2026 Poule — voorspellingen, sterspeler & scoring

Datum: 2026-06-07 · Status: goedgekeurd (Rowan: "bouwen maar en afronden")

## Doel
De `/hartmanwk2026`-poule van een statische demo naar een echte, gedeelde poule
tillen: deelnemers vullen verplicht al hun groepsvoorspellingen + 1 sterspeler in
(opgeslagen per deelnemer), de eigenaar voert de echte uitslagen + speler-statjes
in, en de ranglijst rekent dynamisch echte punten. Gebruiksvriendelijk, dynamisch
en leuk om te zien.

## Bevestigde keuzes
- Deelnemer vult **alle 72 groepswedstrijden** (id 1–72, `gid` A–L) in **+ 1 sterspeler**
  (vrije tekst, bv. "Mbappé"/"Gakpo"), die het **hele toernooi** blijft staan.
- **Verplicht-slot**: op slot bij de eerste aftrap **2026-06-11 21:00 CEST (19:00 UTC)**.
  Na het slot kunnen groepsvoorspellingen + speler niet meer wijzigen.
- **Echte uitslagen + speler-statjes** worden door **de eigenaar** ingevoerd (geen
  deelnemersinvoer), via een verborgen beheerscherm met geheime sleutel.
- Knock-out (id 73–104) valt buiten dit slot (volgt later in het toernooi).

## Datamodel (Supabase)
- `hartmanwk_members.player_pick text` — gekozen sterspeler (vrije tekst).
- `hartmanwk_predictions` (member_id, match_id, home, away, updated_at; PK member_id+match_id).
- `hartmanwk_results` (match_id PK, home, away, updated_at) — door eigenaar.
- `hartmanwk_player_stats` (player_key PK genormaliseerd, display_name, goals, assists,
  minutes, yellow, red, updated_at) — door eigenaar, toernooi-cumulatief.
- Alle tabellen RLS aan, geen publieke policies (alleen service-role/API).

## Puntensysteem (bestaande regels, server-side)
- Wedstrijd: exact **100**; anders winnaar/gelijk **50** + per team goals correct **25** (+25).
- Sterspeler (cumulatief): meespelen **+1**, goal **+5**, assist **+3**, geel **−2**, rood **−7**.
- Totaal deelnemer = som wedstrijdpunten + fantasypunten gekozen speler.

## API
- `GET /api/hartmanwk/predictions?memberId&contact` → eigen voorspellingen + player_pick.
- `POST /api/hartmanwk/predictions` {memberId, contact, matchId, home, away} → opslaan
  (valideert identiteit memberId+contact, groepswedstrijd, vóór slot).
- `POST /api/hartmanwk/pick` {memberId, contact, player} → sterspeler opslaan (vóór slot).
- `GET /api/hartmanwk/standings` → leden met berekende pts/exact/toto/speler (gepolld, 15s).
- `POST /api/hartmanwk/admin/result` {token, matchId, home, away} — token = `HARTMANWK_ADMIN_TOKEN`.
- `POST /api/hartmanwk/admin/player` {token, player, goals, assists, minutes, yellow, red}.

Identiteitsguard (geen wachtwoorden): schrijf/lees vereist memberId **én** bijbehorend
contact (contact wordt nooit naar andere browsers gestuurd).

## UI
- **Prototype (deelnemers):** voorspellingen opslaan bij invoer; "Jouw sterspeler"-veld;
  voortgang "X/72 ingevuld"; na slot inputs op slot ("Gesloten"); stand toont echte
  punten + ieders gekozen speler; bestaande entrance-animaties.
- **Beheer (`/hartmanwk2026/beheer`, eigenaar-only):** token-gated; per wedstrijd uitslag
  invoeren; per gekozen speler statjes invoeren. Functioneel, los van de prototype-UI.

## Fasering
- Fase 1 (vóór 11 juni): opslaan voorspellingen + speler, verplicht-slot, lock. **Prioriteit.**
- Fase 2 (vanaf 11 juni): beheerscherm + scoring → ranglijst beweegt.
