import type { Place } from "@/lib/places-data";
import { toMarianaLocation } from "./location";
import { loadMarianaMemory } from "./storage";
import type { MarianaLocationMemory, MarianaModelMemory, MarianaModelName } from "./types";

export interface MarianaLocalSEOIntelligence {
  locationId: string;
  summary: string;
  confidenceNote: string;
  dominantModels: string[];
  localRisks: string[];
  timingNote: string;
  sampleCount: number;
}

function sortedModels(memory: MarianaLocationMemory): Array<[MarianaModelName, MarianaModelMemory]> {
  return Object.entries(memory.modelStats)
    .filter((entry): entry is [MarianaModelName, MarianaModelMemory] => Boolean(entry[1]?.samples))
    .sort((a, b) => {
      const weightDiff = (b[1].weightHint ?? 0) - (a[1].weightHint ?? 0);
      return weightDiff !== 0 ? weightDiff : (b[1].samples ?? 0) - (a[1].samples ?? 0);
    });
}

function riskLabels(memory: MarianaLocationMemory): string[] {
  const signals = memory.weatherRegime?.signals ?? [];
  const labels: string[] = [];
  if (signals.includes("windy") || signals.includes("storm_gusts")) labels.push("windstoten");
  if (signals.includes("wet") || signals.includes("heavy_precipitation")) labels.push("neerslagtiming");
  if (signals.includes("near_freezing")) labels.push("gladheid rond het vriespunt");
  if (signals.includes("heat")) labels.push("hitte-opbouw");
  if (signals.includes("low_pressure")) labels.push("snelle weersomslag");
  return labels.slice(0, 3);
}

export async function getMarianaLocalSEOIntelligence(place: Place): Promise<MarianaLocalSEOIntelligence | null> {
  const location = toMarianaLocation(place);
  const memory = await loadMarianaMemory(location.locationId);
  if (!memory || memory.sampleCount < 3) return null;

  const models = sortedModels(memory);
  const dominantModels = models.slice(0, 2).map(([model]) => model);
  const risks = riskLabels(memory);
  const regime = memory.weatherRegime?.label ?? "lokaal weerregime";
  const topModel = dominantModels[0] ?? "het best scorende model";

  return {
    locationId: location.locationId,
    dominantModels,
    localRisks: risks,
    sampleCount: memory.sampleCount,
    confidenceNote: models.length
      ? `${topModel} heeft hier voorlopig de sterkste historische weging.`
      : "We bouwen hier nog modelweging op.",
    timingNote: risks.includes("neerslagtiming")
      ? "Voor deze locatie letten we extra op verschuivingen in buienlijnen en neerslagstart."
      : "Voor deze locatie bewaken we vooral timingverschuivingen tussen modelruns.",
    summary: `Voor ${place.name} herkennen we vooral het patroon "${regime}". We gebruiken ${memory.sampleCount} verificaties om modelvertrouwen en correcties per weerregime bij te stellen.`,
  };
}
