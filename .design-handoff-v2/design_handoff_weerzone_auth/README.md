# Handoff — Weerzone Auth & Abonnementen

## Overview
Authenticatie-, onboarding-, abonnement- en account­beheerschermen voor **weerzone.nl**. Dekt de volledige gebruikersreis vanaf signup tot het beheren van een actief abonnement, inclusief desktop- én mobiele layouts. Bedoeld om los in te passen in de bestaande Weerzone-frontend (zelfde huisstijl als de homepage: blauw chip-logo, gele zon, Manrope, "48 uur vooruit. De rest is ruis.").

## About the design files
De bundel bevat **HTML-prototypes** (React + Babel inline, geen build-step). Dit zijn geen productie-componenten — **recreëer ze in de bestaande Weerzone-codebase** (waarschijnlijk Next.js/Nuxt/vergelijkbaar, gebruik het framework dat al op weerzone.nl draait). Neem de design-tokens, copy en states letterlijk over; map de React-componenten 1-op-1 naar je eigen component-library.

## Fidelity
**High-fidelity.** Kleuren, typografie, spacing, states en copy zijn definitief. Pixel-perfect overnemen met de bestaande Weerzone-componenten. Logo (`assets/weerzone-logo.png`) is het huidige merklogo en wordt in een blauwe chip (`--wz-blue`) geplaatst, precies zoals op de homepage.

---

## Wat is er veranderd t.o.v. de huidige live site

Deze handoff bevat drie concrete aanpassingen die op de live site doorgevoerd moeten worden:

1. **Auth-side (marketing kolom) is herzien.** De linkerkolom van Signup/Login/Reset toont nu een homepage-stijl weer-tegel: grote temperatuur, gele zon-glyph, uur-voor-uur strip, klantquote, en de huisstijl-tagline "48 uur vooruit. De rest is ruis." in 44px display. Niet het oude generieke blauwe vlak.

2. **Geen postcode-input meer.** Overal waar de gebruiker voorheen een postcode moest invoeren (onboarding stap 1, checkout, account-profiel) staat nu een **GPS-knop**. De tekst onder de resolved locatie leest simpelweg "GPS · thuislocatie bepaald" — **geen** verwijzingen meer naar KNMI, HARMONIE, MetNet-3, NeuralGCM of andere modelnamen. Een kleine "Voer handmatig postcode in"-link blijft als fallback.

3. **Storm-meldingen zijn Reed-tier only.** In onboarding (topic selectie) en in Account → Meldingen krijgen "Wind & storm" en "Winterweer" een gele **REED**-badge. In Account is de storm-toggle disabled voor Piet-gebruikers met subtitel "Upgrade naar Reed om aan te zetten". UV/Pollen, Dagelijkse weerbericht en Regen & buien blijven voor iedereen beschikbaar (staat al zo op de huidige site).

4. **Steve (B2B) verwijderd.** Prijspagina toont alleen Piet en Reed. FAQ vermeldt dat zakelijk (Steve) in ontwikkeling is via `zakelijk@weerzone.nl`.

5. **Intro-prijzen vervangen door "Tijdelijk gratis".** Met kleinere regel eronder: "Straks €4,99/mnd" (Piet) en "Straks €7,99/mnd" (Reed).

---

## Screens

Alle schermen zijn gemockt in **desktop + mobile**. Beide varianten staan in één HTML-file (`Weerzone Auth.html`) en worden gepresenteerd op een design-canvas.

