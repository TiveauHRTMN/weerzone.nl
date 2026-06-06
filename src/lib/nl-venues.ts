import type { Place } from "./places-data";

/**
 * Curated NL leisure venues -> programmatische weerpagina's op
 * /weer/[province]/[slug]. Co-ordinaten via OpenStreetMap (Overpass).
 * Kwaliteit boven kwantiteit: alleen echt-gezochte venues, geen
 * kinderboerderijen/miniworlds (thin-content vermijden).
 *
 * Dit is de geverifieerde startset. Uitbreiding naar ~120 venues is een
 * aparte data-taak met geverifieerde co-ordinaten (niet uit het hoofd).
 */
export const NL_VENUE_PLACES: Place[] = [
  // --- Attractieparken ---
  { name: "Efteling", province: "noord-brabant", lat: 51.6499, lon: 5.0481, slug: "efteling", venueType: "attractiepark", character: "inland" },
  { name: "Walibi Holland", province: "flevoland", lat: 52.4402, lon: 5.768, slug: "walibi-holland", venueType: "attractiepark", character: "inland" },
  { name: "Toverland", province: "limburg", lat: 51.3983, lon: 5.9839, slug: "toverland", venueType: "attractiepark", character: "inland" },
  { name: "Attractiepark Slagharen", province: "overijssel", lat: 52.6232, lon: 6.5631, slug: "attractiepark-slagharen", venueType: "attractiepark", character: "inland" },
  { name: "Duinrell", province: "zuid-holland", lat: 52.1476, lon: 4.3807, slug: "duinrell", venueType: "attractiepark", character: "coastal" },
  { name: "Avonturenpark Hellendoorn", province: "overijssel", lat: 52.3898, lon: 6.436, slug: "avonturenpark-hellendoorn", venueType: "attractiepark", character: "inland" },
  { name: "Julianatoren", province: "gelderland", lat: 52.2267, lon: 5.916, slug: "julianatoren", venueType: "attractiepark", character: "highland" },
  { name: "Familiepark Drievliet", province: "zuid-holland", lat: 52.0543, lon: 4.3503, slug: "drievliet", venueType: "attractiepark", character: "urban" },
  { name: "Linnaeushof", province: "noord-holland", lat: 52.3254, lon: 4.5984, slug: "linnaeushof", venueType: "attractiepark", character: "coastal" },
  { name: "Madurodam", province: "zuid-holland", lat: 52.0995, lon: 4.2976, slug: "madurodam", venueType: "attractiepark", character: "coastal" },
  { name: "Deltapark Neeltje Jans", province: "zeeland", lat: 51.6391, lon: 3.7143, slug: "deltapark-neeltje-jans", venueType: "attractiepark", character: "coastal" },
  { name: "Familiepark DippieDoe", province: "noord-brabant", lat: 51.4999, lon: 5.436, slug: "dippiedoe", venueType: "attractiepark", character: "inland" },
  { name: "Sprookjeswonderland", province: "noord-holland", lat: 52.7118, lon: 5.2895, slug: "sprookjeswonderland", venueType: "attractiepark", character: "coastal" },

  // --- Dierentuinen ---
  { name: "Artis", province: "noord-holland", lat: 52.366, lon: 4.9167, slug: "artis", venueType: "dierentuin", character: "urban" },
  { name: "Burgers' Zoo", province: "gelderland", lat: 52.0101, lon: 5.9001, slug: "burgers-zoo", venueType: "dierentuin", character: "highland" },
  { name: "Apenheul", province: "gelderland", lat: 52.2152, lon: 5.9186, slug: "apenheul", venueType: "dierentuin", character: "highland" },
  { name: "AquaZoo Leeuwarden", province: "friesland", lat: 53.2151, lon: 5.8831, slug: "aquazoo-leeuwarden", venueType: "dierentuin", character: "inland" },
  { name: "Avifauna", province: "zuid-holland", lat: 52.1393, lon: 4.649, slug: "avifauna", venueType: "dierentuin", character: "inland" },
  { name: "BestZOO", province: "noord-brabant", lat: 51.5293, lon: 5.4008, slug: "bestzoo", venueType: "dierentuin", character: "inland" },

  // --- Attractieparken (uitbreiding, co-ordinaten via Overpass) ---
  { name: "Archeon", province: "zuid-holland", lat: 52.1149, lon: 4.6495, slug: "archeon", venueType: "attractiepark" },
  { name: "BillyBird Park Hemelrijk", province: "noord-brabant", lat: 51.6345, lon: 5.6778, slug: "billybird-park-hemelrijk", venueType: "attractiepark" },
  { name: "BillyBird Park Drakenrijk", province: "limburg", lat: 51.2685, lon: 6.0748, slug: "billybird-park-drakenrijk", venueType: "attractiepark" },
  { name: "Sprookjesbos Valkenburg", province: "limburg", lat: 50.8571, lon: 5.8336, slug: "sprookjesbos-valkenburg", venueType: "attractiepark" },
  { name: "Plaswijckpark", province: "zuid-holland", lat: 51.9563, lon: 4.4832, slug: "plaswijckpark", venueType: "attractiepark" },
  { name: "Oud Valkeveen", province: "noord-holland", lat: 52.3061, lon: 5.1916, slug: "oud-valkeveen", venueType: "attractiepark" },
  { name: "Mondo Verde", province: "limburg", lat: 50.8857, lon: 6.0306, slug: "mondo-verde", venueType: "attractiepark" },
  { name: "Sybrandy's Speelpark", province: "friesland", lat: 52.8345, lon: 5.5456, slug: "sybrandy-s-speelpark", venueType: "attractiepark" },
  { name: "Familiepark Nienoord", province: "drenthe", lat: 53.1694, lon: 6.3965, slug: "familiepark-nienoord", venueType: "attractiepark" },
  { name: "Pukkemuk", province: "noord-brabant", lat: 51.627, lon: 4.9839, slug: "pukkemuk", venueType: "attractiepark" },
  { name: "Hullie", province: "noord-brabant", lat: 51.6717, lon: 5.5813, slug: "hullie", venueType: "attractiepark" },
  { name: "De Waarbeek", province: "overijssel", lat: 52.2442, lon: 6.8089, slug: "de-waarbeek", venueType: "attractiepark" },
  { name: "Steinerbos", province: "limburg", lat: 50.9711, lon: 5.7802, slug: "steinerbos", venueType: "attractiepark" },
  { name: "Dinoland", province: "overijssel", lat: 52.505, lon: 6.0767, slug: "dinoland", venueType: "attractiepark" },
  { name: "Recreatiepark Drouwenerzand", province: "drenthe", lat: 52.9568, lon: 6.788, slug: "recreatiepark-drouwenerzand", venueType: "attractiepark" },

  // --- Dierentuinen (uitbreiding) ---
  { name: "Diergaarde Blijdorp", province: "zuid-holland", lat: 51.9267, lon: 4.4475, slug: "diergaarde-blijdorp", venueType: "dierentuin" },
  { name: "Safaripark Beekse Bergen", province: "noord-brabant", lat: 51.5188, lon: 5.1091, slug: "safaripark-beekse-bergen", venueType: "dierentuin" },
  { name: "Ouwehands Dierenpark", province: "utrecht", lat: 51.958, lon: 5.59, slug: "ouwehands-dierenpark", venueType: "dierentuin" },
  { name: "GaiaZOO", province: "limburg", lat: 50.8696, lon: 6.0495, slug: "gaiazoo", venueType: "dierentuin" },
  { name: "Wildlands Adventure Zoo Emmen", province: "drenthe", lat: 52.7803, lon: 6.8871, slug: "wildlands-adventure-zoo-emmen", venueType: "dierentuin" },
  { name: "Dierenpark Amersfoort", province: "utrecht", lat: 52.1496, lon: 5.3459, slug: "dierenpark-amersfoort", venueType: "dierentuin" },
  { name: "Dolfinarium", province: "gelderland", lat: 52.3541, lon: 5.6167, slug: "dolfinarium", venueType: "dierentuin" },
  { name: "ZooParc Overloon", province: "noord-brabant", lat: 51.5787, lon: 5.9379, slug: "zooparc-overloon", venueType: "dierentuin" },
  { name: "Dierenpark Hoenderdaell", province: "noord-holland", lat: 52.8657, lon: 4.848, slug: "dierenpark-hoenderdaell", venueType: "dierentuin" },
  { name: "EcoMare", province: "noord-holland", lat: 53.0776, lon: 4.745, slug: "ecomare", venueType: "dierentuin" },
  { name: "Van Blanckendaell Park", province: "noord-holland", lat: 52.7378, lon: 4.7429, slug: "van-blanckendaell-park", venueType: "dierentuin" },
  { name: "Reptielenzoo Iguana", province: "zeeland", lat: 51.4419, lon: 3.5728, slug: "reptielenzoo-iguana", venueType: "dierentuin" },
  { name: "Reptielenhuis De Aarde", province: "noord-brabant", lat: 51.5933, lon: 4.8153, slug: "reptielenhuis-de-aarde", venueType: "dierentuin" },
  { name: "Serpo", province: "zuid-holland", lat: 52.0417, lon: 4.3374, slug: "serpo", venueType: "dierentuin" },
  { name: "Dierenpark de Oliemeulen", province: "noord-brabant", lat: 51.5708, lon: 5.0623, slug: "dierenpark-de-oliemeulen", venueType: "dierentuin" },
  { name: "Berkenhof Tropical Zoo", province: "zeeland", lat: 51.4394, lon: 3.8898, slug: "berkenhof-tropical-zoo", venueType: "dierentuin" },
  { name: "Klein Costa Rica", province: "noord-brabant", lat: 51.363, lon: 5.716, slug: "klein-costa-rica", venueType: "dierentuin" },
  { name: "Pantropica", province: "flevoland", lat: 52.7589, lon: 5.8342, slug: "pantropica", venueType: "dierentuin" },
  { name: "Vlindorado", province: "noord-holland", lat: 52.7342, lon: 4.8258, slug: "vlindorado", venueType: "dierentuin" },

  // --- Buitenbaden / zwemplassen / waterparken ---
  { name: "Aquadrome", province: "overijssel", lat: 52.2068, lon: 6.8968, slug: "aquadrome", venueType: "zwembad" },
  { name: "Tikibad", province: "zuid-holland", lat: 52.1466, lon: 4.3811, slug: "tikibad", venueType: "zwembad" },
  { name: "Mosaqua", province: "limburg", lat: 50.8096, lon: 5.8902, slug: "mosaqua", venueType: "zwembad" },
  { name: "Bosbad Appelscha", province: "friesland", lat: 52.9431, lon: 6.3488, slug: "bosbad-appelscha", venueType: "zwembad" },
  { name: "De Mirandabad", province: "noord-holland", lat: 52.339, lon: 4.9036, slug: "de-mirandabad", venueType: "zwembad" },
  { name: "Twentebad", province: "overijssel", lat: 52.2811, lon: 6.8012, slug: "twentebad", venueType: "zwembad" },
  { name: "Scheldorado", province: "zeeland", lat: 51.3354, lon: 3.8389, slug: "scheldorado", venueType: "zwembad" },
  { name: "Swimfun Joure", province: "friesland", lat: 52.9569, lon: 5.7974, slug: "swimfun-joure", venueType: "zwembad" },
  { name: "Sportiom AquaFun", province: "noord-brabant", lat: 51.7001, lon: 5.3268, slug: "sportiom-aquafun", venueType: "zwembad" },
  { name: "Tropiqua", province: "groningen", lat: 53.1052, lon: 6.8679, slug: "tropiqua", venueType: "zwembad" },
  { name: "Waterspeelpark Splesj", province: "noord-brabant", lat: 51.5717, lon: 4.5616, slug: "waterspeelpark-splesj", venueType: "zwembad" },
  { name: "Storm Aquapark Vlietland", province: "zuid-holland", lat: 52.118, lon: 4.4657, slug: "storm-aquapark-vlietland", venueType: "zwembad" },
  { name: "Brediusbad", province: "noord-holland", lat: 52.3922, lon: 4.8695, slug: "brediusbad", venueType: "zwembad" },
  { name: "Flevoparkbad", province: "noord-holland", lat: 52.3642, lon: 4.9524, slug: "flevoparkbad", venueType: "zwembad" },
  { name: "Noorderparkbad", province: "noord-holland", lat: 52.3976, lon: 4.9186, slug: "noorderparkbad", venueType: "zwembad" },
  { name: "Groenhovenbad", province: "zuid-holland", lat: 52.0239, lon: 4.6893, slug: "groenhovenbad", venueType: "zwembad" },
  { name: "Zwembad De Heerenduinen", province: "noord-holland", lat: 52.4536, lon: 4.6206, slug: "zwembad-de-heerenduinen", venueType: "zwembad" },
  { name: "Bosbad Vledder", province: "drenthe", lat: 52.8508, lon: 6.1989, slug: "bosbad-vledder", venueType: "zwembad" },
  { name: "Henschotermeer", province: "utrecht", lat: 52.0802, lon: 5.3747, slug: "henschotermeer", venueType: "zwembad" },
  { name: "Bosbad Zwinderen", province: "drenthe", lat: 52.7248, lon: 6.6678, slug: "bosbad-zwinderen", venueType: "zwembad" },
];
