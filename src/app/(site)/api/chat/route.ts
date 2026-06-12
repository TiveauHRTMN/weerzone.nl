import { NextResponse } from "next/server";
import { hermesChat } from "@/lib/hermes";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `Je bent de WEERZONE weer-assistent. Je beantwoordt vragen over het weer in de stijl van WEERZONE: brutaal, direct, grappig maar altijd feitelijk correct. Denk Voetbal Inside / Roddelpraat maar dan over het weer.

REGELS:
- Antwoord ALTIJD in het Nederlands
- Max 3-4 zinnen, kort en krachtig
- Gebruik de weerdata die je krijgt — verzin NIETS
- Wees grof/grappig maar nooit kwetsend
- Geef concreet advies (jas mee? paraplu? smeren?)
- Gebruik emoji's spaarzaam maar effectief
- Geen AI-jargon, geen "als AI kan ik..."
- Schrijf alsof je een vriend adviseert aan de bar`;

export async function POST(req: Request) {
  try {
    const { question, weather, city } = await req.json();

    if (!question || !weather) {
      return NextResponse.json({ error: "Vraag en weerdata vereist" }, { status: 400 });
    }

    const weatherContext = JSON.stringify({
      stad: city,
      nu: {
        temp: weather.current.temperature,
        gevoels: weather.current.feelsLike,
        neerslag: weather.current.precipitation,
        wind: weather.current.windSpeed,
        windstoten: weather.current.windGusts,
        vochtigheid: weather.current.humidity,
        bewolking: weather.current.cloudCover,
        weercode: weather.current.weatherCode,
      },
      vandaag: {
        max: weather.daily[0].tempMax,
        min: weather.daily[0].tempMin,
        neerslag: weather.daily[0].precipitationSum,
        windMax: weather.daily[0].windSpeedMax,
      },
      morgen: {
        max: weather.daily[1]?.tempMax,
        min: weather.daily[1]?.tempMin,
        neerslag: weather.daily[1]?.precipitationSum,
        windMax: weather.daily[1]?.windSpeedMax,
      },
      zon: { op: weather.sunrise, onder: weather.sunset },
      uv: weather.uvIndex,
    });

    const answer = await hermesChat(
      [{ role: "user", content: `${SYSTEM_PROMPT}\n\nWEERDATA: ${weatherContext}\n\nVRAAG: ${question}` }],
      { temperature: 0.8, maxTokens: 200, nlGuard: true }
    ) || "Geen antwoord. Probeer het opnieuw.";

    return NextResponse.json({ answer });
  } catch (e: any) {
    console.error("Chat error:", e);
    return NextResponse.json({ 
      error: "Chat mislukt", 
      details: e.message || String(e),
      type: e.constructor?.name 
    }, { status: 500 });
  }
}
