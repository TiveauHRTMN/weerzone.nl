"use server";

import { fetchWeatherData, getWeatherDescription } from "@/lib/weather";
import type { WeatherData } from "@/lib/types";
import OpenAI from "openai";
import { hermesChat } from "@/lib/hermes";
import { getMainCommentary } from "@/lib/commentary";
import { Resend } from "resend";
import { getWelcomeEmailHtml } from "@/lib/welcome-email";
import { getBrandedMagicLinkHtml } from "@/lib/magic-link-email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BASE_URL } from "@/lib/sitemap-data";
import type { PersonaTier } from "@/lib/personas";
import type { Locale } from "@/config/locales";
import { venuePromptFragment, type VenueType } from "@/lib/venue-content";

/**
 * Geocodeer een Nederlandse postcode naar coördinaten (PDOK, gratis).
 * Onboarding gebruikt dit als GPS niet beschikbaar is, zodat het account
 * alsnog een `primary_lat/lon` krijgt en in de agent-cron belandt.
 */
export async function geocodePostcode(
  postcode: string,
): Promise<{ lat: number; lon: number; label: string } | null> {
  const { geocodePostcodeNL } = await import("@/lib/geocode");
  return geocodePostcodeNL(postcode);
}

/**
 * Update het profiel van de ingelogde gebruiker.
 */
