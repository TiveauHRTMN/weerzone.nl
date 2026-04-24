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
 * Haalt de actuele temperatuur op voor alle KNMI-landstations in één batch.
 * Gebruikt voor de landelijke ticker.
 */
export async function getStationsWeather(): Promise<Array<{ name: string; temp: number }>> {
  const { KNMI_STATIONS } = await import("@/lib/types");
  
  const lats = KNMI_STATIONS.map(s => s.lat).join(",");
  const lons = KNMI_STATIONS.map(s => s.lon).join(",");
  
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m&timezone=Europe/Amsterdam`,
      { next: { revalidate: 600 } } // 10 min cache
    );
    
    if (!res.ok) throw new Error("Open-Meteo batch fetch failed");
    
    const data = await res.json();
    
    // Open-Meteo retourneert een array als we meerdere coördinaten sturen
    const results = Array.isArray(data) ? data : [data];
    
    return KNMI_STATIONS.map((s, i) => ({
      name: s.name.replace(" vliegbasis", "").replace(" Airport", ""),
      temp: Math.round(results[i].current.temperature_2m)
    }));
  } catch (error) {
    console.error("getStationsWeather error:", error);
    return [];
  }
}

/**
 * Piet's Deep Analysis: Uitsluitend voor de /piet pagina.
 * Forceert een ultra-uitgebreid meteorologisch dossier (300+ woorden).
 */
export async function getPietDeepAnalysis(weather: WeatherData): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return getMainCommentary(weather);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: `
Je bent Piet van Weerzone. Hyper-lokale weerman in het voetspoor van Piet Paulusma: warm, betrokken, op de hoogte van "hoe het daar nou is". Onderlaag Paulusma-vertelstijl (dichtbij de lezer, concreet, nuchter), bovenlaag Roddelpraat/VI/Powned (kort, scherp, droog, nooit zielig).

TONALE CONSISTENTIE — STRIKT:
- Spiegel de data. Als het zonnig is en ≥ 15° → positieve toon (prima dag, terras kan, lekker even naar buiten). Gebruik géén woorden als "troosteloos", "grijs", "ellendig" bij mooi weer.
- Somber/nat/hard waait? Wees eerlijk, praktisch en droog — nooit dramatisch of zielig.
- 14-daagse, glazen-bol-media, hypemakers, "weermannen met een mening": daar mag je droog op schieten. NOOIT op de gebruiker, NOOIT op een groep mensen (etniciteit, geloof, geaardheid, beperking).
- Getallen kloppen. Als de data zegt max 16° en zon → zeg "16° in de zon, prima aprildag", niet "troosteloze bende".

INHOUD:
- Schrijf een meelezend dagdeel-verslag (ochtend / middag / avond / nacht / morgen). Geen bullet-opsommingen.
- Leg concreet uit wat dat betekent voor je dag: kan de was buiten, moet de jas mee, is het terras aan.
- Geef één of twee lokale details waar het kan (wind aan de kust, stadse warmte, mist in het rivierengebied). Verzin geen plaatsnamen die niet in de data staan.
- 250–350 woorden, vloeiende paragrafen, 4–6 zinnen per paragraaf. Max 1 emoji in het hele dossier.

TAAL:
- 100% correct Nederlands. Geen anglicismen (geen "stay safe", "enjoy", "oant moarn").
- Geen modelnamen of techniek-merken. Niet "KNMI", "HARMONIE", "MetNet", "Google", "NeuralGCM", "SEED". Ook geen "1km-precisie" of "grid-resolutie". Praat gewoon over het weer.
- Geen scheldwoorden, geen vloeken (g*d, j*zus, k*t, k*lere zijn verboden).
- Eigenzinnige Hollandse groet als afsluiter (bv. "Houdoe, Piet", "Nou, Piet", "Tot morgen, Piet"). Altijd ondertekenen met "Piet van Weerzone" onderaan.
      `.trim(),
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 900,
      },
    });


    const hourlyData = weather.hourly.slice(0, 24).map(h =>
      `${new Date(h.time).getHours()}:00 (${h.temperature}°, ${h.precipitation}mm, wind ${h.windSpeed}km/h)`
    ).join(", ");

    // Tonale-hint op basis van echte data: voorkomt "troosteloos" bij 16° + zon.
    const maxToday = weather.daily[0]?.tempMax ?? weather.current.temperature;
    const rainToday = weather.daily[0]?.precipitationSum ?? 0;
    const code = weather.current.weatherCode;
    const zonnig = code === 0 || code === 1;
    const moodHint = (() => {
      if (zonnig && maxToday >= 15 && rainToday < 1) return "mooi-dag";        // positief, terras, lekker
      if (maxToday >= 20 && rainToday < 2) return "zomers";                     // opgewekt, opletten voor UV/drinken
      if (rainToday > 5 || (code >= 95 && code <= 99)) return "pittig-nat";    // eerlijk, praktisch
      if (maxToday < 5) return "koud";                                          // jas, warm drinken, niet dramatisch
      return "wisselend";                                                        // nuchter, laagdrempelig
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

Schrijf het dossier in jouw stem. Eindig met een droge Hollandse groet en ondertekening "Piet van Weerzone".
      `.trim();

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
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
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return getMainCommentary(weather);

  let attempts = 0;
  while (attempts < 3) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
        systemInstruction: `
Je bent Piet van Weerzone. Warme Paulusma-basis met droge VI/Powned-randen.

KERNREGELS:
- TOON SPIEGELT DE DATA. Zon en ≥ 15° → opgewekt. Regen/wind → eerlijk en praktisch. Nooit "troosteloos" bij mooi weer; nooit dramatisch bij een normale bui.
- SCHERP MAG, MAAR GERICHT. Alleen op 14-daagse / glazen-bol-media / hypemakers. Nooit op de lezer, nooit op groepen mensen.
- Correct Nederlands, geen vloeken, geen scheldwoorden.
- LENGTE: STRIKT MAXIMAAL 60 WOORDEN.
- INHOUD: Nu, straks, morgen — kort, concreet.
- VERBODEN: modelnamen (KNMI, HARMONIE, MetNet, NeuralGCM, SEED, Google), anglicismen ("oant moarn", "enjoy", "stay safe"), "1km-precisie"-achtige claims.
`.trim(),
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 220,
        },
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
- Nu: ${getWeatherDescription(weather.current.weatherCode)}, ${weather.current.temperature}°.
- Verloop komende uren: ${weather.hourly.slice(0, 6).map(h => h.temperature + "°").join(", ")}.
- Morgen: max ${tomorrow.tempMax}°, ${getWeatherDescription(tomorrow.weatherCode)}.

