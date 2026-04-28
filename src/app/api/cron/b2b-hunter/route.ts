import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { fetchWeatherData } from "@/lib/weather";
import { findLeadsInCity, getLeadDetails } from "@/lib/b2b-discovery";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Resend } from "resend";
import { getB2BSubject, getB2BEmailHtml } from "@/lib/b2b-emails";
import { buildSnippet } from "@/lib/b2b-relevance";
import { logAgentAction } from "@/lib/agent-logger";

export const dynamic = "force-dynamic";
export const maxDuration = 300; 

const SAMPLE_CITIES = [
  "Amsterdam", "Rotterdam", "Den Haag", "Utrecht", "Eindhoven", 
  "Groningen", "Tilburg", "Almere", "Breda", "Nijmegen",
  "Apeldoorn", "Enschede", "Haarlem", "Arnhem", "Zaanstad",
  "Vlissingen", "Maastricht", "Zwolle", "Leiden", "Dordrecht"
];

const HUNT_TIERS = [
  { industry: "horeca", query: "strandtent beach club terras", trigger: "heat" },
  { industry: "dakdekker", query: "dakdekker loodgieter", trigger: "storm" },
  { industry: "hovenier", query: "hovenier tuinonderhoud", trigger: "frost" },
  { industry: "schildersbedrijf", query: "schildersbedrijf", trigger: "heavy_rain" }
];

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const resend = new Resend(process.env.RESEND_API_KEY || "dummy");

  const results = {
    scanned: 0,
    hotspotsFound: 0,
    leadsGenerated: 0,
    emailsSent: 0,
  };

  for (const city of SAMPLE_CITIES) {
    results.scanned++;
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&country=NL`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();
      const loc = geoData.results?.[0];
      if (!loc) continue;

      const weather = await fetchWeatherData(loc.latitude, loc.longitude);
      
      for (const tier of HUNT_TIERS) {
        const snippet = buildSnippet(weather, city, tier.industry as any);
        
        if (snippet.event && snippet.event.kind === tier.trigger) {
          results.hotspotsFound++;
          
          // AWS Bedrock Agent Simulation: "Market Awareness"
          // In 2026, we check for local events, festivals, or news that amplifies the weather impact
          const marketContext = `Local event check for ${city}: Possible outdoor activity spike.`;
          console.log(`[Bedrock Agent Steve] ${marketContext}`);

          const foundLeads = await findLeadsInCity(city, tier.query);
          
          for (const rawLead of foundLeads.slice(0, 3)) {
            const { data: existing } = await supabase
              .from("b2b_leads")
              .select("id")
              .eq("business_name", rawLead.businessName)
              .maybeSingle();

            if (existing) continue;

            const details = await getLeadDetails(rawLead.placeId);
            if (!details.website) continue;

            const domain = new URL(details.website).hostname.replace("www.", "");
            const contactEmail = `info@${domain}`;

            const { error: insertError } = await supabase
              .from("b2b_leads")
              .insert({
                business_name: rawLead.businessName,
                email: contactEmail,
                city: city,
                industry: tier.industry,
                source: "autonomous_hunter",
                status: "new",
                metadata: {
                  website: details.website,
                  weather_trigger: tier.trigger,
                  weather_event: snippet.event.label
                }
              });

            if (insertError) continue;
            results.leadsGenerated++;

            await logAgentAction(
                "B2B Ignite", 
                "lead_found", 
                `Nieuwe lead voor ${tier.industry}: ${rawLead.businessName} in ${city}`,
                { city, industry: tier.industry, website: details.website }
            );

            // Outreach
            const subject = getB2BSubject(tier.industry as any, city, 1, snippet);
            const html = getB2BEmailHtml(tier.industry as any, rawLead.businessName, city, snippet, 1);

            await resend.emails.send({
              from: "Steve | WEERZONE Zakelijk <info@weerzone.nl>",
              to: contactEmail,
              subject,
              html,
            });

            await logAgentAction(
                "B2B Ignite", 
                "outreach_sent", 
                `Outreach gemaild naar ${rawLead.businessName} (${contactEmail})`,
                { email: contactEmail, subject }
            );

            results.emailsSent++;
          }
        }
      }
    } catch (err) {
      console.error(`Hunter failed in ${city}:`, err);
    }
    
    if (results.emailsSent >= 5) break; 
  }

  await logAgentAction(
    "B2B Ignite", 
    "system_check", 
    `B2B Hunter cyclus afgerond. ${results.emailsSent} emails verstuurd en ${results.leadsGenerated} leads gegenereerd.`,
    results
  );

  // Paperclip Heartbeat
  const { logPaperclipHeartbeat } = await import("@/lib/agent-logger");
  await logPaperclipHeartbeat("B2B Ignite", results.emailsSent > 0 ? "healthy" : "degraded");

  return NextResponse.json({
    status: "Hunter Cycle Complete",
    summary: results
  });
}