export async function updateProfile(args: {
  fullName?: string;
  postcode?: string;
  lat?: number;
  lon?: number;
  locationName?: string;
  pietOn?: boolean;
  reedOn?: boolean;
  koosOn?: boolean;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd");

  const updates: Record<string, string | number> = {};
  if (args.fullName !== undefined) updates.full_name = args.fullName;
  if (args.postcode !== undefined) updates.postcode = args.postcode;
  if (args.lat !== undefined) updates.primary_lat = args.lat;
  if (args.lon !== undefined) updates.primary_lon = args.lon;
  if (Object.keys(updates).length > 0) {
    const { error } = await supabase
      .from("user_profile")
      .upsert({ id: user.id, email: user.email ?? "", updated_at: new Date().toISOString(), ...updates }, { onConflict: "id" });
    if (error) {
      console.error("Profile update error:", error);
      return { ok: false, error: error.message };
    }
  }

  if (args.lat !== undefined && args.lon !== undefined) {
    const { error: deleteError } = await supabase
      .from("user_locations")
      .delete()
      .eq("user_id", user.id)
      .eq("is_primary", true);
    if (deleteError) return { ok: false, error: deleteError.message };

    const { error: locationError } = await supabase.from("user_locations").insert({
      user_id: user.id,
      label: args.locationName?.trim() || "Mijn locatie",
      lat: args.lat,
      lon: args.lon,
      is_primary: true,
    });
    if (locationError) return { ok: false, error: locationError.message };
  }

  const preferenceProfileUpdates: Record<string, boolean> = {};
  if (args.pietOn !== undefined) preferenceProfileUpdates.piet_on = args.pietOn;
  if (args.reedOn !== undefined) preferenceProfileUpdates.reed_on = args.reedOn;
  if (args.koosOn !== undefined) preferenceProfileUpdates.koos_on = args.koosOn;

  const currentPreferences = (user.user_metadata?.agent_preferences ?? {}) as Record<string, unknown>;
  const agentPreferences = {
    ...currentPreferences,
    ...(args.pietOn !== undefined ? { piet: args.pietOn } : {}),
    ...(args.reedOn !== undefined ? { reed: args.reedOn } : {}),
    ...(args.koosOn !== undefined ? { koos: args.koosOn } : {}),
  };
  if (args.fullName || args.pietOn !== undefined || args.reedOn !== undefined || args.koosOn !== undefined) {
    const { error } = await supabase.auth.updateUser({
      data: {
        ...(args.fullName ? { full_name: args.fullName } : {}),
        agent_preferences: agentPreferences,
      },
    });
    if (error) return { ok: false, error: error.message };
  }

  if (Object.keys(preferenceProfileUpdates).length > 0) {
    const { error } = await supabase
      .from("user_profile")
      .upsert(
        {
          id: user.id,
          email: user.email ?? "",
          updated_at: new Date().toISOString(),
          ...preferenceProfileUpdates,
        },
        { onConflict: "id" },
      );
    if (error) console.warn("Agent preference profile mirror failed:", error.message);
  }

  return { ok: true };
}

/**
 * SNELLE weer-fetch. Geen AI. Open-Meteo cached 5 min (via fetch revalidate).
 * Client rendert hiermee meteen. getAiVerdict draait apart op de achtergrond.
 */
export async function getWeather(
  lat: number,
  lon: number,
  forceHighRes = false,
  locale: Locale = "nl",
  includeExternalAi = false
): Promise<WeatherData> {
  return await fetchWeatherData(lat, lon, false, forceHighRes, undefined, locale, includeExternalAi);
}

/**
 * Haalt de actuele temperatuur op voor alle KNMI-landstations in één batch.
 * Gebruikt voor de landelijke ticker.
 */
export async function getStationsWeather(): Promise<Array<{ name: string; temp: number; weatherCode: number; isDay: boolean }>> {
  const { KNMI_STATIONS } = await import("@/lib/types");

  const lats = KNMI_STATIONS.map(s => s.lat).join(",");
  const lons = KNMI_STATIONS.map(s => s.lon).join(",");

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,weather_code,is_day&timezone=Europe/Amsterdam`,
      { next: { revalidate: 600 } } // 10 min cache
    );

    if (!res.ok) throw new Error("Open-Meteo batch fetch failed");

    const data = await res.json();

    // Open-Meteo retourneert een array als we meerdere coördinaten sturen
    const results = Array.isArray(data) ? data : [data];

    return KNMI_STATIONS.map((s, i) => ({
      name: s.name.replace(" vliegbasis", "").replace(" Airport", ""),
      temp: Math.round(results[i].current.temperature_2m),
      weatherCode: results[i].current.weather_code ?? 0,
      isDay: results[i].current.is_day === 1,
    }));
  } catch (error) {
    console.error("getStationsWeather error:", error);
    return [];
  }
}

export async function getDEStationsWeather(): Promise<Array<{ name: string; temp: number; weatherCode: number; isDay: boolean }>> {
  return [];
}

export async function getBEStationsWeather(): Promise<Array<{ name: string; temp: number; weatherCode: number; isDay: boolean }>> {
  return [];
}

export async function getLUStationsWeather(): Promise<Array<{ name: string; temp: number; weatherCode: number; isDay: boolean }>> {
  return [];
}

export async function getFRStationsWeather(): Promise<Array<{ name: string; temp: number; weatherCode: number; isDay: boolean }>> {
  return [];
}

export async function getESStationsWeather(): Promise<Array<{ name: string; temp: number; weatherCode: number; isDay: boolean }>> {
  return [];
}

/**
 * Geeft de dichtstbijzijnde bekende plaats (met provincie) voor gegeven coördinaten.
 * Gebruikt Haversine-afstand over ALL_PLACES.
 */
export async function getNearestPlace(lat: number, lon: number): Promise<{ name: string; province: string; slug: string } | null> {
  const { ALL_PLACES, placeRouteSlug } = await import("@/lib/places-data");
  let nearest = ALL_PLACES[0];
  let minDist = Infinity;
  for (const p of ALL_PLACES) {
    const dLat = (p.lat - lat) * Math.PI / 180;
    const dLon = (p.lon - lon) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat * Math.PI / 180) * Math.cos(p.lat * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    const dist = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 6371;
    if (dist < minDist) { minDist = dist; nearest = p; }
  }
  return nearest ? { name: nearest.name, province: nearest.province, slug: placeRouteSlug(nearest) } : null;
}

/**
 * Piet's Deep Analysis: Uitsluitend voor de /piet pagina.
 * Forceert een ultra-uitgebreid meteorologisch dossier (300+ woorden).
 */
export async function getPietDeepAnalysis(weather: WeatherData): Promise<string> {
  try {
    const openai = new OpenAI({
      apiKey: process.env.AI_GATEWAY_API_KEY || "dummy-key-for-gateway",
      baseURL: "https://ai-gateway.vercel.sh/v1"
    });

    const hourlyData = weather.hourly.slice(0, 24).map(h =>
      `${new Date(h.time).getHours()}:00 (${h.temperature}°, ${h.precipitation}mm, wind ${h.windSpeed}km/h)`
    ).join(", ");

    const maxToday = weather.daily[0]?.tempMax ?? weather.current.temperature;
    const rainToday = weather.daily[0]?.precipitationSum ?? 0;
    const code = weather.current.weatherCode;
    const zonnig = code === 0 || code === 1;
    const moodHint = (() => {
      if (zonnig && maxToday >= 15 && rainToday < 1) return "mooi-dag";
      if (maxToday >= 20 && rainToday < 2) return "zomers";
      if (rainToday > 5 || (code >= 95 && code <= 99)) return "pittig-nat";
      if (maxToday < 5) return "koud";
      return "wisselend";
    })();

    const prompt = `
DATA VANDAAG & MORGEN (puur de cijfers, geen merken):
- Nu: ${weather.current.temperature}° (voelt als ${weather.current.feelsLike}°), ${getWeatherDescription(weather.current.weatherCode)}.
- Vandaag: min ${weather.daily[0]?.tempMin ?? "?"}°, max ${maxToday}°, neerslag ${rainToday} mm.
- Verloop 24 uur: ${hourlyData}.
- Morgen: max ${weather.daily[1].tempMax}°, min ${weather.daily[1].tempMin}°, neerslag ${weather.daily[1].precipitationSum} mm.

TONALE HINT (volg deze, want hij komt uit de data): ${moodHint}.
- "mooi-dag"    → positief, concreet, terras/wandeling/was-buiten mag genoemd.
- "zomers"     → opgewekt, let op hitte/UV/water.
- "pittig-nat" → eerlijk, droog, praktisch advies (jas, fiets, paraplu).
- "koud"       → nuchter, jas mee, niet dramatisch.
- "wisselend"  → laagdrempelig, beide scenario's benoemen.

Schrijf het dossier in jouw stem. Eindig met een droge Hollandse groet en ondertekening "— Piet, voor Weerzone".
      `.trim();

    const response = await openai.chat.completions.create({
      model: "deepseek/deepseek-v4-flash",
      messages: [
        {
          role: "system",
          content: `Je bent Piet van Weerzone. Direct, een beetje brutaal maar goudeerlijk, zoals aan tafel bij Vandaag Inside. Praat als een mens tegen een mens.

TONALE REGELS:
- Vertel mensen wat ze moeten doen: terrasje pakken, jas mee, of binnenblijven.
- Geen onzin, geen percentages, geen vage termen.
- STRIKT VERBODEN: Geen modelnamen (Harmonie, AROME, GFS, etc.), geen "onzekerheid", geen meteorologisch jargon.
- Gebruik gewone mensentaal.

INHOUD:
- Beschrijf de dagdelen: OCHTEND, MIDDAG, AVOND, NACHT, MORGEN.
- Begin elk dagdeel met de naam in vet (bv. "**Ochtend.**").
- 200–300 woorden. Wees to-the-point maar wel gezellig. Max 1 emoji.

- Ondertekenen met "— Piet van Weerzone".`
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.6,
      max_tokens: 600,
    }, {
      headers: {
        "vercel-ai-gateway-cache-control": "s-maxage=900, stale-if-error=86400",
        "x-vercel-ai-gateway-config": JSON.stringify({
          gateway: {
            fallback: ["deepseek/deepseek-v4-pro"]
          }
        })
      }
    });

    return response.choices[0]?.message?.content?.trim() || getMainCommentary(weather);
  } catch (e) {
    console.error("Piet Deep Analysis Error:", e);
    return getMainCommentary(weather);
  }
}

/**
 * Gemini-verdict apart, zodat de UI niet op hem wacht. Valideert op
 * afgemaakte zinnen — truncated output wordt geweigerd.
 */
export async function getAiVerdict(weather: WeatherData): Promise<string> {
  let attempts = 0;
  while (attempts < 3) {
    try {
      const openai = new OpenAI({
        apiKey: process.env.AI_GATEWAY_API_KEY || "dummy-key-for-gateway",
        baseURL: "https://ai-gateway.vercel.sh/v1"
      });

      const tomorrow = weather.daily[1];
      const maxToday = weather.daily[0]?.tempMax ?? weather.current.temperature;
      const rainToday = weather.daily[0]?.precipitationSum ?? 0;
      const zonnig = weather.current.weatherCode === 0 || weather.current.weatherCode === 1;
      const mood =
        zonnig && maxToday >= 15
          ? "mooi-dag"
          : rainToday > 5
            ? "nat"
            : maxToday < 5
              ? "koud"
              : "wisselend";
      const prompt = `
DATA:
- Nu: ${getWeatherDescription(weather.current.weatherCode)}, ${weather.current.temperature}°, voelt als ${weather.current.feelsLike}°.
- Wind: ${weather.current.windSpeed} km/u.
- Komende uren: ${weather.hourly.slice(0, 6).map(h => `${new Date(h.time).getHours()}u ${h.temperature}°`).join(", ")}.
- Morgen: max ${tomorrow?.tempMax ?? "?"}°, ${getWeatherDescription(tomorrow?.weatherCode ?? 0)}.

TOON: ${mood} — volg de data. Schrijf minimaal 3 zinnen. Eindig met een korte Hollandse groet.
        `.trim();

      const response = await openai.chat.completions.create({
        model: "deepseek/deepseek-v4-flash",
        messages: [
          {
            role: "system",
            content: `Je bent Piet van Weerzone. Een nuchtere vent met verstand van het weer. Praat direct tegen de mensen, zonder poespas. Geen gelul, gewoon vertellen waar we aan toe zijn vandaag en morgen.

KERNREGELS:
- TOON: Eerlijk, nuchter en praktisch. Geen vage percentages, maar concrete actie (bijv. "jas mee" of "lekker naar buiten").
- STRIKT VERBODEN: Geen jargon, geen modelnamen, geen ingewikkelde termen.
- LENGTE: 3-4 zinnen. Kort maar krachtig.
- AFSLUITER: Een lekkere nuchtere Hollandse groet.`
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 400,
        }, {
          headers: {
            "vercel-ai-gateway-cache-control": "s-maxage=900, stale-if-error=86400",
            "x-vercel-ai-gateway-config": JSON.stringify({
              gateway: {
                fallback: ["deepseek/deepseek-v4-pro"]
              }
            })
          }
        });
      const text = response.choices[0]?.message?.content?.trim().replace(/^"|"$/g, '') || "";
      const wordCount = text.split(/\s+/).filter(Boolean).length;

      if (text && wordCount >= 20 && wordCount < 120) {
        return text;
      }
      attempts++;
    } catch (e) {
      attempts++;
      console.error(`AI Summary attempt ${attempts} failed:`, e);
    }
  }
  return getMainCommentary(weather);
}

export async function getKarlWeatherVerdict(
  _weather: WeatherData,
  _cityName: string,
  _bundesland: string,
): Promise<string> {
  return "";
}

export async function getLucWeatherVerdict(
  _weather: WeatherData,
  _cityName: string,
  _region: string,
  _character?: string,
): Promise<string> {
  return "";
}

export async function getJuanWeatherVerdict(
  _weather: WeatherData,
  _cityName: string,
  _region: string,
  _character?: string,
): Promise<string> {
  return "";
}

export const getPabloWeatherVerdict = getJuanWeatherVerdict;

export async function findBusinessLeads(query: string) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY is not set in environment variables");
  }

  try {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.types",
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: "nl",
        maxResultCount: 20, // Maximaal 20 per keer voor overzicht
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Places API error:", errorData);
      throw new Error(`Google Places API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Transformeren naar een cleaner formaat
    return (data.places || []).map((place: any) => ({
      name: place.displayName?.text || "Onbekend",
      address: place.formattedAddress,
      website: place.websiteUri,
      phone: place.nationalPhoneNumber,
      types: place.types,
    }));
  } catch (error) {
    console.error("Lead finding error:", error);
    return [];
  }
}

