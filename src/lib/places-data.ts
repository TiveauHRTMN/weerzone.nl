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
  character?: "coastal" | "inland" | "highland" | "urban"; // Voor slimme AI-commentaar en affiliates
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
  { name: "Groningen", province: "groningen", lat: 53.2194, lon: 6.5665, population: 233000, character: "urban" },
  { name: "Delfzijl", province: "groningen", lat: 53.3333, lon: 6.9167, population: 25000, character: "coastal" },
  { name: "Appingedam", province: "groningen", lat: 53.3211, lon: 6.8553, population: 12000 },
  { name: "Hoogezand", province: "groningen", lat: 53.1614, lon: 6.7594, population: 34000 },
  { name: "Sappemeer", province: "groningen", lat: 53.1614, lon: 6.7894, population: 20000 },
  { name: "Leek", province: "groningen", lat: 53.1625, lon: 6.3750, population: 19000 },
  { name: "Stadskanaal", province: "groningen", lat: 52.9906, lon: 6.9506, population: 33000 },
  { name: "Veendam", province: "groningen", lat: 53.1069, lon: 6.8792, population: 28000 },
  { name: "Winschoten", province: "groningen", lat: 53.1442, lon: 7.0347, population: 18000 },
  { name: "Ter Apel", province: "groningen", lat: 52.8756, lon: 7.0642, population: 10000 },
  { name: "Haren", province: "groningen", lat: 53.1717, lon: 6.6100, population: 19000 },
  { name: "Zuidhorn", province: "groningen", lat: 53.2469, lon: 6.3997, population: 8000 },
  { name: "Bedum", province: "groningen", lat: 53.3000, lon: 6.6028, population: 10500 },
  { name: "Loppersum", province: "groningen", lat: 53.3319, lon: 6.7486, population: 3200 },
  { name: "Uithuizen", province: "groningen", lat: 53.4089, lon: 6.6753, population: 4600, character: "coastal" },
  { name: "Warffum", province: "groningen", lat: 53.3928, lon: 6.5619, population: 2100, character: "coastal" },
  { name: "Winsum", province: "groningen", lat: 53.3300, lon: 6.5167, population: 7500 },
  { name: "Bellingwolde", province: "groningen", lat: 53.1167, lon: 7.1667, population: 2500 },
  { name: "Siddeburen", province: "groningen", lat: 53.2458, lon: 6.8667, population: 3000 },
  { name: "Musselkanaal", province: "groningen", lat: 52.9333, lon: 7.0167, population: 7000 },


  // ── FRIESLAND ──
  { name: "Leeuwarden", province: "friesland", lat: 53.2012, lon: 5.7999, population: 124000, character: "urban" },
  { name: "Drachten", province: "friesland", lat: 53.1033, lon: 6.1003, population: 45000 },
  { name: "Heerenveen", province: "friesland", lat: 52.9581, lon: 5.9253, population: 50000 },
  { name: "Sneek", province: "friesland", lat: 53.0333, lon: 5.6614, population: 34000 },
  { name: "Harlingen", province: "friesland", lat: 53.1744, lon: 5.4236, population: 16000, character: "coastal" },
  { name: "Franeker", province: "friesland", lat: 53.1867, lon: 5.5408, population: 13000 },
  { name: "Dokkum", province: "friesland", lat: 53.3264, lon: 5.9972, population: 13000 },
  { name: "Bolsward", province: "friesland", lat: 53.0614, lon: 5.5267, population: 10000 },
  { name: "Joure", province: "friesland", lat: 52.9669, lon: 5.7944, population: 13000 },
  { name: "Wolvega", province: "friesland", lat: 52.8808, lon: 5.9942, population: 13000 },
  { name: "Lemmer", province: "friesland", lat: 52.8450, lon: 5.7103, population: 10000, character: "coastal" },
  { name: "Bakkeveen", province: "friesland", lat: 53.0711, lon: 6.2617, population: 1800 },
  { name: "Grou", province: "friesland", lat: 53.0922, lon: 5.8308, population: 5500 },
  { name: "Workum", province: "friesland", lat: 52.9808, lon: 5.4436, population: 4500, character: "coastal" },
  { name: "Kollum", province: "friesland", lat: 53.2878, lon: 6.1544, population: 3500 },
  { name: "Sint Annaparochie", province: "friesland", lat: 53.2778, lon: 5.6583, population: 4800 },
  { name: "Bergum", province: "friesland", lat: 53.1917, lon: 6.0000, population: 10000 },
  { name: "Makkum", province: "friesland", lat: 53.0556, lon: 5.4028, population: 3500, character: "coastal" },
  { name: "Stavoren", province: "friesland", lat: 52.8833, lon: 5.3583, population: 1000, character: "coastal" },
  { name: "Hindeloopen", province: "friesland", lat: 52.9431, lon: 5.4025, population: 900, character: "coastal" },

  // ── DRENTHE ──
  { name: "Assen", province: "drenthe", lat: 52.9928, lon: 6.5642, population: 68000, character: "urban" },
  { name: "Emmen", province: "drenthe", lat: 52.7858, lon: 6.8975, population: 107000, character: "urban" },
  { name: "Hoogeveen", province: "drenthe", lat: 52.7208, lon: 6.4758, population: 55000 },
  { name: "Meppel", province: "drenthe", lat: 52.6947, lon: 6.1953, population: 34000 },
  { name: "Coevorden", province: "drenthe", lat: 52.6617, lon: 6.7417, population: 35000 },
  { name: "Beilen", province: "drenthe", lat: 52.8600, lon: 6.5125, population: 11000 },
  { name: "Westerbork", province: "drenthe", lat: 52.8508, lon: 6.6111, population: 4700 },
  { name: "Gieten", province: "drenthe", lat: 53.0036, lon: 6.7661, population: 5500 },
  { name: "Roden", province: "drenthe", lat: 53.1367, lon: 6.4250, population: 15000 },
  { name: "Eelde", province: "drenthe", lat: 53.1417, lon: 6.5833, population: 7000 },
  { name: "Paterswolde", province: "drenthe", lat: 53.1556, lon: 6.5694, population: 4000 },
  { name: "Zuidlaren", province: "drenthe", lat: 53.0917, lon: 6.6833, population: 10000 },
  { name: "Borger", province: "drenthe", lat: 52.9236, lon: 6.7917, population: 5000, character: "highland" },
  { name: "Diever", province: "drenthe", lat: 52.8550, lon: 6.3167, population: 2500 },
  { name: "Dwingeloo", province: "drenthe", lat: 52.8333, lon: 6.3667, population: 4000 },

  // ── OVERIJSSEL ──

  // ── NOORD-HOLLAND ──
  { name: "Amsterdam", province: "noord-holland", lat: 52.3676, lon: 4.9041, population: 907000, character: "urban" },
  { name: "Haarlem", province: "noord-holland", lat: 52.3874, lon: 4.6462, population: 162000, character: "urban" },
  { name: "Zaandam", province: "noord-holland", lat: 52.4389, lon: 4.8264, population: 77000, character: "urban" },
  { name: "Hilversum", province: "noord-holland", lat: 52.2292, lon: 5.1764, population: 92000, character: "urban" },
  { name: "Alkmaar", province: "noord-holland", lat: 52.6324, lon: 4.7534, population: 110000, character: "urban" },
  { name: "Hoorn", province: "noord-holland", lat: 52.6425, lon: 5.0594, population: 73000, character: "coastal" },
  { name: "Den Helder", province: "noord-holland", lat: 52.9535, lon: 4.7570, population: 56000, character: "coastal" },
  { name: "Purmerend", province: "noord-holland", lat: 52.5050, lon: 4.9597, population: 81000, character: "urban" },
  { name: "Heerhugowaard", province: "noord-holland", lat: 52.6650, lon: 4.8350, population: 57000 },
  { name: "Enkhuizen", province: "noord-holland", lat: 52.7033, lon: 5.2944, population: 19000, character: "coastal" },
  { name: "Schagen", province: "noord-holland", lat: 52.7883, lon: 4.7986, population: 19000 },
  { name: "Beverwijk", province: "noord-holland", lat: 52.4833, lon: 4.6578, population: 41000 },
  { name: "Castricum", province: "noord-holland", lat: 52.5500, lon: 4.6708, population: 36000, character: "coastal" },
  { name: "Heemskerk", province: "noord-holland", lat: 52.5089, lon: 4.6681, population: 39000 },
  { name: "Volendam", province: "noord-holland", lat: 52.4953, lon: 5.0706, population: 22000, character: "coastal" },
  { name: "Weesp", province: "noord-holland", lat: 52.3078, lon: 5.0419, population: 19000 },
  { name: "Uitgeest", province: "noord-holland", lat: 52.5278, lon: 4.7089, population: 13000 },
  { name: "Medemblik", province: "noord-holland", lat: 52.7708, lon: 5.1083, population: 9000, character: "coastal" },
  { name: "Texel", province: "noord-holland", lat: 53.0606, lon: 4.7994, population: 14000, character: "coastal" },
  { name: "Amstelveen", province: "noord-holland", lat: 52.3031, lon: 4.8569, population: 92000, character: "urban" },
  { name: "Hoofddorp", province: "noord-holland", lat: 52.3031, lon: 4.6917, population: 77000, character: "urban" },
  { name: "Nieuw-Vennep", province: "noord-holland", lat: 52.2619, lon: 4.6292, population: 31000 },
  { name: "Aalsmeer", province: "noord-holland", lat: 52.2644, lon: 4.7519, population: 32000 },
  { name: "Uithoorn", province: "noord-holland", lat: 52.2431, lon: 4.8267, population: 30000 },
  { name: "Krommenie", province: "noord-holland", lat: 52.4994, lon: 4.7619, population: 17000 },
  { name: "Assendelft", province: "noord-holland", lat: 52.4764, lon: 4.7500, population: 24000 },
  { name: "Wormerveer", province: "noord-holland", lat: 52.4914, lon: 4.8000, population: 11000 },
  { name: "Koog aan de Zaan", province: "noord-holland", lat: 52.4597, lon: 4.8111, population: 11000 },
  { name: "Zaandijk", province: "noord-holland", lat: 52.4736, lon: 4.8111, population: 9000 },
  { name: "Wormer", province: "noord-holland", lat: 52.5000, lon: 4.8167, population: 13000 },
  { name: "Oostzaan", province: "noord-holland", lat: 52.4417, lon: 4.8725, population: 10000 },
  { name: "Monnickendam", province: "noord-holland", lat: 52.4583, lon: 5.0333, population: 10000 },
  { name: "Edam", province: "noord-holland", lat: 52.5125, lon: 5.0500, population: 7000 },
  { name: "Brock in Waterland", province: "noord-holland", lat: 52.4333, lon: 5.0000, population: 2500 },
  { name: "Marken", province: "noord-holland", lat: 52.4583, lon: 5.1000, population: 1800 },
  { name: "Huizen", province: "noord-holland", lat: 52.3000, lon: 5.2333, population: 41000 },
  { name: "Bussum", province: "noord-holland", lat: 52.2736, lon: 5.1611, population: 33000 },
  { name: "Naarden", province: "noord-holland", lat: 52.2958, lon: 5.1611, population: 17000 },
  { name: "Laren", province: "noord-holland", lat: 52.2583, lon: 5.2250, population: 11000 },
  { name: "Blaricum", province: "noord-holland", lat: 52.2725, lon: 5.2500, population: 12000 },
  { name: "Eemnes", province: "noord-holland", lat: 52.2542, lon: 5.2561, population: 9000 },

  // ── ZUID-HOLLAND ──
  { name: "Rotterdam", province: "zuid-holland", lat: 51.9244, lon: 4.4777, population: 656000, character: "urban" },
  { name: "Den Haag", province: "zuid-holland", lat: 52.0705, lon: 4.3007, population: 548000, character: "urban" },
  { name: "Leiden", province: "zuid-holland", lat: 52.1583, lon: 4.4931, population: 125000, character: "urban" },
  { name: "Dordrecht", province: "zuid-holland", lat: 51.8133, lon: 4.6736, population: 119000, character: "urban" },
  { name: "Zoetermeer", province: "zuid-holland", lat: 52.0575, lon: 4.4931, population: 127000, character: "urban" },
  { name: "Delft", province: "zuid-holland", lat: 52.0116, lon: 4.3571, population: 104000, character: "urban" },
  { name: "Gouda", province: "zuid-holland", lat: 52.0115, lon: 4.7106, population: 74000, character: "urban" },
  { name: "Alphen aan den Rijn", province: "zuid-holland", lat: 52.1294, lon: 4.6575, population: 112000, character: "urban" },
  { name: "Vlaardingen", province: "zuid-holland", lat: 51.9125, lon: 4.3419, population: 74000, character: "urban" },
  { name: "Schiedam", province: "zuid-holland", lat: 51.9197, lon: 4.3989, population: 79000, character: "urban" },
  { name: "Spijkenisse", province: "zuid-holland", lat: 51.8417, lon: 4.3289, population: 59000 },
  { name: "Katwijk", province: "zuid-holland", lat: 52.1997, lon: 4.4175, population: 66000, character: "coastal" },
  { name: "Noordwijk", province: "zuid-holland", lat: 52.2353, lon: 4.4431, population: 43000, character: "coastal" },
  { name: "Lisse", province: "zuid-holland", lat: 52.2583, lon: 4.5561, population: 23000 },
  { name: "Sassenheim", province: "zuid-holland", lat: 52.2242, lon: 4.5222, population: 15000 },
  { name: "Gorinchem", province: "zuid-holland", lat: 51.8350, lon: 4.9736, population: 37000 },
  { name: "Ridderkerk", province: "zuid-holland", lat: 51.8667, lon: 4.6008, population: 47000 },
  { name: "Hellevoetsluis", province: "zuid-holland", lat: 51.8333, lon: 4.1333, population: 40000, character: "coastal" },
  { name: "Barendrecht", province: "zuid-holland", lat: 51.8592, lon: 4.5367, population: 49000 },
  { name: "Zwijndrecht", province: "zuid-holland", lat: 51.8153, lon: 4.6300, population: 45000 },
  { name: "Papendrecht", province: "zuid-holland", lat: 51.8339, lon: 4.6853, population: 32000 },
  { name: "Hendrik-Ido-Ambacht", province: "zuid-holland", lat: 51.8447, lon: 4.6436, population: 31000 },
  { name: "Sliedrecht", province: "zuid-holland", lat: 51.8222, lon: 4.7761, population: 25000 },
  { name: "Pijnacker", province: "zuid-holland", lat: 52.0167, lon: 4.4333, population: 25000 },
  { name: "Nootdorp", province: "zuid-holland", lat: 52.0436, lon: 4.3944, population: 19000 },
  { name: "Leidschendam", province: "zuid-holland", lat: 52.0833, lon: 4.4000, population: 35000 },
  { name: "Voorburg", province: "zuid-holland", lat: 52.0736, lon: 4.3556, population: 40000 },
  { name: "Wassenaar", province: "zuid-holland", lat: 52.1458, lon: 4.4008, population: 26000, character: "coastal" },
  { name: "Voorschoten", province: "zuid-holland", lat: 52.1278, lon: 4.4481, population: 25000 },
  { name: "Waddinxveen", province: "zuid-holland", lat: 52.0442, lon: 4.6508, population: 30000 },
  { name: "Bodegraven", province: "zuid-holland", lat: 52.0833, lon: 4.7500, population: 19500 },
  { name: "Reeuwijk", province: "zuid-holland", lat: 52.0475, lon: 4.7214, population: 13000 },
  { name: "Boskoop", province: "zuid-holland", lat: 52.0733, lon: 4.6617, population: 15500 },
  { name: "Leiderdorp", province: "zuid-holland", lat: 52.1389, lon: 4.5300, population: 27000 },
  { name: "Oegstgeest", province: "zuid-holland", lat: 52.1817, lon: 4.4758, population: 25000 },
  { name: "Warmond", province: "zuid-holland", lat: 52.1964, lon: 4.5167, population: 5000 },
  { name: "Voorhout", province: "zuid-holland", lat: 52.2217, lon: 4.4858, population: 16000 },
  { name: "Noordwijkerhout", province: "zuid-holland", lat: 52.2611, lon: 4.4944, population: 16500 },
  { name: "De Zilk", province: "zuid-holland", lat: 52.2958, lon: 4.5194, population: 2300 },
  { name: "Hillegom", province: "zuid-holland", lat: 52.2908, lon: 4.5786, population: 22000 },
  { name: "Leimuiden", province: "zuid-holland", lat: 52.2300, lon: 4.6683, population: 4500 },
  { name: "Roelofarendsveen", province: "zuid-holland", lat: 52.2033, lon: 4.6292, population: 9000 },
  { name: "Nieuwkoop", province: "zuid-holland", lat: 52.1511, lon: 4.7783, population: 15500 },
  { name: "Ter Aar", province: "zuid-holland", lat: 52.1764, lon: 4.7083, population: 9500 },
  { name: "Berkel en Rodenrijs", province: "zuid-holland", lat: 51.9922, lon: 4.4789, population: 31000 },
  { name: "Bergschenhoek", province: "zuid-holland", lat: 51.9833, lon: 4.5000, population: 18500 },
  { name: "Bleiswijk", province: "zuid-holland", lat: 52.0100, lon: 4.5333, population: 11000 },
  { name: "Capelle aan den IJssel", province: "zuid-holland", lat: 51.9300, lon: 4.5800, population: 67000, character: "urban" },
  { name: "Krimpen aan den IJssel", province: "zuid-holland", lat: 51.9167, lon: 4.6000, population: 29000 },
  { name: "Oud-Beijerland", province: "zuid-holland", lat: 51.8236, lon: 4.4147, population: 24500 },
  { name: "Numansdorp", province: "zuid-holland", lat: 51.7333, lon: 4.4333, population: 9000, character: "coastal" },
  { name: "Strijen", province: "zuid-holland", lat: 51.7483, lon: 4.5525, population: 9000 },
  { name: "Maassluis", province: "zuid-holland", lat: 51.9214, lon: 4.2544, population: 33000, character: "coastal" },
  { name: "Monster", province: "zuid-holland", lat: 52.0253, lon: 4.1750, population: 14000, character: "coastal" },
  { name: "Naaldwijk", province: "zuid-holland", lat: 51.9933, lon: 4.2106, population: 20000 },
  { name: "'s-Gravenzande", province: "zuid-holland", lat: 51.9961, lon: 4.1500, population: 21000, character: "coastal" },
  { name: "Poeldijk", province: "zuid-holland", lat: 52.0222, lon: 4.2194, population: 7000 },
  { name: "Maasland", province: "zuid-holland", lat: 51.9333, lon: 4.2667, population: 6500 },
  { name: "Den Hoorn", province: "zuid-holland", lat: 52.0000, lon: 4.3333, population: 8000 },
  { name: "Kwintsheul", province: "zuid-holland", lat: 52.0100, lon: 4.2500, population: 4000 },
  { name: "Hof van Delfland", province: "zuid-holland", lat: 51.9833, lon: 4.3667, population: 10000 },
  { name: "Oudewater", province: "zuid-holland", lat: 52.0236, lon: 4.8692, population: 10000 },
  { name: "Schoonhoven", province: "zuid-holland", lat: 51.9472, lon: 4.8500, population: 13000 },
  { name: "Bergambacht", province: "zuid-holland", lat: 51.9333, lon: 4.7833, population: 10000 },
  { name: "Lekkerkerk", province: "zuid-holland", lat: 51.8967, lon: 4.6833, population: 8000 },
  { name: "Krimpen aan de Lek", province: "zuid-holland", lat: 51.8950, lon: 4.6292, population: 6500 },
  { name: "Leerdam", province: "zuid-holland", lat: 51.8931, lon: 5.0911, population: 21000 },

  
  // ── NOORD-BRABANT ──
  { name: "Deurne", province: "noord-brabant", lat: 51.4633, lon: 5.7950, population: 32000 },
  { name: "Oisterwijk", province: "noord-brabant", lat: 51.5817, lon: 5.1958, population: 26000 },
  { name: "Boxtel", province: "noord-brabant", lat: 51.5903, lon: 5.3269, population: 31000 },
  { name: "Schijndel", province: "noord-brabant", lat: 51.6167, lon: 5.4333, population: 23000 },
  { name: "Sint-Oedenrode", province: "noord-brabant", lat: 51.5633, lon: 5.4617, population: 18000 },
  { name: "Best", province: "noord-brabant", lat: 51.5117, lon: 5.3917, population: 30000 },
  { name: "Geldrop", province: "noord-brabant", lat: 51.4233, lon: 5.5567, population: 28000 },
  { name: "Mierlo", province: "noord-brabant", lat: 51.4422, lon: 5.6133, population: 10000 },
  { name: "Dongen", province: "noord-brabant", lat: 51.6258, lon: 4.9333, population: 26000 },
  { name: "Loon op Zand", province: "noord-brabant", lat: 51.6267, lon: 5.0750, population: 23000 },
  { name: "Kaatsheuvel", province: "noord-brabant", lat: 51.6508, lon: 5.0394, population: 16000 },
  { name: "Gilze", province: "noord-brabant", lat: 51.5433, lon: 4.9417, population: 8000 },
  { name: "Rijen", province: "noord-brabant", lat: 51.5883, lon: 4.9214, population: 16000 },
  { name: "Goirle", province: "noord-brabant", lat: 51.5203, lon: 5.0667, population: 24000 },
  { name: "Hilvarenbeek", province: "noord-brabant", lat: 51.4858, lon: 5.1367, population: 15500 },
  { name: "Eersel", province: "noord-brabant", lat: 51.3583, lon: 5.3167, population: 19000 },
  { name: "Bladel", province: "noord-brabant", lat: 51.3625, lon: 5.2150, population: 20000 },
  { name: "Reusel", province: "noord-brabant", lat: 51.3625, lon: 5.1633, population: 8000 },
  { name: "Bergeijk", province: "noord-brabant", lat: 51.3200, lon: 5.3583, population: 18500 },
  { name: "Budel", province: "noord-brabant", lat: 51.2742, lon: 5.5750, population: 9000 },
  { name: "Cranendonck", province: "noord-brabant", lat: 51.2833, lon: 5.5833, population: 21000 },
  { name: "Someren", province: "noord-brabant", lat: 51.3853, lon: 5.7125, population: 19000 },
  { name: "Asten", province: "noord-brabant", lat: 51.4033, lon: 5.7461, population: 16700 },
  { name: "Gemert", province: "noord-brabant", lat: 51.5542, lon: 5.6883, population: 16000 },
  { name: "Bakel", province: "noord-brabant", lat: 51.5033, lon: 5.7417, population: 5000 },
  { name: "Laarbeek", province: "noord-brabant", lat: 51.5167, lon: 5.6167, population: 22000 },
  { name: "Beek en Donk", province: "noord-brabant", lat: 51.5333, lon: 5.6333, population: 10000 },
  { name: "Son en Breugel", province: "noord-brabant", lat: 51.5125, lon: 5.4833, population: 17500 },

  // ── GELDERLAND ──
  { name: "Apeldoorn", province: "gelderland", lat: 52.2112, lon: 5.9699, population: 165000, character: "urban" },
  { name: "Arnhem", province: "gelderland", lat: 51.9851, lon: 5.8987, population: 164000, character: "urban" },
  { name: "Nijmegen", province: "gelderland", lat: 51.8126, lon: 5.8372, population: 179000, character: "urban" },
  { name: "Ede", province: "gelderland", lat: 52.0442, lon: 5.6708, population: 119000, character: "urban" },
  { name: "Doetinchem", province: "gelderland", lat: 51.9650, lon: 6.2894, population: 58000 },
  { name: "Barneveld", province: "gelderland", lat: 52.1333, lon: 5.5833, population: 60000 },
  { name: "Zutphen", province: "gelderland", lat: 52.1417, lon: 6.1950, population: 48000 },
  { name: "Harderwijk", province: "gelderland", lat: 52.3508, lon: 5.6200, population: 48000, character: "coastal" },
  { name: "Tiel", province: "gelderland", lat: 51.8833, lon: 5.4333, population: 42000 },
  { name: "Wageningen", province: "gelderland", lat: 51.9650, lon: 5.6644, population: 39500 },
  { name: "Wijchen", province: "gelderland", lat: 51.8106, lon: 5.7236, population: 41000 },
  { name: "Culemborg", province: "gelderland", lat: 51.9542, lon: 5.2269, population: 29000 },
  { name: "Zaltbommel", province: "gelderland", lat: 51.8100, lon: 5.2500, population: 13000 },
  { name: "Nijkerk", province: "gelderland", lat: 52.2217, lon: 5.4850, population: 44000 },
  { name: "Ermelo", province: "gelderland", lat: 52.3000, lon: 5.6167, population: 27000 },
  { name: "Putten", province: "gelderland", lat: 52.2583, lon: 5.6067, population: 24500 },
  { name: "Oldebroek", province: "gelderland", lat: 52.4475, lon: 5.9225, population: 23800 },
  { name: "Elburg", province: "gelderland", lat: 52.4475, lon: 5.8333, population: 12500, character: "coastal" },
  { name: "Nunspeet", province: "gelderland", lat: 52.3783, lon: 5.7917, population: 28000 },
  { name: "Heerde", province: "gelderland", lat: 52.3883, lon: 6.0417, population: 19000 },
  { name: "Epe", province: "gelderland", lat: 52.3475, lon: 5.9858, population: 15500 },
  { name: "Vaassen", province: "gelderland", lat: 52.2883, lon: 5.9667, population: 12700 },
  { name: "Lochem", province: "gelderland", lat: 52.1583, lon: 6.4117, population: 13000 },
  { name: "Borculo", province: "gelderland", lat: 52.1150, lon: 6.5183, population: 10000 },
  { name: "Groenlo", province: "gelderland", lat: 52.0433, lon: 6.6167, population: 10000 },
  { name: "Lichtenvoorde", province: "gelderland", lat: 51.9867, lon: 6.5667, population: 13000 },
  { name: "Winterswijk", province: "gelderland", lat: 51.9708, lon: 6.7194, population: 29000 },
  { name: "Aalten", province: "gelderland", lat: 51.9258, lon: 6.5817, population: 27000 },
  { name: "Varsseveld", province: "gelderland", lat: 51.9442, lon: 6.4625, population: 6000 },
  { name: "Zevenaar", province: "gelderland", lat: 51.9267, lon: 6.0792, population: 44000 },
  { name: "Duiven", province: "gelderland", lat: 51.9467, lon: 6.0211, population: 25000 },
  { name: "Westervoort", province: "gelderland", lat: 51.9567, lon: 5.9722, population: 15000 },
  { name: "Huissen", province: "gelderland", lat: 51.9367, lon: 5.9417, population: 19000 },
  { name: "Bemmel", province: "gelderland", lat: 51.8903, lon: 5.8950, population: 13000 },
  { name: "Elst", province: "gelderland", lat: 51.9189, lon: 5.8458, population: 22000 },
  { name: "Oosterbeek", province: "gelderland", lat: 51.9858, lon: 5.8483, population: 11000 },
  { name: "Renkum", province: "gelderland", lat: 51.9767, lon: 5.7333, population: 31000 },
  { name: "Doorwerth", province: "gelderland", lat: 51.9783, lon: 5.7950, population: 5000 },
  { name: "Heelsum", province: "gelderland", lat: 51.9817, lon: 5.7617, population: 3500 },
  { name: "Wolfheze", province: "gelderland", lat: 52.0000, lon: 5.7933, population: 2000 },
  { name: "Velp", province: "gelderland", lat: 51.9967, lon: 5.9792, population: 18000 },
  { name: "Rheden", province: "gelderland", lat: 52.0000, lon: 6.0333, population: 44000 },
  { name: "Dieren", province: "gelderland", lat: 52.0433, lon: 6.1025, population: 14000 },
  { name: "Eerbeek", province: "gelderland", lat: 52.1000, lon: 6.0500, population: 10000 },

  // ── ZEELAND (Deep) ──
  { name: "Middelburg", province: "zeeland", lat: 51.4988, lon: 3.6114, population: 49000, character: "coastal" },
  { name: "Vlissingen", province: "zeeland", lat: 51.4425, lon: 3.5739, population: 44000, character: "coastal" },
  { name: "Goes", province: "zeeland", lat: 51.5033, lon: 3.8894, population: 38000, character: "coastal" },
  { name: "Terneuzen", province: "zeeland", lat: 51.3217, lon: 3.8322, population: 54000, character: "coastal" },
  { name: "Renesse", province: "zeeland", lat: 51.7333, lon: 3.7667, population: 1500, character: "coastal" },
  { name: "Burgh-Haamstede", province: "zeeland", lat: 51.6833, lon: 3.7167, population: 4500, character: "coastal" },
  { name: "Zierikzee", province: "zeeland", lat: 51.6500, lon: 3.9167, population: 11000, character: "coastal" },
  { name: "Kamperland", province: "zeeland", lat: 51.5714, lon: 3.7000, population: 2000, character: "coastal" },
  { name: "Domburg", province: "zeeland", lat: 51.5633, lon: 3.4967, population: 1600, character: "coastal" },
  { name: "Oostkapelle", province: "zeeland", lat: 51.5667, lon: 3.5500, population: 2500, character: "coastal" },
  { name: "Westkapelle", province: "zeeland", lat: 51.5333, lon: 3.4417, population: 2700, character: "coastal" },
  { name: "Zoutelande", province: "zeeland", lat: 51.5000, lon: 3.4833, population: 1600, character: "coastal" },
  { name: "Breskens", province: "zeeland", lat: 51.3967, lon: 3.5567, population: 4700, character: "coastal" },
  { name: "CadZand", province: "zeeland", lat: 51.3725, lon: 3.3917, population: 800, character: "coastal" },
  { name: "Hulst", province: "zeeland", lat: 51.2808, lon: 4.0533, population: 11000 },
  { name: "Sluis", province: "zeeland", lat: 51.3067, lon: 3.3858, population: 2400 },
  { name: "Aardenburg", province: "zeeland", lat: 51.2742, lon: 3.4458, population: 2400 },
  { name: "Oostburg", province: "zeeland", lat: 51.3267, lon: 3.4892, population: 5000 },
  { name: "Arnemuiden", province: "zeeland", lat: 51.5000, lon: 3.6750, population: 5400 },
  { name: "Veere", province: "zeeland", lat: 51.5483, lon: 3.6667, population: 1600, character: "coastal" },
  { name: "Kortgene", province: "zeeland", lat: 51.5583, lon: 3.8017, population: 1800, character: "coastal" },
  { name: "Bruinisse", province: "zeeland", lat: 51.6625, lon: 4.0958, population: 4000, character: "coastal" },
  { name: "Yerseke", province: "zeeland", lat: 51.4917, lon: 4.0500, population: 7000, character: "coastal" },
  { name: "Tholen", province: "zeeland", lat: 51.5333, lon: 4.1000, population: 8000, character: "coastal" },

  // ── NOORD-BRABANT (More) ──
  { name: "Zundert", province: "noord-brabant", lat: 51.4692, lon: 4.6617, population: 22000 },
  { name: "Etten-Leur", province: "noord-brabant", lat: 51.5708, lon: 4.6358, population: 44000, character: "urban" },
  { name: "Rucphen", province: "noord-brabant", lat: 51.5317, lon: 4.5600, population: 23000 },
  { name: "Halderberge", province: "noord-brabant", lat: 51.5833, lon: 4.5167, population: 30000 },
  { name: "Hoeven", province: "noord-brabant", lat: 51.5817, lon: 4.5800, population: 6600 },
  { name: "Oudenbosch", province: "noord-brabant", lat: 51.5892, lon: 4.5317, population: 13000 },
  { name: "Zevenbergen", province: "noord-brabant", lat: 51.6458, lon: 4.6111, population: 15000 },
  { name: "Klundert", province: "noord-brabant", lat: 51.6633, lon: 4.5317, population: 6000 },
  { name: "Willemstad", province: "noord-brabant", lat: 51.6917, lon: 4.4375, population: 3100, character: "coastal" },
  { name: "Geertruidenberg", province: "noord-brabant", lat: 51.7011, lon: 4.8608, population: 21500 },
  { name: "Raamsdonksveer", province: "noord-brabant", lat: 51.6967, lon: 4.8733, population: 12500 },
  { name: "Made", province: "noord-brabant", lat: 51.6750, lon: 4.7917, population: 12000 },
  { name: "Terheijden", province: "noord-brabant", lat: 51.6433, lon: 4.7558, population: 6400 },
  { name: "Lage Zwaluwe", province: "noord-brabant", lat: 51.7050, lon: 4.6933, population: 4000, character: "coastal" },
  { name: "Heusden", province: "noord-brabant", lat: 51.7333, lon: 5.1417, population: 45000 },
  { name: "Wijk en Aalburg", province: "noord-brabant", lat: 51.7517, lon: 5.1292, population: 6500 },
  { name: "Vlijmen", province: "noord-brabant", lat: 51.6933, lon: 5.2183, population: 14000 },
  { name: "Drunen", province: "noord-brabant", lat: 51.6853, lon: 5.1311, population: 18000 },
  { name: "Waalwijk", province: "noord-brabant", lat: 51.6833, lon: 5.0667, population: 49000, character: "urban" },
  { name: "Cuijk", province: "noord-brabant", lat: 51.7283, lon: 5.8792, population: 25000 },
  { name: "Grave", province: "noord-brabant", lat: 51.7594, lon: 5.7389, population: 12500 },
  { name: "Boxmeer", province: "noord-brabant", lat: 51.6442, lon: 5.9458, population: 30000 },
  { name: "Mill", province: "noord-brabant", lat: 51.6858, lon: 5.7792, population: 6300 },
  { name: "Sint Hubert", province: "noord-brabant", lat: 51.6750, lon: 5.8058, population: 1600 },
  { name: "Wanroij", province: "noord-brabant", lat: 51.6508, lon: 5.8233, population: 3000 },

  // ── OVERIJSSEL (More) ──
  { name: "Raalte", province: "overijssel", lat: 52.3872, lon: 6.2756, population: 38000 },
  { name: "Heino", province: "overijssel", lat: 52.4350, lon: 6.2597, population: 7000 },
  { name: "Lemelerveld", province: "overijssel", lat: 52.4433, lon: 6.3458, population: 4700 },
  { name: "Dalfsen", province: "overijssel", lat: 52.5033, lon: 6.2583, population: 29000 },
  { name: "Nieuwleusen", province: "overijssel", lat: 52.5858, lon: 6.2858, population: 9000 },
  { name: "Hardenberg", province: "overijssel", lat: 52.5750, lon: 6.6167, population: 61000, character: "urban" },
  { name: "Dedemsvaart", province: "overijssel", lat: 52.6000, lon: 6.4583, population: 12700 },
  { name: "Balkbrug", province: "overijssel", lat: 52.5967, lon: 6.3867, population: 4000 },
  { name: "Bergentheim", province: "overijssel", lat: 52.5250, lon: 6.6167, population: 3500 },
  { name: "Slagharen", province: "overijssel", lat: 52.6367, lon: 6.5500, population: 3100 },
  { name: "Ommen", province: "overijssel", lat: 52.5264, lon: 6.4247, population: 18000 },
  { name: "Nijverdal", province: "overijssel", lat: 52.3583, lon: 6.4639, population: 25000 },
  { name: "Hellendoorn", province: "overijssel", lat: 52.3892, lon: 6.4508, population: 4100 },
  { name: "Wierden", province: "overijssel", lat: 52.3508, lon: 6.5917, population: 24500 },
  { name: "Enter", province: "overijssel", lat: 52.2967, lon: 6.5750, population: 7300 },
  { name: "Rijssen", province: "overijssel", lat: 52.3100, lon: 6.5167, population: 30000, character: "urban" },
  { name: "Holten", province: "overijssel", lat: 52.2853, lon: 6.4208, population: 9500 },
  { name: "Goor", province: "overijssel", lat: 52.2333, lon: 6.5867, population: 12800 },
  { name: "Markelo", province: "overijssel", lat: 52.2358, lon: 6.4958, population: 7000 },
  { name: "Diepenheim", province: "overijssel", lat: 52.1983, lon: 6.5500, population: 2700 },
  { name: "Delden", province: "overijssel", lat: 52.2617, lon: 6.7083, population: 7400 },
  { name: "Borne", province: "overijssel", lat: 52.3008, lon: 6.7556, population: 23500 },
  { name: "Hengelo", province: "overijssel", lat: 52.2658, lon: 6.7931, population: 81000, character: "urban" },
  { name: "Tubbergen", province: "overijssel", lat: 52.4108, lon: 6.8333, population: 21200 },
  { name: "Geesteren", province: "overijssel", lat: 52.4217, lon: 6.7458, population: 4300 },
  { name: "Albergen", province: "overijssel", lat: 52.3700, lon: 6.7725, population: 3500 },
  { name: "Den Ham", province: "overijssel", lat: 52.4633, lon: 6.4950, population: 5800 },
  { name: "Vroomshoop", province: "overijssel", lat: 52.4592, lon: 6.5583, population: 9000 },
  { name: "Westerhaar", province: "overijssel", lat: 52.4583, lon: 6.6111, population: 4700 },

  // ── FLEVOLAND (Deep) ──
  { name: "Lelystad", province: "flevoland", lat: 52.5185, lon: 5.4714, population: 80000, character: "urban" },
  { name: "Dronten", province: "flevoland", lat: 52.5225, lon: 5.7194, population: 42000 },
  { name: "Biddinghuizen", province: "flevoland", lat: 52.4558, lon: 5.6967, population: 6400 },
  { name: "Swifterbant", province: "flevoland", lat: 52.5736, lon: 5.6375, population: 6500 },
  { name: "Zeewolde", province: "flevoland", lat: 52.3314, lon: 5.5414, population: 23000, character: "coastal" },
  { name: "Emmeloord", province: "flevoland", lat: 52.7117, lon: 5.7533, population: 26000 },
  { name: "Marknesse", province: "flevoland", lat: 52.7083, lon: 5.8917, population: 3800 },
  { name: "Ens", province: "flevoland", lat: 52.6367, lon: 5.8292, population: 3100 },
  { name: "Luttelgeest", province: "flevoland", lat: 52.7567, lon: 5.8617, population: 2300 },
  { name: "Rutten", province: "flevoland", lat: 52.8058, lon: 5.7000, population: 1700 },

  // ── BATCH #8: LIMBURG & UTRECHT ──
  // Limburg
  { name: "Maastricht", province: "limburg", lat: 50.8514, lon: 5.6910, population: 122000, character: "urban" },
  { name: "Venlo", province: "limburg", lat: 51.3700, lon: 6.1683, population: 102000, character: "urban" },
  { name: "Roermond", province: "limburg", lat: 51.1928, lon: 5.9872, population: 59000 },
  { name: "Sittard", province: "limburg", lat: 51.0000, lon: 5.8667, population: 37000 },
  { name: "Geleen", province: "limburg", lat: 50.9667, lon: 5.8333, population: 32000 },
  { name: "Heerlen", province: "limburg", lat: 50.8883, lon: 5.9794, population: 87000, character: "urban" },
  { name: "Weert", province: "limburg", lat: 51.2536, lon: 5.7089, population: 50000 },
  { name: "Kerkrade", province: "limburg", lat: 50.8658, lon: 6.0625, population: 46000 },
  { name: "Venray", province: "limburg", lat: 51.5267, lon: 5.9750, population: 43000 },
  { name: "Landgraaf", province: "limburg", lat: 50.9083, lon: 6.0300, population: 37000 },
  { name: "Brunssum", province: "limburg", lat: 50.9467, lon: 5.9733, population: 28000 },
  { name: "Stein", province: "limburg", lat: 50.9683, lon: 5.7658, population: 25000 },
  { name: "Echt", province: "limburg", lat: 51.1033, lon: 5.8667, population: 19000 },
  { name: "Horst", province: "limburg", lat: 51.4533, lon: 6.0500, population: 13000 },
  { name: "Valkenburg", province: "limburg", lat: 50.8647, lon: 5.8311, population: 11000, character: "highland" },

  // Utrecht
  { name: "Utrecht", province: "utrecht", lat: 52.0907, lon: 5.1214, population: 362000, character: "urban" },
  { name: "Amersfoort", province: "utrecht", lat: 52.1561, lon: 5.3878, population: 157000, character: "urban" },
  { name: "Zeist", province: "utrecht", lat: 52.0883, lon: 5.2344, population: 65000 },
  { name: "Nieuwegein", province: "utrecht", lat: 52.0289, lon: 5.0850, population: 64000, character: "urban" },
  { name: "Veenendaal", province: "utrecht", lat: 52.0253, lon: 5.5553, population: 67000 },
  { name: "Houten", province: "utrecht", lat: 52.0300, lon: 5.1667, population: 50000 },
  { name: "Woerden", province: "utrecht", lat: 52.0850, lon: 4.8833, population: 52000 },
  { name: "Maarssen", province: "utrecht", lat: 52.1383, lon: 5.0381, population: 40000 },
  { name: "IJsselstein", province: "utrecht", lat: 52.0200, lon: 5.0417, population: 34000 },
  { name: "Leusden", province: "utrecht", lat: 52.1333, lon: 5.4333, population: 30000 },
  { name: "Baarn", province: "utrecht", lat: 52.2125, lon: 5.2917, population: 25000 },
  { name: "Soest", province: "utrecht", lat: 52.1736, lon: 5.2917, population: 47000 },
  { name: "Wijk bij Duurstede", province: "utrecht", lat: 51.9750, lon: 5.3417, population: 24000 },
  { name: "Rhenen", province: "utrecht", lat: 51.9583, lon: 5.5667, population: 20000, character: "highland" },
  { name: "Bunnik", province: "utrecht", lat: 52.0667, lon: 5.2000, population: 15000 },

  // Gelderland (Missing hubs)
  { name: "Nijkerk", province: "gelderland", lat: 52.2217, lon: 5.4850, population: 44000 },
  { name: "Ermelo", province: "gelderland", lat: 52.3000, lon: 5.6167, population: 27000 },
  { name: "Putten", province: "gelderland", lat: 52.2583, lon: 5.6067, population: 24500 },
  { name: "Nunspeet", province: "gelderland", lat: 52.3783, lon: 5.7917, population: 28000 },
  { name: "Elburg", province: "gelderland", lat: 52.4475, lon: 5.8333, population: 12500, character: "coastal" },

  // ── BATCH #9: EILANDEN & DEEP SOUTH ──
  // Zuid-Hollandse Eilanden
  { name: "Ouddorp", province: "zuid-holland", lat: 51.8117, lon: 3.9350, population: 6000, character: "coastal" },
  { name: "Middelharnis", province: "zuid-holland", lat: 51.7583, lon: 4.1617, population: 7000, character: "coastal" },
  { name: "Sommelsdijk", province: "zuid-holland", lat: 51.7567, lon: 4.1483, population: 7500 },
  { name: "Dirksland", province: "zuid-holland", lat: 51.7483, lon: 4.1000, population: 5000 },
  { name: "Stellendam", province: "zuid-holland", lat: 51.8058, lon: 4.0292, population: 3500, character: "coastal" },
  { name: "Brielle", province: "zuid-holland", lat: 51.9017, lon: 4.1633, population: 13000, character: "coastal" },
  { name: "Oostvoorne", province: "zuid-holland", lat: 51.9117, lon: 4.1033, population: 8000, character: "coastal" },
  { name: "Rockanje", province: "zuid-holland", lat: 51.8717, lon: 4.0650, population: 6500, character: "coastal" },

  // Limburg Extra
  { name: "Beek", province: "limburg", lat: 50.9417, lon: 5.7950, population: 16000 },
  { name: "Meerssen", province: "limburg", lat: 50.8850, lon: 5.7533, population: 19000 },
  { name: "Elsloo", province: "limburg", lat: 50.9500, lon: 5.7667, population: 8000 },
  { name: "Born", province: "limburg", lat: 51.0317, lon: 5.8083, population: 6000 },
  { name: "Bocholtz", province: "limburg", lat: 50.8167, lon: 6.0500, population: 5000 },
  { name: "Simpelveld", province: "limburg", lat: 50.8350, lon: 5.9833, population: 10000 },
  { name: "Vaals", province: "limburg", lat: 50.7694, lon: 6.0183, population: 10000, character: "highland" },
  { name: "Gulpen", province: "limburg", lat: 50.8150, lon: 5.8900, population: 5000, character: "highland" },

  // Noord-Brabant
  { name: "Dongen", province: "noord-brabant", lat: 51.6258, lon: 4.9333, population: 26000 },
  { name: "Loon op Zand", province: "noord-brabant", lat: 51.6267, lon: 5.0750, population: 23000 },
  { name: "Uden", province: "noord-brabant", lat: 51.6583, lon: 5.6167, population: 42000 },
  { name: "Veghel", province: "noord-brabant", lat: 51.6167, lon: 5.5417, population: 31000 },
  { name: "Vught", province: "noord-brabant", lat: 51.6567, lon: 5.2917, population: 26500 },
  { name: "Rosmalen", province: "noord-brabant", lat: 51.7167, lon: 5.3667, population: 35000 },
  { name: "Boxmeer", province: "noord-brabant", lat: 51.6442, lon: 5.9458, population: 30000 },

  // ── BATCH #10: TOERISME & DEEP DRENTHE ──
  // Drenthe
  { name: "Havelte", province: "drenthe", lat: 52.7717, lon: 6.2367, population: 4000 },
  { name: "Ruinen", province: "drenthe", lat: 52.7625, lon: 6.3533, population: 4000 },
  { name: "Nijeveen", province: "drenthe", lat: 52.7294, lon: 6.2208, population: 4000 },
  { name: "Vries", province: "drenthe", lat: 53.0733, lon: 6.5783, population: 4500 },
  { name: "Tynaarlo", province: "drenthe", lat: 53.0775, lon: 6.6167, population: 2000 },
  { name: "Zuidveld", province: "drenthe", lat: 52.8800, lon: 6.6800, population: 100 },

  // Overijssel Hotspots
  { name: "Steenwijk", province: "overijssel", lat: 52.7883, lon: 6.1167, population: 25000 },
  { name: "Giethoorn", province: "overijssel", lat: 52.7400, lon: 6.0833, population: 2800, character: "coastal" },
  { name: "Vollenhove", province: "overijssel", lat: 52.6800, lon: 5.9533, population: 4000, character: "coastal" },
  { name: "Blokzijl", province: "overijssel", lat: 52.7267, lon: 5.9617, population: 1500, character: "coastal" },
  { name: "Oldemarkt", province: "overijssel", lat: 52.8225, lon: 5.9733, population: 2500 },

  // Noord-Holland (Texel & Omstreken)
  { name: "Den Burg", province: "noord-holland", lat: 53.0533, lon: 4.7967, population: 7000, character: "coastal" },
  { name: "De Koog", province: "noord-holland", lat: 53.0975, lon: 4.7617, population: 1500, character: "coastal" },
  { name: "Oosterend", province: "noord-holland", lat: 53.0858, lon: 4.8883, population: 1100, character: "coastal" },
  { name: "Den Hoorn (Texel)", province: "noord-holland", lat: 53.0250, lon: 4.7500, population: 500, character: "coastal" },
  { name: "Anna Paulowna", province: "noord-holland", lat: 52.8617, lon: 4.8258, population: 8000 },
  { name: "Breezand", province: "noord-holland", lat: 52.8933, lon: 4.7958, population: 3500 },

  // Utrechtse Heuvelrug
  { name: "Driebergen", province: "utrecht", lat: 52.0533, lon: 5.2817, population: 19000, character: "highland" },
  { name: "Doorn", province: "utrecht", lat: 52.0333, lon: 5.3500, population: 10000, character: "highland" },
  { name: "Maarn", province: "utrecht", lat: 52.0633, lon: 5.3733, population: 4500, character: "highland" },
  { name: "Amerongen", province: "utrecht", lat: 52.0033, lon: 5.4617, population: 7000, character: "highland" },
  { name: "Leersum", province: "utrecht", lat: 52.0117, lon: 5.4292, population: 7500, character: "highland" },
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