TOON: ${mood} — volg de data. Eindig met een korte Hollandse groet.
        `.trim();

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim().replace(/^"|"$/g, '');
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      
      if (text && wordCount < 80) {
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
 */
export async function getLocationSEOContent(placeName: string, province: string, character?: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return `Bekijk het actuele weer in ${placeName}. Vooruitzichten per uur exclusief van het KNMI.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `
      Je bent de SEO-copywriter van WEERZONE. Schrijf een KORTE, unieke tekst (max 2-3 zinnen) over de weerskenmerken van ${placeName} (${province}).
      ${character ? `Houd rekening met het karakter: ${character}.` : ""}
      - Gebruik geen clichés als "Welkom in". 
      - Link het naar de geografische ligging van ${placeName}.
      - Vertel bijvoorbeeld over de invloed van de zee (indien kust), de wind op de open vlakte, of de hitte in de stad (urban heat island).
      - De tekst moet informatief en autoritair klinken voor iemand die het weer zoekt.
    `.trim();

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("getLocationSEOContent error:", error);
    return `Het weer in ${placeName} (${province}) wordt beïnvloed door lokale geografische factoren. We tonen de meest recente data van HARMONIE en ICON.`;
  }
}
/**
 * Genereert een korte weerkundige samenvatting voor een hele provincie.
 */
export async function getProvinceVerdict(provinceLabel: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return `Bekijk de weersverwachting voor alle plaatsen in ${provinceLabel}.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `
      Je bent de meteoroloog van WEERZONE. Schrijf een KORTE, krachtige samenvatting (1-2 zinnen) over wat ${provinceLabel} als provincie weerkundig uniek maakt.
      Denk aan geografische kenmerken: de Zeeuwse stromen, de Limburgse heuvels, de Utrechtse Heuvelrug, of de Groningse open klei.
      Geen introducties, begin direct met de essentie.
    `.trim();

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    return `In ${provinceLabel} vind je diverse microklimaten. Van de kust tot de zandgronden, wij brengen het per uur in kaart.`;
  }
}

/**
 * Informeert Google dat de sitemap is bijgewerkt. 
 * Cruciaal voor programmatic SEO om nieuwe pagina's snel te laten indexeren.
 */
export async function pingSearchConsole() {
  const sitemapUrl = "https://weerzone.nl/sitemap.xml";
  const googlePing = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
  
  try {
    const res = await fetch(googlePing);
    if (res.ok) {
      console.log("✅ Google gepind voor sitemap update.");
      return { success: true };
    }
    throw new Error("Ping failed");
  } catch (error) {
    console.error("❌ Google ping mislukt:", error);
    return { success: false };
  }
}

/**
 * Checkt veilig of een gebruiker al een account heeft via de Admin API.
 * Gebruikt in de Smart Login flow.
 */
export async function checkUserExists(email: string): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  
  // We checken de public.user_profile tabel omdat listUsers() traag is en limieten heeft.
  // user_profile wordt altijd aangemaakt bij signup via de DB trigger.
  const { data, error } = await admin
    .from("user_profile")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  
  if (error) {
    console.error("checkUserExists error:", error);
    return false;
  }
  
  return !!data;
}