/**
 * Verstuurt de branded Weerzone welkomstmail via Resend.
 */
export async function sendWelcomeEmail(email: string, tier: PersonaTier, city?: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set, skipping welcome email.");
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const html = getWelcomeEmailHtml(email, tier, city);

    await resend.emails.send({
      from: "WEERZONE <info@weerzone.nl>",
      to: email,
      subject: "BOEM! 🚀 Je bent nu officieel de baas over het weer bij WEERZONE!",
      html,
    });
    if (process.env.NODE_ENV !== "production") {
      console.log(`Welcome email sent to ${email} for tier ${tier}`);
    }
  } catch (err) {
    console.error("Failed to send welcome email:", err);
  }
}

/**
 * Genereert een Supabase inloglink en verstuurt deze in een branded WeerZone mail.
 * We dwingen 'email_confirm' af om te voorkomen dat Supabase zelf ook nog een mail stuurt.
 */
export async function sendBrandedMagicLink(
  email: string,
  tier: PersonaTier,
  fullName: string,
  opts: { mode?: "signup" | "login"; next?: string } = {},
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is missing");

  const mode = opts.mode ?? "signup";
  const admin = createSupabaseAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://weerzone.nl";
  // Login → terug naar het dashboard; activatie/signup → onboarding.
  const next = opts.next ?? (mode === "login" ? "/app" : "/app/onboarding");

  // 1. Zorg dat de gebruiker bestaat en GEMARKEERD IS ALS BEVESTIGD.
  // Dit is de truc: als de gebruiker al bevestigd is ("email_confirm: true"),
  // dan vindt Supabase het niet nodig om zelf nog een mail te sturen.
  const { error: userError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName, chosen_tier: tier },
  });

  // Als de gebruiker al bestaat, updaten we hem alleen naar confirmed.
  // Bij LOGIN raken we chosen_tier/full_name niet aan — anders overschrijven we
  // de bestaande persona-keuze van een terugkerende gebruiker.
  if (userError && userError.message.includes("already registered")) {
    const { data: list } = await admin.auth.admin.listUsers();
    const existingUser = list.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      await admin.auth.admin.updateUserById(existingUser.id, {
        email_confirm: true,
        user_metadata: mode === "login"
          ? (existingUser.user_metadata ?? {})
          : { ...(existingUser.user_metadata ?? {}), full_name: fullName, chosen_tier: tier },
      });
    }
  }

  // 2. Genereer een OTP-token (nu zal Supabase zelf STIL blijven).
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (error || !data?.properties?.hashed_token) {
    console.error("Failed to generate magic link:", error);
    throw new Error(`Inloglink genereren mislukt: ${error?.message ?? "geen token"}`);
  }

  // 3. Bouw een link naar ONZE callback (token_hash + type). De callback wisselt
  //    dit in met verifyOtp — robuust, geen PKCE-verifier nodig.
  const actionLink =
    `${siteUrl}/auth/callback` +
    `?token_hash=${encodeURIComponent(data.properties.hashed_token)}` +
    `&type=magiclink&next=${encodeURIComponent(next)}`;

  // 4. Verstuur de branded mail via Resend.
  const resend = new Resend(apiKey);
  const html = getBrandedMagicLinkHtml(tier, actionLink, fullName, mode);

  await resend.emails.send({
    from: "WEERZONE <info@weerzone.nl>",
    to: email,
    subject: mode === "login"
      ? "Je WEERZONE inloglink 👋"
      : `Activeer je WEERZONE account voor ${tier.toUpperCase()} 🚀`,
    html,
  });

  if (process.env.NODE_ENV !== "production") {
    console.log(`Branded Magic Link (${mode}) sent for ${email}`);
  }
}

