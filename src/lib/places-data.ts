/**
 * Alle Nederlandse woonplaatsen — gegroepeerd per provincie.
 * Dit bestand wordt continu uitgebreid door OpenClaw's SEO engine.
 * 
 * Elke plaats wordt een eigen pagina op /weer/[province]/[place]
 * die rankt voor "weer [plaatsnaam]" in Google.
 * 
 * DOEL: ~7.000 plaatsen → ~7.000 indexeerbare pagina's.
 */

export interface Place {
  name: string;
  province: string;
  lat: number;
  lon: number;
  population?: number;
}

export type Province =
  | "groningen"
  | "friesland"
  | "drenthe"
  | "overijssel"
  | "flevoland"
  | "gelderland"
  | "utrecht"
  | "noord-holland"
  | "zuid-holland"
  | "zeeland"
  | "noord-brabant"
  | "limburg";

export const PROVINCE_LABELS: Record<Province, string> = {
  groningen: "Groningen",
  friesland: "Friesland",
  drenthe: "Drenthe",
  overijssel: "Overijssel",
  flevoland: "Flevoland",
  gelderland: "Gelderland",
  utrecht: "Utrecht",
  "noord-holland": "Noord-Holland",
  "zuid-holland": "Zuid-Holland",
  zeeland: "Zeeland",
  "noord-brabant": "Noord-Brabant",
  limburg: "Limburg",
};

// ============================================================
// PLAATSEN DATABASE
// OpenClaw voegt hier continu plaatsen aan toe.
// Sorteer per provincie, alfabetisch op naam.
// ============================================================

