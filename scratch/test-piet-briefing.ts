import { GoogleGenerativeAI } from "@google/generative-ai";
import { Resend } from "resend";
import dotenv from "dotenv";
import path from "path";

// Load env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function testPiet() {
  console.log("🚀 Handmatige test Piet van WEERZONE (Volksheld Edition) start...");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY missing in .env.local");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const mockSlots = [
      { name: "Ochtend", temp: "11.2°C", feels: "9.5°C", rain: "0.2mm", uv: "1.2" },
      { name: "Middag", temp: "16.4°C", feels: "15.8°C", rain: "0.0mm", uv: "4.5" },
      { name: "Avond", temp: "14.1°C", feels: "12.2°C", rain: "1.5mm", uv: "0.0" },
      { name: "Nacht", temp: "9.8°C", feels: "7.4°C", rain: "0.5mm", uv: "0.0" },
    ];

    console.log("🤖 Piet aan het woord laten met model gemini-3-flash-preview...");
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      systemInstruction: `
        Je bent Piet van WEERZONE. Archetype: De nuchtere, vlijmscherpe volksheld. 
        Jouw stijl is geïnspireerd door Vandaag Inside en Roddelpraat: direct, 
        een tikkeltje brutaal, wars van ruis en altijd 'zeggen waar het op staat'. 
        
        PROTOCOLLEN:
        - TOON: Scherp, Hollands, nuchter. Gebruik humor en ironie. 
        - GEEN SCHELDWOORDEN: Je bent scherp, maar blijft beschaafd. 
        - EXPERTISE: Gebruik je brute rekenkracht voor 1km-precisie. 
          BELANGRIJK: Noem GEEN merknamen of modelnamen (zoals MetNet, Google, NeuralGCM) 
          tegen de gebruiker. Breng het als jouw eigen, superieure WEERZONE Intelligence.
        - AFSLUITER: Eindig ALTIJD met een krachtige, eigenzinnige Hollandse groet.
      `.trim()
    });
    
    const prompt = `
      Taak: Schrijf een test-weerbrief voor de founder van WEERZONE (info@weerzone.nl).
      Actualiteit: Noem dat we eindelijk die '14-daagse gokkers' van de troon gaan stoten met onze superieure precisie.
      DATA: ${JSON.stringify(mockSlots)}
    `;

    const result = await model.generateContent(prompt);
    const pietCommentary = result.response.text();

    console.log("📧 Email verzenden naar info@weerzone.nl...");
    const { data, error } = await resend.emails.send({
      from: "Piet | WEERZONE <piet@weerzone.nl>",
      to: ["info@weerzone.nl"],
      subject: "Snoeihard de beste | Piet's Update",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
          <div style="background: #22c55e; padding: 40px; color: white; text-align: center;">
            <p style="text-transform: uppercase; font-size: 11px; font-weight: 900; letter-spacing: 2px; margin-bottom: 10px; opacity: 0.8;">WEERZONE Intelligence Engine</p>
            <h1 style="margin: 0; font-size: 32px; font-weight: 900;">Piet's Directe Update</h1>
          </div>
          <div style="padding: 40px; background: white;">
            <div style="font-size: 18px; line-height: 1.8; color: #1e293b; font-weight: 500;">
              ${pietCommentary.replace(/\n/g, "<br>")}
            </div>
          </div>
          <div style="background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0;">
            <strong>WEERZONE</strong> · Geen gokwerk, maar 1km-precisie.
          </div>
        </div>
      `
    });

    if (error) throw error;
    console.log("✅ Test geslaagd! Email ID:", data?.id);

  } catch (err: any) {
    console.error("❌ Test mislukt:", err.message || err);
  }
}

testPiet();