### 1. SignUpScreen (`components/AuthScreens.jsx`)
- **Doel**: nieuwe gebruiker maakt account aan (Naam, e-mail, wachtwoord + voorwaarden-checkbox).
- **Layout**: split 1fr 1fr. Links auth-side (marketing), rechts `max-width: 420px` form panel, centered.
- **Form**: Google/Apple social buttons → divider "of" → Naam, E-mail, Wachtwoord-met-strength-meter → akkoord checkbox → primary CTA "Account aanmaken".
- **Validatie**: naam leeg, e-mail regex `.+@.+\..+`, wachtwoord ≥8, akkoord verplicht. Alle errors verschijnen onder het veld in `--danger` (#b4322b) met icoon.
- **Na submit**: `nav('onboarding')`.

### 2. LoginScreen
- **Doel**: terugkerende gebruiker logt in.
- **Form**: Social buttons → divider → E-mail, Wachtwoord (met "Vergeten?" link rechts boven veld) → "Onthoud mij" checkbox → CTA "Inloggen".
- **Na submit**: `nav('account')`.

### 3. ResetScreen
- **Doel**: wachtwoord vergeten → magic-link-mail.
- **Twee states**: input-state (e-mail veld + "Stuur reset link") en success-state (groene checkmark-cirkel 64×64, "Check je inbox", ghost-button terug, "Opnieuw proberen" link).

### 4. OnboardingScreen (3 stappen met progress-bar)
- **Stap 1 — Waar ben je?** GPS-knop (44×44 circle `--brand` met concentrisch dradenkruis-icoon) → tonen van `Utrecht · 3731 GA` + "GPS · thuislocatie bepaald". Fallback-link onderaan "Geen GPS? Voer handmatig postcode in".
- **Stap 2 — Waar wil je op geattendeerd worden?** Checkbox-cards voor: Regen & buien, Temperatuur, **Wind & storm (REED-badge)**, UV & pollen, **Winterweer (REED-badge)**. Geselecteerd = `--brand-soft` bg + `--brand` border.
- **Stap 3 — Wanneer wil je je bericht?** Radio-cards: Vroege vogel 06:30, Ontbijt 07:00, Rustige start 08:00, Avond vooruitblik 19:00.
- **CTAs**: "Vorige" (ghost) + "Volgende" (primary). Laatste stap = "Klaar" → `nav('pricing')`.

### 5. PricingScreen
- **Doel**: kies abonnement. Twee cards naast elkaar (Piet & Reed). Reed krijgt `highlight: true` met `--brand` border + "POPULAIR" badge.
- **Price-blok** (binnen card, `--ink-050` achtergrond, radius 12, padding 14/16):
  - Badge "Nu aanmelden" (sun-variant, `#fff5c2` / `#8a6100`).
  - `Tijdelijk gratis` (20px, weight 800).
  - `Straks €4,99/mnd — geen creditcard nodig` (13px, `--text-mute`).
- **Features**: 5 bullets met checkmark-svg in `--success`.
- **FAQ** onderin: accordion met 4 vragen.
- **Copy-regel over Steve**: "Zakelijk gebruik (Steve) is in ontwikkeling — mail zakelijk@weerzone.nl".

### 6. CheckoutScreen
- **Doel**: account-gegevens + GPS-thuislocatie bevestigen + iDEAL/card kiezen. Tijdelijk gratis = geen betaal-flow actief, maar wel klaar voor als het betaald wordt.
- **Kolommen**: 2fr 1fr (form links, order-summary rechts, sticky).
- **GPS-card** identiek aan onboarding stap 1.
- **Payment methods**: iDEAL (default) / Creditcard / Bancontact als radio-cards met bank-icons.
- **Order summary**: "Piet — Tijdelijk gratis", "Straks €4,99/mnd", "Je betaalt nu: €0,00".
- **CTA**: "Bevestig aanmelding" → success-screen met groene check.

### 7. AccountScreen (4 tabs)
- **Sidebar**: 220px met tab-nav (Profiel, Inloggen & beveiliging, Abonnement, Facturering) + uitlog-link onderin.
- **Tab "Profiel"**:
  - Card 1 "Mijn gegevens": Naam, E-mail, **GPS-thuislocatie-card** (button met concentric-crosshair icon, toont "Utrecht" + "GPS · thuislocatie bepaald"), "Opslaan"-button.
  - Card 2 "Meldingen": 4 toggle-rijen. Daily, Rain, UV = voor iedereen. **Storm** toggle heeft REED-badge en is disabled wanneer `plan !== 'reed'` (opacity .55, subtitel vervangen door "Upgrade naar Reed om aan te zetten").
- **Tab "Inloggen & beveiliging"**: Wachtwoord wijzigen + 2FA sectie.
- **Tab "Abonnement"**: Huidig plan (grote card met rank-chip), upgrade/downgrade tussen Piet en Reed, "Abonnement stoppen" ghost-button → modal.
- **Tab "Facturering"**: Mollie-style factuurgeschiedenis (placeholder tot betaling leeft), iDEAL logo.

---

## Design tokens

Alle waarden staan in `design-system.css` onder `:root`. Gebruik dezelfde variabel­namen in de live codebase.

### Kleuren (brand)
```
--wz-blue:      #3b7ff0   (primair, chip-achtergrond logo)
--wz-blue-dark: #2a5fc4
--wz-blue-deep: #1f3f78
--wz-sun:       #ffd21a   (zon-glyph, accent)
```

### Kleuren (ink neutraals)
```
--ink-900: #0f1a2c   text
--ink-800: #1b2a42
--ink-700: #394a66   text-soft
--ink-500: #6a7a93   text-mute
--ink-300: #b9c4dc
--ink-200: #dde3ef
--ink-100: #eef1f7
--ink-050: #f5f7fb   bg
```

### Semantisch
```
--brand:       #3b7ff0
--brand-hover: #2e6ed9
--brand-soft:  #e8f0ff
--success:     #12805c    --success-bg: #e0f5ec
--warning:     #a8660b    --warning-bg: #fff3dc
--danger:      #b4322b    --danger-bg:  #fde7e5
--border:      #e3e8f1    --border-strong: #cbd3e2
```

### Type
- **Font**: Manrope (400, 500, 600, 700, 800). Importeren via Google Fonts of zelf-hosten.
- **Mono**: JetBrains Mono voor kickers/readouts.
- Scale: `.h-display` 48/1.05/800 -0.02em · `.h-1` 32/1.15/800 · `.h-2` 24 · `.h-3` 18 · `.t-body` 15/1.55 · `.t-small` 13 · `.t-micro` 11/700/uppercase/0.12em.

### Radius
```
--r-sm: 8    --r-md: 12    --r-lg: 18    --r-xl: 24
```

### Shadows
```
--shadow-sm:    0 1px 2px rgba(15,26,44,.06), 0 1px 1px rgba(15,26,44,.04)
--shadow-md:    0 6px 18px rgba(15,26,44,.08), 0 2px 6px rgba(15,26,44,.05)
--shadow-lg:    0 20px 50px rgba(15,26,44,.14), 0 6px 16px rgba(15,26,44,.06)
--shadow-brand: 0 12px 30px rgba(59,127,240,.28)
```

### Spacing
8-punt scale: 4 / 8 / 12 / 14 / 18 / 20 / 24 / 28 / 32 / 40.

### Auth-side (marketing kolom)
- Background stack (in volgorde):
  1. `radial-gradient(80% 60% at 85% 15%, rgba(255,210,26,.35) 0%, transparent 55%)` — gele gloed rechtsboven
  2. `radial-gradient(120% 80% at 15% 110%, #5a96ff 0%, transparent 55%)` — blauwe gloed linksonder
  3. `linear-gradient(160deg, #3b7ff0 0%, #2a5fc4 55%, #1f3f78 100%)` — basis
- Noise overlay: `radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px)` op 3×3px, `mix-blend-mode: overlay`, opacity .4.
- Homecard: `rgba(255,255,255,.10)` bg, `rgba(255,255,255,.18)` border, radius 20, padding 20/22, `backdrop-filter: blur(10px)`, `box-shadow: 0 20px 60px rgba(0,0,0,.18)`.
- Temp display: 72px/800/-0.04em, `deg` teken in `--wz-sun`.

---

## Interactions & behavior

- **Form validation**: sync op submit (niet on-change). Errors blijven tot nieuwe submit of veld-edit.
- **Password strength**: `.pw-meter` met 4 cellen; score bepaald door `length >= 8`, `has digit`, `has uppercase`, `has special char`. Klassen `.s1 / .s2 / .s3 / .s4`.
- **Onboarding progress-bar**: `(step + 1) / 3 * 100%`, animeert met `transition: width .3s`.
- **GPS-button**: toont loading state (spinning icon 600ms) → resolved state. Op echte site: `navigator.geolocation.getCurrentPosition` → reverse geocode tot `plaats · postcode`.
- **Account storm-toggle**: wanneer `plan !== 'reed'` → disabled, opacity .55, klik doet niks, label leest "Upgrade naar Reed om aan te zetten".
- **Pricing card hover**: `transform: translateY(-2px)` + `box-shadow: --shadow-md`, transition 150ms.
- **Button focus**: `outline: 3px solid #b7d0ff; outline-offset: 2px`.

---

## State management

Per screen (componentlokaal, React.useState in de prototypes):

- **SignUp**: `name, email, pw, agree, errors`
- **Login**: `email, pw, remember, errors`
- **Reset**: `email, sent`
- **Onboarding**: `step, location, topics[], time`
- **Pricing**: `selectedPlan`
- **Checkout**: `plan, email, postcode, paymentMethod, success`
- **Account**: `tab, plan, name, email, loc, notifs, showCancel, cancelled`

Op de echte site moet dit natuurlijk door de bestaande Weerzone store/API lopen — dit is puur om de UI-states zichtbaar te krijgen.

---

## Bestanden in deze bundel

```
README.md                        — dit bestand
Weerzone Auth.html               — entry (laadt alle jsx files, design-canvas met alle screens)
design-system.css                — alle tokens + utility classes (buttons, inputs, cards, auth-shell)
styles.css                       — prototype-page styling (canvas, artboards)
components.jsx                   — gedeelde helpers (PlanChip, Toggle, etc.)
screens-desktop.jsx              — desktop artboard mounts
screens-mobile.jsx               — mobile artboard mounts (iOS frame)
design-canvas.jsx                — starter DCArtboard layout
tweaks-panel.jsx                 — in-prototype knoppenpaneel (niet nodig in live)

components/
  AuthShell.jsx                  — split-layout wrapper (auth-side + panel), homecard
  AuthScreens.jsx                — SignUp / Login / Reset
  OnboardingScreen.jsx           — 3-step flow met progress bar
  PricingScreen.jsx              — Piet + Reed cards, FAQ, PLANS constant
  CheckoutScreen.jsx             — form + order summary + success state
  AccountScreen.jsx              — 4-tab account dashboard
  FormFields.jsx                 — TextField, PasswordField, Checkbox, Divider
  WzChrome.jsx                   — top bar logo chip

assets/
  weerzone-logo.png              — huidige Weerzone-logo (wit op blauwe chip)
```

## Assets
- **Logo**: `assets/weerzone-logo.png` — dit is het bestaande Weerzone-merklogo zoals het op de homepage staat. Altijd op een `--wz-blue` chip (radius 8-10, padding 8/14, of in de top-bar 28px hoog met padding 0/12).
- **Icons**: inline SVG, geen icon-library. GPS-icoon, checkmark, eye (password toggle), spinner zijn allemaal in de componentbestanden gedefinieerd.
- **Google/Apple logos**: inline SVG in `components/AuthShell.jsx` onder `SocialButtons`.

---

## Implementation checklist voor Vercel-deploy

1. Map `--wz-*` en `--ink-*` naar de bestaande Weerzone theme-tokens (mogelijk staan ze er al onder andere namen — overschrijf niet, alias).
2. Vervang de React-componenten door je eigen componenten (Button, Input, Card) — houd class-namen + padding gelijk.
3. Sluit de GPS-flow aan op `navigator.geolocation` + je huidige reverse-geocode endpoint.
4. Auth-flow: wire SignUp/Login/Reset naar bestaande `/api/auth/*` endpoints. Social buttons naar Google/Apple OAuth providers.
5. Abonnement-logica: storm-toggle must-check `user.plan === 'reed'`. Onboarding topic-selectie met REED-badge slaat alleen op; daadwerkelijke activatie pas ná upgrade.
6. Betaling: integreer via bestaande Mollie-setup. Momenteel is alles "Tijdelijk gratis" dus checkout doet geen payment-intent — wel accepteer en bewaar de gekozen methode voor straks.
7. Copy: alle NL-strings letterlijk overnemen uit de jsx-bestanden.