export const ALL_PLACES: Place[] = [
  // ── GRONINGEN ──
  { name: "Groningen", province: "groningen", lat: 53.2194, lon: 6.5665, population: 234000 },
  { name: "Appingedam", province: "groningen", lat: 53.3219, lon: 6.8569, population: 12000 },
  { name: "Delfzijl", province: "groningen", lat: 53.3306, lon: 6.9167, population: 25000 },
  { name: "Hoogezand", province: "groningen", lat: 53.1614, lon: 6.7594, population: 22000 },
  { name: "Leek", province: "groningen", lat: 53.1625, lon: 6.3750, population: 19000 },
  { name: "Stadskanaal", province: "groningen", lat: 52.9906, lon: 6.9506, population: 33000 },
  { name: "Veendam", province: "groningen", lat: 53.1069, lon: 6.8792, population: 28000 },
  { name: "Winschoten", province: "groningen", lat: 53.1442, lon: 7.0347, population: 18000 },
  { name: "Ter Apel", province: "groningen", lat: 52.8756, lon: 7.0642, population: 10000 },
  { name: "Haren", province: "groningen", lat: 53.1717, lon: 6.6100, population: 19000 },
  { name: "Zuidhorn", province: "groningen", lat: 53.2469, lon: 6.3997, population: 7500 },
  { name: "Bedum", province: "groningen", lat: 53.3000, lon: 6.6028, population: 10500 },
  { name: "Loppersum", province: "groningen", lat: 53.3319, lon: 6.7486, population: 3200 },
  { name: "Uithuizen", province: "groningen", lat: 53.4089, lon: 6.6753, population: 4600 },
  { name: "Warffum", province: "groningen", lat: 53.3928, lon: 6.5619, population: 2100 },

  // ── FRIESLAND ──
  { name: "Leeuwarden", province: "friesland", lat: 53.2012, lon: 5.7999, population: 124000 },
  { name: "Drachten", province: "friesland", lat: 53.1033, lon: 6.1003, population: 45000 },
  { name: "Heerenveen", province: "friesland", lat: 52.9581, lon: 5.9253, population: 50000 },
  { name: "Sneek", province: "friesland", lat: 53.0333, lon: 5.6614, population: 34000 },
  { name: "Harlingen", province: "friesland", lat: 53.1744, lon: 5.4236, population: 16000 },
  { name: "Franeker", province: "friesland", lat: 53.1867, lon: 5.5408, population: 13000 },
  { name: "Dokkum", province: "friesland", lat: 53.3264, lon: 5.9972, population: 13000 },
  { name: "Bolsward", province: "friesland", lat: 53.0614, lon: 5.5267, population: 10000 },
  { name: "Joure", province: "friesland", lat: 52.9669, lon: 5.7944, population: 13000 },
  { name: "Wolvega", province: "friesland", lat: 52.8808, lon: 5.9942, population: 13000 },
  { name: "Lemmer", province: "friesland", lat: 52.8450, lon: 5.7103, population: 10000 },
  { name: "Bakkeveen", province: "friesland", lat: 53.0711, lon: 6.2617, population: 1800 },
  { name: "Grou", province: "friesland", lat: 53.0922, lon: 5.8308, population: 5500 },
  { name: "Workum", province: "friesland", lat: 52.9808, lon: 5.4436, population: 4500 },
  { name: "Kollum", province: "friesland", lat: 53.2878, lon: 6.1544, population: 3500 },

  // ── DRENTHE ──
  { name: "Assen", province: "drenthe", lat: 52.9925, lon: 6.5625, population: 68000 },
  { name: "Emmen", province: "drenthe", lat: 52.7833, lon: 6.8958, population: 57000 },
  { name: "Hoogeveen", province: "drenthe", lat: 52.7239, lon: 6.4756, population: 56000 },
  { name: "Meppel", province: "drenthe", lat: 52.6958, lon: 6.1950, population: 34000 },
  { name: "Coevorden", province: "drenthe", lat: 52.6608, lon: 6.7408, population: 14000 },
  { name: "Beilen", province: "drenthe", lat: 52.8589, lon: 6.5136, population: 10000 },
  { name: "Borger", province: "drenthe", lat: 52.9244, lon: 6.7939, population: 4500 },
  { name: "Roden", province: "drenthe", lat: 53.1383, lon: 6.4286, population: 14000 },
  { name: "Zuidlaren", province: "drenthe", lat: 53.0947, lon: 6.6650, population: 8500 },
  { name: "Gieten", province: "drenthe", lat: 53.0036, lon: 6.7661, population: 5500 },

  // ── OVERIJSSEL ──
  { name: "Zwolle", province: "overijssel", lat: 52.5168, lon: 6.0830, population: 131000 },
  { name: "Enschede", province: "overijssel", lat: 52.2215, lon: 6.8937, population: 160000 },
  { name: "Deventer", province: "overijssel", lat: 52.2551, lon: 6.1639, population: 101000 },
  { name: "Almelo", province: "overijssel", lat: 52.3567, lon: 6.6625, population: 73000 },
  { name: "Hengelo", province: "overijssel", lat: 52.2658, lon: 6.7931, population: 81000 },
  { name: "Kampen", province: "overijssel", lat: 52.5550, lon: 5.9114, population: 54000 },
  { name: "Hardenberg", province: "overijssel", lat: 52.5750, lon: 6.6167, population: 27000 },
  { name: "Raalte", province: "overijssel", lat: 52.3872, lon: 6.2756, population: 37000 },
  { name: "Oldenzaal", province: "overijssel", lat: 52.3133, lon: 6.9292, population: 32000 },
  { name: "Steenwijk", province: "overijssel", lat: 52.7875, lon: 6.1194, population: 18000 },
  { name: "Rijssen", province: "overijssel", lat: 52.3100, lon: 6.5167, population: 30000 },
  { name: "Ommen", province: "overijssel", lat: 52.5264, lon: 6.4247, population: 18000 },

  // ── FLEVOLAND ──
  { name: "Almere", province: "flevoland", lat: 52.3508, lon: 5.2647, population: 218000 },
  { name: "Lelystad", province: "flevoland", lat: 52.5085, lon: 5.4750, population: 80000 },
  { name: "Dronten", province: "flevoland", lat: 52.5258, lon: 5.7186, population: 41000 },
  { name: "Emmeloord", province: "flevoland", lat: 52.7108, lon: 5.7483, population: 27000 },
  { name: "Urk", province: "flevoland", lat: 52.6614, lon: 5.5983, population: 21000 },
  { name: "Zeewolde", province: "flevoland", lat: 52.3311, lon: 5.5428, population: 23000 },
  { name: "Biddinghuizen", province: "flevoland", lat: 52.4417, lon: 5.7039, population: 5000 },
  { name: "Swifterbant", province: "flevoland", lat: 52.5667, lon: 5.6333, population: 7500 },

  // ── GELDERLAND ──
  { name: "Arnhem", province: "gelderland", lat: 51.9851, lon: 5.8987, population: 164000 },
  { name: "Nijmegen", province: "gelderland", lat: 51.8126, lon: 5.8372, population: 179000 },
  { name: "Apeldoorn", province: "gelderland", lat: 52.2112, lon: 5.9699, population: 165000 },
  { name: "Ede", province: "gelderland", lat: 52.0478, lon: 5.6692, population: 118000 },
  { name: "Doetinchem", province: "gelderland", lat: 51.9653, lon: 6.2886, population: 58000 },
  { name: "Tiel", province: "gelderland", lat: 51.8881, lon: 5.4319, population: 42000 },
  { name: "Harderwijk", province: "gelderland", lat: 52.3422, lon: 5.6208, population: 48000 },
  { name: "Wageningen", province: "gelderland", lat: 51.9692, lon: 5.6658, population: 39000 },
  { name: "Zutphen", province: "gelderland", lat: 52.1389, lon: 6.2044, population: 48000 },
  { name: "Barneveld", province: "gelderland", lat: 52.1403, lon: 5.5875, population: 59000 },
  { name: "Winterswijk", province: "gelderland", lat: 51.9728, lon: 6.7194, population: 29000 },
  { name: "Elburg", province: "gelderland", lat: 52.4425, lon: 5.8369, population: 23000 },
  { name: "Ermelo", province: "gelderland", lat: 52.3017, lon: 5.6208, population: 27000 },
  { name: "Culemborg", province: "gelderland", lat: 51.9550, lon: 5.2278, population: 29000 },
  { name: "Zevenaar", province: "gelderland", lat: 51.9267, lon: 6.0697, population: 32000 },
  { name: "Nijkerk", province: "gelderland", lat: 52.2208, lon: 5.4875, population: 43000 },

  // ── UTRECHT ──
  { name: "Utrecht", province: "utrecht", lat: 52.0907, lon: 5.1214, population: 361000 },
  { name: "Amersfoort", province: "utrecht", lat: 52.1561, lon: 5.3878, population: 157000 },
  { name: "Veenendaal", province: "utrecht", lat: 52.0275, lon: 5.5583, population: 68000 },
  { name: "Nieuwegein", province: "utrecht", lat: 52.0286, lon: 5.0811, population: 64000 },
  { name: "Zeist", province: "utrecht", lat: 52.0894, lon: 5.2328, population: 65000 },
  { name: "Woerden", province: "utrecht", lat: 52.0853, lon: 4.8842, population: 53000 },
  { name: "IJsselstein", province: "utrecht", lat: 52.0233, lon: 5.0447, population: 34000 },
  { name: "Houten", province: "utrecht", lat: 52.0286, lon: 5.1711, population: 50000 },
  { name: "Soest", province: "utrecht", lat: 52.1742, lon: 5.2917, population: 47000 },
  { name: "Bunschoten", province: "utrecht", lat: 52.2439, lon: 5.3736, population: 21000 },
  { name: "De Bilt", province: "utrecht", lat: 52.1108, lon: 5.1783, population: 43000 },
  { name: "Bilthoven", province: "utrecht", lat: 52.1275, lon: 5.2008, population: 23000 },
  { name: "Baarn", province: "utrecht", lat: 52.2117, lon: 5.2875, population: 25000 },
  { name: "Driebergen", province: "utrecht", lat: 52.0536, lon: 5.2806, population: 18000 },

  // ── NOORD-HOLLAND ──
  { name: "Amsterdam", province: "noord-holland", lat: 52.3676, lon: 4.9041, population: 907000 },
  { name: "Haarlem", province: "noord-holland", lat: 52.3874, lon: 4.6462, population: 162000 },
  { name: "Zaandam", province: "noord-holland", lat: 52.4389, lon: 4.8264, population: 77000 },
  { name: "Hilversum", province: "noord-holland", lat: 52.2292, lon: 5.1764, population: 92000 },
  { name: "Alkmaar", province: "noord-holland", lat: 52.6324, lon: 4.7534, population: 110000 },
  { name: "Hoorn", province: "noord-holland", lat: 52.6425, lon: 5.0594, population: 73000 },
  { name: "Den Helder", province: "noord-holland", lat: 52.9535, lon: 4.7570, population: 56000 },
  { name: "Purmerend", province: "noord-holland", lat: 52.5050, lon: 4.9597, population: 81000 },
  { name: "Heerhugowaard", province: "noord-holland", lat: 52.6650, lon: 4.8350, population: 57000 },
  { name: "Enkhuizen", province: "noord-holland", lat: 52.7033, lon: 5.2944, population: 19000 },
  { name: "Schagen", province: "noord-holland", lat: 52.7883, lon: 4.7986, population: 19000 },
  { name: "Beverwijk", province: "noord-holland", lat: 52.4833, lon: 4.6578, population: 41000 },
  { name: "Castricum", province: "noord-holland", lat: 52.5500, lon: 4.6708, population: 36000 },
  { name: "Heemskerk", province: "noord-holland", lat: 52.5089, lon: 4.6681, population: 39000 },
  { name: "Volendam", province: "noord-holland", lat: 52.4953, lon: 5.0706, population: 22000 },
  { name: "Weesp", province: "noord-holland", lat: 52.3078, lon: 5.0419, population: 19000 },
  { name: "Uitgeest", province: "noord-holland", lat: 52.5278, lon: 4.7089, population: 13000 },
  { name: "Medemblik", province: "noord-holland", lat: 52.7708, lon: 5.1083, population: 9000 },
  { name: "Texel", province: "noord-holland", lat: 53.0606, lon: 4.7994, population: 14000 },

  // ── ZUID-HOLLAND ──
  { name: "Rotterdam", province: "zuid-holland", lat: 51.9244, lon: 4.4777, population: 656000 },
  { name: "Den Haag", province: "zuid-holland", lat: 52.0705, lon: 4.3007, population: 548000 },
  { name: "Leiden", province: "zuid-holland", lat: 52.1583, lon: 4.4931, population: 125000 },
  { name: "Dordrecht", province: "zuid-holland", lat: 51.8133, lon: 4.6736, population: 119000 },
  { name: "Zoetermeer", province: "zuid-holland", lat: 52.0575, lon: 4.4931, population: 127000 },
  { name: "Delft", province: "zuid-holland", lat: 52.0116, lon: 4.3571, population: 104000 },
  { name: "Gouda", province: "zuid-holland", lat: 52.0115, lon: 4.7106, population: 74000 },
  { name: "Alphen aan den Rijn", province: "zuid-holland", lat: 52.1294, lon: 4.6575, population: 112000 },
  { name: "Vlaardingen", province: "zuid-holland", lat: 51.9125, lon: 4.3419, population: 74000 },
  { name: "Schiedam", province: "zuid-holland", lat: 51.9197, lon: 4.3989, population: 79000 },
  { name: "Spijkenisse", province: "zuid-holland", lat: 51.8417, lon: 4.3289, population: 59000 },
  { name: "Katwijk", province: "zuid-holland", lat: 52.1997, lon: 4.4175, population: 66000 },
  { name: "Noordwijk", province: "zuid-holland", lat: 52.2353, lon: 4.4431, population: 43000 },
  { name: "Lisse", province: "zuid-holland", lat: 52.2583, lon: 4.5561, population: 23000 },
  { name: "Sassenheim", province: "zuid-holland", lat: 52.2242, lon: 4.5222, population: 15000 },
  { name: "Gorinchem", province: "zuid-holland", lat: 51.8350, lon: 4.9736, population: 37000 },
  { name: "Ridderkerk", province: "zuid-holland", lat: 51.8667, lon: 4.6008, population: 47000 },
  { name: "Hellevoetsluis", province: "zuid-holland", lat: 51.8333, lon: 4.1333, population: 40000 },

  // ── ZEELAND ──
  { name: "Middelburg", province: "zeeland", lat: 51.4989, lon: 3.6136, population: 49000 },
  { name: "Vlissingen", province: "zeeland", lat: 51.4422, lon: 3.5961, population: 45000 },
  { name: "Goes", province: "zeeland", lat: 51.5044, lon: 3.8894, population: 38000 },
  { name: "Terneuzen", province: "zeeland", lat: 51.3364, lon: 3.8278, population: 25000 },
  { name: "Hulst", province: "zeeland", lat: 51.2792, lon: 4.0528, population: 11000 },
  { name: "Zierikzee", province: "zeeland", lat: 51.6500, lon: 3.9167, population: 12000 },
  { name: "Domburg", province: "zeeland", lat: 51.5639, lon: 3.4992, population: 1500 },
  { name: "Renesse", province: "zeeland", lat: 51.7308, lon: 3.7722, population: 1800 },
  { name: "Breskens", province: "zeeland", lat: 51.3975, lon: 3.5564, population: 4500 },
  { name: "Yerseke", province: "zeeland", lat: 51.4911, lon: 4.0500, population: 7000 },
  { name: "Veere", province: "zeeland", lat: 51.5500, lon: 3.6622, population: 22000 },
  { name: "Cadzand", province: "zeeland", lat: 51.3736, lon: 3.4119, population: 800 },

  // ── NOORD-BRABANT ──
  { name: "Eindhoven", province: "noord-brabant", lat: 51.4416, lon: 5.4697, population: 238000 },
  { name: "Tilburg", province: "noord-brabant", lat: 51.5555, lon: 5.0913, population: 224000 },
  { name: "Breda", province: "noord-brabant", lat: 51.5719, lon: 4.7683, population: 185000 },
  { name: "'s-Hertogenbosch", province: "noord-brabant", lat: 51.6978, lon: 5.3037, population: 157000 },
  { name: "Helmond", province: "noord-brabant", lat: 51.4783, lon: 5.6611, population: 92000 },
  { name: "Oss", province: "noord-brabant", lat: 51.7650, lon: 5.5181, population: 92000 },
  { name: "Roosendaal", province: "noord-brabant", lat: 51.5308, lon: 4.4564, population: 77000 },
  { name: "Bergen op Zoom", province: "noord-brabant", lat: 51.4950, lon: 4.2919, population: 68000 },
  { name: "Waalwijk", province: "noord-brabant", lat: 51.6833, lon: 5.0667, population: 48000 },
  { name: "Veghel", province: "noord-brabant", lat: 51.6167, lon: 5.5500, population: 28000 },
  { name: "Boxtel", province: "noord-brabant", lat: 51.5903, lon: 5.3269, population: 31000 },
  { name: "Valkenswaard", province: "noord-brabant", lat: 51.3503, lon: 5.4608, population: 31000 },
  { name: "Best", province: "noord-brabant", lat: 51.5106, lon: 5.3914, population: 30000 },
  { name: "Uden", province: "noord-brabant", lat: 51.6597, lon: 5.6158, population: 42000 },
  { name: "Dongen", province: "noord-brabant", lat: 51.6264, lon: 4.9389, population: 26000 },

  // ── LIMBURG ──
  { name: "Maastricht", province: "limburg", lat: 50.8514, lon: 5.6910, population: 122000 },
  { name: "Venlo", province: "limburg", lat: 51.3700, lon: 6.1681, population: 102000 },
  { name: "Heerlen", province: "limburg", lat: 50.8882, lon: 5.9815, population: 87000 },
  { name: "Sittard", province: "limburg", lat: 51.0000, lon: 5.8681, population: 48000 },
  { name: "Roermond", province: "limburg", lat: 51.1942, lon: 5.9861, population: 58000 },
  { name: "Weert", province: "limburg", lat: 51.2517, lon: 5.7069, population: 50000 },
  { name: "Kerkrade", province: "limburg", lat: 50.8656, lon: 6.0653, population: 46000 },
  { name: "Geleen", province: "limburg", lat: 50.9739, lon: 5.8306, population: 33000 },
  { name: "Brunssum", province: "limburg", lat: 50.9458, lon: 5.9708, population: 28000 },
  { name: "Valkenburg", province: "limburg", lat: 50.8653, lon: 5.8317, population: 17000 },
  { name: "Vaals", province: "limburg", lat: 50.7700, lon: 6.0183, population: 10000 },
  { name: "Gulpen", province: "limburg", lat: 50.8167, lon: 5.8875, population: 7500 },
  { name: "Thorn", province: "limburg", lat: 51.1597, lon: 5.8358, population: 2800 },
  { name: "Meerssen", province: "limburg", lat: 50.8886, lon: 5.7500, population: 19000 },
];

