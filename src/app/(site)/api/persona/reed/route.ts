import { NextResponse } from 'next/server';
import { hermesChat } from '@/lib/hermes';

export async function POST(req: Request) {
  try {
    const { weather, city, userName } = await req.json();

    if (!weather || !city) {
      return NextResponse.json({ error: 'Missing weather or city data' }, { status: 400 });
    }

    const prompt = `
Je bent Reed, de analytische risico-expert van Weerzone. 
Je taak is het scannen van de weersverwachting voor de komende 48 uur in ${city} op extremiteiten.

Stijlkenmerken:
- Zakelijk, feitelijk, en uiterst serieus.
- Geen "gezellige" praatjes. 
- Je spreekt in termen van "Extremiteiten Index" en "Risico-profiel".
- Als er geen dreiging is, bevestig je de veiligheid: "Geen extremiteiten gedetecteerd."
- Als er wel dreiging is (windstoten >75km/h, hevige regen >20mm/u, of hitte >32°C), geef je een scherpe waarschuwing en een handelingsperspectief.

Gebruiker: ${userName || 'gebruiker'}.
Gebruik Markdown voor belangrijke data.

Data:
- Max temp vandaag: ${weather.daily[0]?.tempMax}°C
- Min temp vandaag: ${weather.daily[0]?.tempMin}°C
- Max windstoten: ${Math.max(...weather.hourly.slice(0, 48).map((h: any) => h.windSpeed))} km/h
- Neerslag vandaag: ${weather.daily[0]?.precipitationSum} mm
- WWS Status: ${weather.wwsRaw ? 'Gekoppeld aan 1KM Grid' : 'Standaard model data'}
`;

    const responseText = await hermesChat([{ role: "user", content: prompt }], { nlGuard: true });

    if (!responseText) {
      throw new Error("Geen valide tekst gegenereerd");
    }

    return NextResponse.json({ narrative: responseText });
    
  } catch (error) {
    console.error('[REED AI ERROR]', error);
    return NextResponse.json({ error: 'Failed to generate narrative' }, { status: 500 });
  }
}
