"use server";

import { fetchWeatherData, getWeatherDescription } from "@/lib/weather";
import type { WeatherData } from "@/lib/types";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { getMainCommentary } from "@/lib/commentary";
import { Resend } from "resend";
import { getWelcomeEmailHtml } from "@/lib/welcome-email";
import { getBrandedMagicLinkHtml } from "@/lib/magic-link-email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PersonaTier } from "@/lib/personas";

/**
 * SNELLE weer-fetch. Geen AI. Open-Meteo cached 5 min (via fetch revalidate).
 * Client rendert hiermee meteen. getAiVerdict draait apart op de achtergrond.
 */
export async function getWeather(lat: number, lon: number): Promise<WeatherData> {
  return await fetchWeatherData(lat, lon);
}

/**
 * Gemini-verdict apart, zodat de UI niet op hem wacht. Valideert op
 * afgemaakte zinnen — truncated output wordt geweigerd.
 */
export async function getAiVerdict(weather: WeatherData): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return getMainCommentary(weather);

  let attempts = 0;
  while (attempts < 3) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ]
      });

      const tomorrow = weather.daily[1];
      const prompt = `
Je bent de weerverteller van WEERZONE. Stijl: Roddelpraat / VI / Powned — direct, brutaal, eerlijk, met mening. Geen gelul, wel netjes (geen scheldwoorden).

LENGTE (HARD):
- Exact 4 zinnen.
- Samen 50-75 woorden totaal.
- Korter of langer = fout.

STRUCTUUR (alle vier moeten erin, in deze volgorde):
1. NU: temp + lucht + gevoelstemp, met mening (lekker/ruk/meevaller).
2. STRAKS / RESTVAN DAG: wat gebeurt er vandaag nog, tot de avond — regen, wind, zon, wat merk je buiten.
3. VANAVOND / VANNACHT: afkoeling, opklaring, bui, wat dan ook.
4. MORGEN: één pittige dreun als heads-up — beter/slechter/hetzelfde.

STIJL:
- Schrijf alsof je op een terras zit met een biertje. Direct, scherp, met humor.
- Mening hebben mag. Voorbeelden: "Prima hoor.", "Niks om over te zeuren.", "Tegenvaller.", "Daar zit je dan.", "Gewoon doen.", "Jas aan en bek dicht."
- GEEN: 'analyse', 'verwachting', 'significant', 'conform', 'momenteel', 'gedurende', 'tikkeltje'.
- GEEN scheldwoorden, wel attitude.

VOORBEELD (qua toon/lengte — NIET kopiëren):
"Elf graden met een grijze lucht, voelt buiten als een schamele 9. De rest van de middag blijft het droog, dus geen excuus om op de bank te hangen. Vanavond klaart het iets op, richting de nacht zakt het naar 6 graden. Morgen tikken we de 14 aan, maar die motregen verpest de hele sfeer weer."

FEITEN NU:
Lucht: ${getWeatherDescription(weather.current.weatherCode)}
Temp: ${weather.current.temperature}° (voelt als ${weather.current.feelsLike}°)
Wind: ${weather.current.windSpeed} km/h
Regen nu: ${weather.current.precipitation} mm

VERLOOP VANDAAG (komende 6u):
Regen: ${weather.hourly.slice(0, 6).reduce((acc, h) => acc + h.precipitation, 0).toFixed(1)} mm
Max wind komende 6u: ${Math.max(...weather.hourly.slice(0, 6).map(h => h.windSpeed || 0))} km/h

VANAVOND/VANNACHT (uren 6-18):
Regen: ${weather.hourly.slice(6, 18).reduce((acc, h) => acc + h.precipitation, 0).toFixed(1)} mm
Min temp vannacht: ${Math.min(...weather.hourly.slice(6, 18).map(h => h.temperature))}°

MORGEN (${tomorrow.date}):
Max: ${tomorrow.tempMax}°, Min: ${tomorrow.tempMin}°
Lucht: ${getWeatherDescription(tomorrow.weatherCode)}
Regen: ${tomorrow.precipitationSum} mm

Geef nu het weerbericht (4 zinnen: nu → rest vandaag → vanavond/vannacht → morgen, 50-75 woorden, Roddelpraat-toon).
        `.trim();

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 2000, temperature: 0.8, topP: 0.95 },
      });

      const text = result.response.text().trim().replace(/^"|"$/g, '');
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      // Accept: 40-90 woorden EN eindigt op . ! of ? (niet afgekapt)
      const endsCleanly = /[.!?]["')\]]?\s*$/.test(text);
      if (text && wordCount >= 40 && wordCount <= 90 && endsCleanly) {
        return text;
      }
      console.warn(`AI output ongeldig (${wordCount}w, endsCleanly=${endsCleanly}), retry...`);
      attempts++;
    } catch (e) {
      attempts++;
      console.error(`AI Verdict attempt ${attempts} failed:`, e);
      await new Promise(r => setTimeout(r, 500));
    }
  }
  // Alle pogingen mislukt — deterministische fallback (géén halve output tonen)
  return getMainCommentary(weather);
}

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
    console.log(`Welcome email sent to ${email} for tier ${tier}`);
  } catch (err) {
    console.error("Failed to send welcome email:", err);
  }
}

/**
 * Genereert een Supabase inloglink en verstuurt deze in een branded WeerZone mail.
 * We dwingen 'email_confirm' af om te voorkomen dat Supabase zelf ook nog een mail stuurt.
 */
export async function sendBrandedMagicLink(email: string, tier: PersonaTier, fullName: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is missing");

  const admin = createSupabaseAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://weerzone.nl";
  const redirectTo = `${siteUrl}/auth/callback?next=/app/onboarding&tier=${tier}`;

  // 1. Zorg dat de gebruiker bestaat en GEMARKEERD IS ALS BEVESTIGD.
  // Dit is de truc: als de gebruiker al bevestigd is ("email_confirm: true"), 
  // dan vindt Supabase het niet nodig om zelf nog een mail te sturen.
  const { error: userError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName, chosen_tier: tier },
  });

  // Als de gebruiker al bestaat, updaten we hem alleen naar confirmed
  // en zetten chosen_tier zodat de DB-trigger / metadata-fallback de juiste
  // persona kent — ook als iemand eerder een andere persona koos.
  if (userError && userError.message.includes("already registered")) {
    const { data: list } = await admin.auth.admin.listUsers();
    const existingUser = list.users.find(u => u.email === email);
    if (existingUser) {
      await admin.auth.admin.updateUserById(existingUser.id, {
        email_confirm: true,
        user_metadata: {
          ...(existingUser.user_metadata ?? {}),
          full_name: fullName,
          chosen_tier: tier,
        },
      });
    }
  }

  // 2. Genereer de link (nu zal Supabase STIL blijven)
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });

  if (error) {
    console.error("Failed to generate magic link:", error);
    throw new Error(`Inloglink genereren mislukt: ${error.message}`);
  }

  // 3. Verstuur de branded mail via Resend
  const resend = new Resend(apiKey);
  const html = getBrandedMagicLinkHtml(tier, data.properties.action_link, fullName);

  await resend.emails.send({
    from: "WEERZONE <info@weerzone.nl>",
    to: email,
    subject: `Activeer je WEERZONE account voor ${tier.toUpperCase()} 🚀`,
    html,
  });

  console.log(`Branded Magic Link sent (and Supabase silenced) for ${email}`);
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
  // geen subscription maakt — die komt pas na /prijzen + /checkout.
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
  // wachten we tot na checkout. Bouwen we niet in het kritieke pad.
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