// ============================================================
// Helper functies
// ============================================================

/** Totaal aantal plaatsen in de database */
export const PLACES_COUNT = ALL_PLACES.length;

/** Alle provincies met hun plaatsen */
export function placesByProvince(): Record<string, Place[]> {
  const result: Record<string, Place[]> = {};
  for (const place of ALL_PLACES) {
    if (!result[place.province]) result[place.province] = [];
    result[place.province].push(place);
  }
  return result;
}

/** Zoek een plaats op slug */
export function findPlace(provinceSlug: string, placeSlug: string): Place | undefined {
  return ALL_PLACES.find(
    (p) =>
      p.province === provinceSlug &&
      p.name.toLowerCase().replace(/['\s]+/g, "-") === placeSlug
  );
}

/** Maak een URL-slug van een plaatsnaam */
export function placeSlug(name: string): string {
  return name.toLowerCase().replace(/['\s]+/g, "-");
}

/** Vind de 5 dichtstbijzijnde plaatsen */
export function nearbyPlaces(place: Place, count = 5): Place[] {
  return ALL_PLACES
    .filter((p) => p.name !== place.name)
    .map((p) => ({
      ...p,
      dist: Math.sqrt(Math.pow(p.lat - place.lat, 2) + Math.pow(p.lon - place.lon, 2)),
    }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, count);
}