/**
 * Registreer een nieuwe gebruiker met e-mail + wachtwoord — pre-confirmed.
 *
 * We doen admin.createUser met email_confirm:true zodat Supabase geen
 * bevestigingsmail stuurt. De client krijgt { ok:true } terug en kan dan
 * direct signInWithPassword aanroepen (client-side, zodat de sessie-cookies
 * via de browser-client worden gezet).
 *
 * chosen_tier + full_name gaan in user_metadata. De DB-trigger
 * handle_new_user (zie migratie 20260420_fix_chosen_tier.sql) maakt dan
 * automatisch de juiste subscription aan.
 */
export async function registerUser(args: {
  email: string;
  password: string;
  tier?: PersonaTier | null;
  fullName: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { email, password, tier, fullName } = args;

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: "Vul een geldig e-mailadres in." };
  }
  if (!password || password.length < 8) {
    return { ok: false, error: "Kies een wachtwoord van minimaal 8 tekens." };
  }

  const admin = createSupabaseAdminClient();
  // Zonder tier blijft chosen_tier weg uit metadata zodat de DB-trigger nog
  // geen agent-toegang aanmaakt; Mijn Weerzone handelt de persoonlijke laag af.
  const metadata: Record<string, unknown> = { full_name: fullName };
  if (tier) metadata.chosen_tier = tier;
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (error) {
    if (error.message.toLowerCase().includes("already")) {
      return {
        ok: false,
        error:
          "Dit e-mailadres heeft al een account. Log in of gebruik 'wachtwoord vergeten'.",
      };
    }
    return { ok: false, error: error.message };
  }

  // Optioneel: welkomstmail. Alleen als er al een tier bekend is; anders
  // bewaren we in Mijn Weerzone.
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey && tier) {
      const resend = new Resend(apiKey);
      const html = getWelcomeEmailHtml(email, tier);
      await resend.emails.send({
        from: "WEERZONE <info@weerzone.nl>",
        to: email,
        subject: `Welkom bij WEERZONE — ${tier.toUpperCase()}`,
        html,
      });
    }
  } catch (e) {
    console.error("Welcome email failed (non-fatal):", e);
  }

  return { ok: true };
}

