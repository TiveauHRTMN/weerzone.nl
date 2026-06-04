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
  "oost-vlieland",
  "terschelling",
  "west-terschelling",
  "ameland",
  "schiermonnikoog",
  "griend",
  "richel",
  "engelsmanplaat",
  "noorderhaaks",
  "razende bol",
  "rottumerplaat",
  "rottumeroog",
  "simonszand",
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

const PLACE_OVERRIDES: Record<string, {
  label: string;
  summary: string;
  factors: string[];
}> = {
  "den helder": {
    label: "kuststad aan de kop van Noord-Holland",
    summary:
      "Den Helder is voor WEERZONE een uitgesproken kuststad aan de noordelijke windvang. Zeelucht, open aanvoer en snel draaiende stroming maken het weer hier anders dan in het binnenland.",
    factors: [
      "open zeewind vanaf de Noordzee",
      "snelle omslag tussen droge en vochtige lucht",
      "kustmist en buien kunnen hier eerder binnenrollen",
    ],
  },
  amsterdam: {
    label: "stedelijke warmte-eilandkern aan het IJ",
    summary:
      "Amsterdam gedraagt zich als een compacte stadsomgeving met grachten, steen en veel bebouwing. Daardoor blijft warmte langer hangen en wordt wind lokaal gestuurd door de stadsvorm.",
    factors: [
      "stedelijke warmteopslag in de bebouwde kom",
      "grachten en open water geven kleine lokale temperatuursprongen",
      "windkanalen tussen bebouwing en langs brede straten",
    ],
  },
  "den haag": {
    label: "duinrand en bestuurlijke stad aan zee",
    summary:
      "Den Haag zit precies op de overgang tussen duinen, kustlucht en een dicht stedelijk weefsel. Dat geeft een mix van maritieme invloed en stedelijke opwarming.",
    factors: [
      "duinrand dempt of versnelt kustinvloed per wijk",
      "stedelijke opwarming rond het centrum en de randen",
      "zeewind en kustmist verschillen snel per afstand tot de kust",
    ],
  },
  antwerpen: {
    label: "Scheldestad met havenlucht",
    summary:
      "Antwerpen krijgt zijn eigen weerkarakter door de Schelde, de haven en de open aanvoer richting de Kempen. Die combinatie maakt wind en vocht hier opvallend lokaal.",
    factors: [
      "rivierlucht langs de Schelde",
      "haven en brede verharding versterken stedelijke opwarming",
      "open aanvoer vanuit de Kempen kan de lucht snel laten omslaan",
    ],
  },
  berlin: {
    label: "continentale metropool op de vlakte",
    summary:
      "Berlijn is een grote stedelijke vlakte met meer continentale warmte- en kouverschillen dan kuststeden. Daardoor reageren temperatuur en wind hier sterker op droge of juist vochtige aanvoer.",
    factors: [
      "grote stedelijke warmte-eilandwerking",
      "meer continentale lucht dan maritieme invloed",
      "droge, warme of koude lucht kan lang blijven hangen boven de stad",
    ],
  },
};

const MICRO_TAGS = {
  coastal: [
    "zoute kustrand",
    "duinvoorzijde",
    "havenkom",
    "windrijke zeekant",
    "strandzone",
    "delta-adem",
  ],
  urban: [
    "stenen warmte-eiland",
    "compacte stadskern",
    "verharde stadszone",
    "bebouwde kom",
    "stedelijke canyon",
    "asfaltkamer",
  ],
  highland: [
    "hellingrand",
    "hoogtekamer",
    "plateaurand",
    "dalzoom",
    "reliëfzone",
    "randen van hoger terrein",
  ],
  inland: [
    "open binnenland",
    "akkerlint",
    "polderrand",
    "bos- en beekzone",
    "dorpslint",
    "landschapskamer",
  ],
} as const;

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickFrom<T>(items: readonly T[], seed: number): T {
  return items[seed % items.length];
}

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

function microTagKey(character?: LocationCharacter): keyof typeof MICRO_TAGS {
  if (character === "coastal" || character === "urban" || character === "highland" || character === "inland") {
    return character;
  }
  if (character === "mountain") return "highland";
  if (character === "mediterranean coastal" || character === "atlantic coastal") return "coastal";
  return "inland";
}

function inferSpecialContext(place: Place): { label?: string; summary?: string; factors: string[] } {
  const name = normalizeName(place.name);
  const override = PLACE_OVERRIDES[name];
  const factors: string[] = [];

  if (override) {
    return override;
  }

  if (WADDEN_NAMES.has(name) || (place.lat > 52.7 && place.lon < 6.3 && place.character === "coastal")) {
    return {
      label: "Wadden- en Noordzeelocatie",
      summary:
        `${place.name} ligt op een plek waar de zee de toon zet. Wind, vocht en kustmist kunnen hier sneller doorslaan dan verder landinwaarts.`,
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

  const hash = hashString(`${name}|${place.province}|${place.lat.toFixed(3)}|${place.lon.toFixed(3)}`);
  const character = place.character ?? "inland";
  const tag = pickFrom(MICRO_TAGS[microTagKey(character)], hash);
  const orientation = pickFrom([
    "windvang",
    "vochtzone",
    "warmtekamer",
    "overgangsrand",
    "luchtcorridor",
    "stille hoek",
  ] as const, hash >> 2);

  return {
    label: `${characterLabel(place.character)} met ${tag}`,
    summary: `${place.name} heeft voor WEERZONE een eigen signatuur: een ${tag} met ${orientation}. Daardoor krijgt deze plek net andere wind-, temperatuur- en neerslagaccenten dan omliggende locaties.`,
    factors: [
      `${tag} bepaalt hoe snel lucht hier doorstroomt`,
      `${orientation} stuurt lokale temperatuurverschillen`,
      `coördinaten ${place.lat.toFixed(2)}, ${place.lon.toFixed(2)} voor lokale modelcorrectie`,
    ],
  };
}

export function getLocationWeatherProfile(place: Place): LocationWeatherProfile {
  const provinceContext = PROVINCE_CONTEXT[place.province] ?? {
    label: "lokaal landschap",
    factor: "kleinschalige verschillen in temperatuur, wind en neerslag",
  };
  const special = inferSpecialContext(place);
  const label = special.label ?? `${characterLabel(place.character)} in ${provinceContext.label}`;
  const summary = special.summary
    ?? `${place.name} is voor WEERZONE geen generieke plaatsnaam maar een ${label}. Daardoor wegen windrichting, ondergrond en nabij water of bebouwing anders mee dan in omliggende plaatsen.`;
  const factors = [
    ...special.factors,
    provinceContext.factor,
    `coördinaten ${place.lat.toFixed(2)}, ${place.lon.toFixed(2)} voor lokale modelcorrectie`,
  ].slice(0, 4);

  return {
    label,
    factors,
    summary,
    marianaContext: `Mariana gebruikt dit locatieprofiel als startpunt voor ${place.name}: eerst geografische verwachting, daarna steeds meer lokale correctie zodra forecasts en observaties binnenkomen.`,
  };
}
