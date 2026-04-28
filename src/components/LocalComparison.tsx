import { getStationsWeather } from "@/app/actions";
import { PROVINCE_LABELS, type Province } from "@/lib/places-data";

interface Props {
  cityName: string;
  province: string;
  localTemp: number;
}

export default async function LocalComparison({ cityName, province, localTemp }: Props) {
  const stations = await getStationsWeather();
  if (!stations || stations.length === 0) return null;

  // Groepeer stations per provincie (simpele mapping op basis van bekende namen)
  // In een ideale wereld heeft elk station een provincie-tag in types.ts
  const provLabel = PROVINCE_LABELS[province as Province] || province;
  
  // Bereken landelijk gemiddelde
  const avgNL = Math.round(stations.reduce((acc, s) => acc + s.temp, 0) / stations.length);
  const diffNL = localTemp - avgNL;

  let comparisonText = "";

  if (diffNL > 0) {
    comparisonText = `In ${cityName} is het momenteel ${diffNL}° warmer dan het landelijk gemiddelde (${avgNL}°).`;
  } else if (diffNL < 0) {
    comparisonText = `In ${cityName} is het momenteel ${Math.abs(diffNL)}° koeler dan het landelijk gemiddelde (${avgNL}°).`;
  } else {
    comparisonText = `In ${cityName} is de temperatuur momenteel exact gelijk aan het landelijk gemiddelde (${avgNL}°).`;
  }

  return (
    <div className="mt-4 pt-4 border-t border-white/5">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 text-[10px] font-black uppercase tracking-widest text-accent-cyan mb-2">
        Lokaal Vergelijk
      </div>
      <p className="text-sm text-white/60 leading-relaxed font-medium">
        {comparisonText} Onze 1x1km grid-technologie analyseert deze micro-verschillen continu om de meest nauwkeurige voorspelling voor jouw straat te garanderen.
      </p>
    </div>
  );
}