/**
 * Impact Engine: Haalt Air Quality en Solar data op voor het dashboard.
 */
export async function getImpactAnalysisAction(lat: number, lon: number) {
  const { getImpactAnalysis } = await import("@/lib/impact-engine");
  return await getImpactAnalysis(lat, lon);
}

/**
 * Genereert een unieke weerkundige beschrijving voor een specifieke locatie.
 * Gebruikt voor Programmatic SEO om 'thin content' te voorkomen.
 *
 * - BEVAT CACHING: Checkt eerst Supabase, schrijft na generatie terug.
 * - Nederland-only: niet-NL callers krijgen dezelfde NL prompt en veroorzaken
 *   geen aparte internationale SEO-cache.
 */
export async function getLocationSEOContent(
  placeName: string,
  province: string,
  character?: string,
  venueType?: VenueType,
  _locale: "nl" | "de" | "fr" | "es" = "nl",
): Promise<string> {
  try {
    const supabase = createSupabaseAdminClient();

    // 1. Check cache
    try {
      const { data: existing } = await supabase
        .from("seo_injections")
        .select("ai_strategy")
        .eq("place_name", placeName)
        .eq("province", province)
        .maybeSingle();

      if (existing?.ai_strategy && !existing.ai_strategy.includes("Batch SEO")) {
        return existing.ai_strategy;
      }
    } catch (err) {
      console.error("SEO cache check failed:", err);
    }

    const prompt = `Je bent de SEO-copywriter van WEERZONE. Schrijf een KORTE, unieke tekst (max 2-3 zinnen) over de weerskenmerken van ${placeName} (${province}).
${character ? `Houd rekening met het karakter: ${character}.` : ""}
${venueType ? venuePromptFragment(placeName, venueType) : ""}
- Gebruik geen clichés als "Welkom in".
- Link het naar de geografische ligging van ${placeName}.
- Vertel bijvoorbeeld over de invloed van de zee (indien kust), de wind op de open vlakte, of de hitte in de stad (urban heat island).
- De tekst moet informatief en autoritair klinken voor iemand die het weer zoekt.`.trim();

    const content = (await hermesChat([{ role: "user", content: prompt }], { model: "seo", nlGuard: true })).trim();

    // 2. Persist to cache zodat we geen herhaalde Hermes-calls doen.
    try {
      await supabase.from("seo_injections").upsert(
        {
          place_name: placeName,
          province,
          ai_strategy: content,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "place_name,province" },
      );
    } catch (err) {
      console.error("SEO cache write failed:", err);
    }

    return content;
  } catch (error) {
    console.error("getLocationSEOContent error:", error);
    return `Het weer in ${placeName} (${province}) wordt beïnvloed door lokale geografische factoren. Wij tonen de nauwkeurigste actuele voorspelling voor uw locatie.`;
  }
}
/**
 * Genereert een korte weerkundige samenvatting voor een hele provincie.
 */
