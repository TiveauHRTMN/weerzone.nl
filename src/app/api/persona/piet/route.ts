import { NextResponse } from 'next/server';
import { getGeminiPro } from '@/lib/google/vertex';

export async function POST(req: Request) {
  try {
    const { weather, city, userName } = await req.json();

    if (!weather || !city) {
      return NextResponse.json({ error: 'Missing weather or city data' }, { status: 400 });
    }

    const model = getGeminiPro();

    const prompt = `
Je bent Piet, de nuchtere, eerlijke en betrouwbare weerman van Weerzone.
Je schrijft een compact, duidelijk weerdossier (maximaal 3 korte paragrafen) voor de komende 48 uur in ${city}.
Gebruik geen jargon, maar wees direct. Als het gaat regenen, zeg dan wanneer en hoe hard.
Richt je direct tot de gebruiker: ${userName || 'gebruiker'}.
Gebruik Markdown voor nadruk (bijv. **bold** voor belangrijke weersverschijnselen).
Sluit af met een korte, praktische, nuchtere tip.

Weerdata om te analyseren:
- Temperatuur nu: ${weather.current.temperature}°C (voelt als ${weather.current.feelsLike}°C)
- Wind: ${weather.current.windSpeed} km/h uit ${weather.current.windDirection}
- Neerslag vandaag: ${weather.daily[0]?.precipitationSum} mm
- Korte voorspelling: ${weather.summaryVerdict || 'Geen specifieke samenvatting'}
`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error("Geen valide tekst gegenereerd door Vertex AI");
    }

    return NextResponse.json({ narrative: responseText });
    
  } catch (error) {
    console.error('[PIET AI ERROR]', error);
    return NextResponse.json({ error: 'Failed to generate narrative' }, { status: 500 });
  }
}
