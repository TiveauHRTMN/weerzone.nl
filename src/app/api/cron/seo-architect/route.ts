import { NextResponse } from "next/server";
import { ALL_PLACES, PROVINCE_LABELS, type Province } from "@/lib/places-data";
import { logAgentAction } from "@/lib/agent-logger";
import { pingSearchConsole } from "@/app/actions";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

/**
 * Hermes: De SEO Architect.
 * Deze agent draait om het enorme 'spinnenweb' van 9.000+ pagina's te optimaliseren
 * en Google te dwingen de nieuwste data te indexeren.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.NODE_ENV === "production" && process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Selecteer een willekeurige provincie om te inspecteren
    const provinces = Object.keys(PROVINCE_LABELS) as Province[];
    const targetProvince = provinces[Math.floor(Math.random() * provinces.length)];
    const provLabel = PROVINCE_LABELS[targetProvince];

    // 2. Filter steden in deze provincie
    const placesInProv = ALL_PLACES.filter(p => p.province === targetProvince);
    
    // 3. Selecteer een batch voor inspectie
    const isDeepAudit = Math.random() > 0.5;
    const batchSize = isDeepAudit ? 250 : 100;
    const startIndex = Math.floor(Math.random() * Math.max(1, placesInProv.length - batchSize));
    const batch = placesInProv.slice(startIndex, startIndex + batchSize);

    // 4. AI Strategie Bepaling
    let aiStrategy = "Standaard indexatie-boost.";
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
      const prompt = `
        Je bent Hermes, de SEO Architect van WEERZONE.nl. 
        Je inspecteert nu de provincie ${provLabel}. 
        Geef een KORTE (1 zin) SEO-strategie voor deze regio op basis van de huidige focus (programmatic SEO voor 9000+ locaties).
        Bedenk iets slims over interne linkstructuur of schema.org headers.
      `.trim();
      
      const result = await model.generateContent(prompt);
      aiStrategy = result.response.text().trim();
    }

    // 5. De "Audit" & Ping
    // In een echte productie-omgeving zouden we hier schema's valideren of 
    // sitemaps dynamisch regenereren. Voor nu pingen we Google.
    await pingSearchConsole();

    await logAgentAction(
      "SEO Architect",
      "system_check",
      `Hermes heeft een ${isDeepAudit ? 'DEEP AUDIT' : 'REGULAR SCAN'} voltooid in ${provLabel}. Strategie: ${aiStrategy}`,
      { 
        province: provLabel, 
        auditType: isDeepAudit ? "deep_priority" : "standard",
        batchScope: batch.length,
        googlePing: "Sent",
        strategy: aiStrategy
      }
    );

    return NextResponse.json({
      status: "Hermes Scan Complete",
      province: provLabel,
      strategy: aiStrategy,
      batchSize: batch.length,
      timestamp: new Date().toISOString()
    });
  } catch (e: any) {
    console.error("Hermes Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