export async function getProvinceVerdict(provinceLabel: string): Promise<string> {
  try {
    const prompt = `Je bent de meteoroloog van WEERZONE. Schrijf een KORTE, krachtige samenvatting (1-2 zinnen) over wat ${provinceLabel} als provincie weerkundig uniek maakt.
      Denk aan geografische kenmerken: de Zeeuwse stromen, de Limburgse heuvels, de Utrechtse Heuvelrug, of de Groningse open klei.
      Geen introducties, begin direct met de essentie.`.trim();

    return (await hermesChat([{ role: "user", content: prompt }], { model: "seo", nlGuard: true })).trim();
  } catch {
    return `In ${provinceLabel} vind je diverse microklimaten. Van de kust tot de zandgronden, wij brengen het per uur in kaart.`;
  }
}

/**
 * Best-effort ping voor de sitemap-index. De index verwijst naar alle child-sitemaps.
 */
export async function pingSearchConsole() {
  const sitemapUrl = `${BASE_URL}/sitemap.xml`;

  try {
    const googlePing = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    const res = await fetch(googlePing);

    if (res.ok) {
      if (process.env.NODE_ENV !== "production") {
        console.log("Google gepind voor sitemap update.");
      }
      return { success: true };
    }
    throw new Error(`Ping failed with status ${res.status}`);
  } catch (error) {
    console.error("Google ping mislukt:", error);
    return { success: false };
  }
}

