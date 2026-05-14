import type { Place } from "@/lib/places-data";

type LocationCharacter = NonNullable<Place["character"]>;

export interface LocationWeatherProfile {
  label: string;
  summary: string;
  factors: string[];
  marianaContext: string;
}

const PROVINCE_CONTEXT: Record<string, { label: string; factor: string }> = {
  groningen: { label: "open klei en Waddeninvloed", factor: "veel windruimte over open land" },
  friesland: { label: "meren, weiland en Waddenlucht", factor: "snelle afwisseling tussen droge en vochtige lucht" },
  drenthe: { label: "zandgronden en hoger binnenland", factor: "sterkere nachtelijke afkoeling buiten bebouwing" },
  overijssel: { label: "Salland, Twente en IJsseldal", factor: "lokale verschillen tussen rivierdal en zandgrond" },
  flevoland: { label: "open polderland", factor: "weinig beschutting en duidelijke windinvloed" },
  gelderland: { label: "Veluwe, rivieren en Achterhoek", factor: "verschil tussen bos, rivier en open landbouwgebied" },
  utrecht: { label: "Heuvelrug en stedelijke kern", factor: "temperatuurverschil tussen stad en bosrand" },
  "noord-holland": { label: "Noordzee, IJsselmeer en stedelijke zones", factor: "winddraaiing tussen zee- en landlucht" },
  "zuid-holland": { label: "kust, delta en Randstad", factor: "stedelijke warmte naast maritieme invloed" },
  zeeland: { label: "delta, kust en zeearmen", factor: "sterke invloed van getijwater en zeewind" },
  "noord-brabant": { label: "zandgronden en beekdalen", factor: "lokale opwarming boven droge zandgrond" },
  limburg: { label: "Maasdal en heuvelachtig zuiden", factor: "temperatuur- en neerslagverschillen door hoogte" },
  antwerpen: { label: "Schelde, Kempen en stedelijke kern", factor: "mix van rivierlucht, stad en open Kempen" },
  "limburg-be": { label: "Kempen, Maas en Haspengouw", factor: "verschil tussen open veld, rivier en hogere gronden" },
  "oost-vlaanderen": { label: "Schelde, Leie en Vlaamse kouters", factor: "vochtige rivierlucht en open akkerland" },
  "vlaams-brabant": { label: "Brabantse kouters en stedelijke rand", factor: "lokale verschillen tussen open plateau en bebouwing" },
  "west-vlaanderen": { label: "Noordzee, polders en Leievallei", factor: "zeewind en vochtige polderlucht" },
};

const WADDEN_NAMES = new Set([
  "den helder",
  "texel",
  "de koog",
  "den burg",
  "oudeschild",
  "vlieland",
  "terschelling",
  "ameland",
  "schiermonnikoog",
  "harlingen",
  "lauwersoog",
]);

const URBAN_NAMES = new Set([
  "amsterdam",
  "rotterdam",
  "utrecht",
  "den haag",
  "eindhoven",
  "antwerpen",
  "gent",
  "brugge",
  "groningen",
  "tilburg",
  "almere",
  "breda",
  "nijmegen",
  "arnhem",
]);

function characterLabel(character?: LocationCharacter): string {
  switch (character) {
    case "coastal":
      return "kustplaats";
    case "urban":
      return "stedelijke locatie";
    case "highland":
      return "hogere locatie";
    default:
      return "binnenlandlocatie";
  }
}

function inferSpecialContext(place: Place): { label?: string; factors: string[] } {
  const name = place.name.toLowerCase();
  const factors: string[] = [];

  if (WADDEN_NAMES.has(name) || (place.lat > 52.7 && place.lon < 6.3 && place.character === "coastal")) {
    return {
      label: "Wadden- en Noordzeelocatie",
      factors: [
        "directe invloed van Noordzee en Waddenzee",
        "windrichting bepaalt sterk of lucht koel, vochtig of juist droger binnenkomt",
        "buienlijnen kunnen langs de kust sneller ontstaan of juist afbuigen",
      ],
    };
  }

  if (URBAN_NAMES.has(name) || place.character === "urban") {
    factors.push("stedelijk warmte-eiland bij rustige avonden");
    factors.push("neerslag en wind worden lokaal verstoord door bebouwing");
  }

  if (place.character === "coastal") {
    factors.push("zeewind dempt temperatuurpieken overdag");
    factors.push("kustbuien en mistbanken kunnen lokaal verschil maken");
  }

  if (place.character === "highland") {
    factors.push("hoogteverschillen versterken afkoeling en buienvorming");
    factors.push("wind en neerslag pakken anders uit dan in nabijgelegen dalen");
  }

  return { factors };
}

export function getLocationWeatherProfile(place: Place): LocationWeatherProfile {
  const provinceContext = PROVINCE_CONTEXT[place.province] ?? {
    label: "lokaal landschap",
    factor: "kleinschalige verschillen in temperatuur, wind en neerslag",
  };
  const special = inferSpecialContext(place);
  const label = special.label ?? `${characterLabel(place.character)} in ${provinceContext.label}`;
  const factors = [
    ...special.factors,
    provinceContext.factor,
    `coordinaten ${place.lat.toFixed(2)}, ${place.lon.toFixed(2)} voor lokale modelcorrectie`,
  ].slice(0, 4);

  return {
    label,
    factors,
    summary: `${place.name} is voor WEERZONE geen generieke plaatsnaam maar een ${label}. Daardoor wegen windrichting, ondergrond en nabij water of bebouwing anders mee dan in omliggende plaatsen.`,
    marianaContext: `Mariana gebruikt dit locatieprofiel als startpunt voor ${place.name}: eerst geografische verwachting, daarna steeds meer lokale correctie zodra forecasts en observaties binnenkomen.`,
  };
}