/**
 * Checkt veilig of een gebruiker al een account heeft via de Admin API.
 * Gebruikt in de Smart Login flow.
 */
export async function checkUserExists(email: string): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  const normalized = email.trim().toLowerCase();

  // 1. Snelle weg: de user_profile-mirror. Goedkoop, maar kan achterlopen op
  //    auth.users (de trigger heeft historisch niet elke gebruiker gespiegeld).
  const { data, error } = await admin
    .from("user_profile")
    .select("id")
    .ilike("email", normalized)
    .maybeSingle();

  if (error) {
    console.error("checkUserExists (mirror) error:", error);
  } else if (data) {
    return true;
  }

  // 2. Bron van waarheid: auth.users. We vallen hier ALTIJD op terug bij een
  //    mirror-miss, zodat een ontbrekende user_profile-rij nooit meer kan leiden
  //    tot het "geen account → maak account → bestaat al"-slot.
  try {
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) {
      console.error("checkUserExists (auth) error:", listErr);
      return false;
    }
    return list.users.some((u) => u.email?.toLowerCase() === normalized);
  } catch (e) {
    console.error("checkUserExists (auth) threw:", e);
    return false;
  }
}

/**
 * Verwijdert het account van de INGELOGDE gebruiker, onomkeerbaar.
 *
 * Identiteit komt uitsluitend uit de sessie (getUser); confirmEmail is alleen
 * een veiligheidsbevestiging die server-side opnieuw wordt gecheckt. De
 * admin-client wist eerst de mirror-data en daarna het auth-account zelf.
 */
export async function deleteAccount(
  args: { confirmEmail: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Niet ingelogd" };

  const typed = (args.confirmEmail ?? "").trim().toLowerCase();
  if (!typed || typed !== (user.email ?? "").toLowerCase()) {
    return { ok: false, error: "E-mailadres komt niet overeen" };
  }

  const admin = createSupabaseAdminClient();

  // Mirror-data best-effort opruimen (een FK-cascade dekt dit mogelijk al).
  const cleanups = [
    admin.from("user_locations").delete().eq("user_id", user.id),
    admin.from("subscriptions").delete().eq("user_id", user.id),
    admin.from("user_profile").delete().eq("id", user.id),
  ];
  for (const c of cleanups) {
    const { error } = await c;
    if (error) console.warn("deleteAccount mirror-cleanup:", error.message);
  }

  const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
  if (delErr) {
    console.error("deleteAccount deleteUser error:", delErr.message);
    return { ok: false, error: "Account verwijderen mislukt. Probeer het later opnieuw." };
  }

  return { ok: true };
}
