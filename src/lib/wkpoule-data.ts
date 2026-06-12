/* Hartman WK Poule — data laag (WK 2026, officiële loting 5 dec 2025).
 *
 * Zelfstandige demo-data voor de premium poule-app: 48 landen met SVG-vlagspecs,
 * 12 poules (A–L), 72 groepswedstrijden, speelsteden met weer, selecties voor de
 * doelpuntenmaker-dropdowns, deelnemers met kampioen-/topscorerkeuze, en het
 * volledige puntensysteem.
 *
 * Puntensysteem (definitief):
 *  Wedstrijd:
 *   - Exacte uitslag            100
 *   - Correcte winnaar/gelijk    50
 *   - Correct aantal goals A     25
 *   - Correct aantal goals B     25
 *  Wedstrijd-bonus:
 *   - Correcte doelpuntenmaker  +35
 *   - Correcte 1e doelpuntenmaker +75
 *   - Perfect Match Bonus      +150 (exacte uitslag + doelpuntenmaker + 1e doelpuntenmaker correct)
 *  Joker (1 per speelronde): verdubbelt alle wedstrijd- én bonuspunten.
 *  Toernooi:
 *   - Wereldkampioen correct    500
 *  Fantasy spelersselectie (3 spelers, hele toernooi):
 *   - speelt mee +1 · goal +5 · assist +3 · clean sheet +3
 *   - gele kaart -2 · rode kaart -7 · eigen goal -5 · penalty gemist -5
 */

// ---------------------------------------------------------------- Types
export type FlagOp =
  | { t: "r"; x: number; y: number; w: number; h: number; c: string }
  | { t: "p"; d: string; c: string }
  | { t: "c"; cx: number; cy: number; r: number; c?: string; stroke?: string; sw?: number }
  | { t: "s"; cx: number; cy: number; r: number; c?: string; ir?: number; stroke?: string; sw?: number }
  | { t: "path"; d: string; c?: string; stroke?: string; sw?: number }
  | { t: "l"; x1: number; y1: number; x2: number; y2: number; c: string; sw: number };

export type FlagSpec = string[] | { b: (string | number)[]; o?: FlagOp[] };
export type Team = { name: string; fl: FlagSpec };
export type WeatherKind = "sun" | "part" | "cloud" | "rain";
export type City = { city: string; stad: string; weer: { t: number; c: WeatherKind } };
export type Group = { id: string; teams: string[] };
export type MatchStatus = "done" | "live" | "open";

export type Match = {
  id: number;
  gid: string;
  round: number;
  date: string;
  time: string;
  h: string;
  a: string;
  city: string;
  stad: string;
  weer: { t: number; c: WeatherKind };
  status: MatchStatus;
  result?: [number, number];
  min?: number;
  /** jouw opgeslagen voorspelling (score) */
  pred?: [number, number] | null;
  /** jouw doelpuntenmaker-keuze (spelernaam) */
  predScorer?: string | null;
  /** jouw eerste-doelpuntenmaker-keuze */
  predFirst?: string | null;
  joker?: boolean;
  /** werkelijke doelpuntenmakers (eerste = index 0) — alleen bij done/live */
  scorers?: string[];
  /** uitgesplitste punten voor afgeronde wedstrijden */
  breakdown?: PointBreakdown;
  pts?: number;
};

export type PointBreakdown = {
  exact: number;
  toto: number;
  goalsA: number;
  goalsB: number;
  scorer: number;
  first: number;
  perfect: number;
  jokerBonus: number;
  total: number;
};

export type Person = {
  name: string;
  pts: number;
  d: number;
  exact: number;
  rond: number;
  fantasy: number;
  me?: boolean;
  champion: string; // teamcode
};

export type FantasyEvent = { label: string; n: number; per: number };
export type FantasyPick = { name: string; team: string; events: FantasyEvent[]; total: number };

// ---------------------------------------------------------------- Punten
export const POINTS = {
  exact: 100,
  toto: 50,
  goalA: 25,
  goalB: 25,
  scorer: 35,
  first: 75,
  perfect: 150,
  jokerMult: 2,
  champion: 500,
} as const;

// Fantasy-spelerpunten per gebeurtenis
export const FANTASY_POINTS = {
  play: 1,
  goal: 5,
  assist: 3,
  cleanSheet: 3,
  yellow: -2,
  red: -7,
  ownGoal: -5,
  penMiss: -5,
} as const;

// ---------------------------------------------------------------- Teams (48)
export const TEAMS: Record<string, Team> = {
  // Poule A
  MEX: { name: "Mexico", fl: { b: ["v", "#006847", "#ffffff", "#CE1126"], o: [{ t: "c", cx: 15, cy: 10, r: 1.7, c: "#8a6a42" }] } },
  RSA: { name: "Zuid-Afrika", fl: { b: ["h", "#E03C31", "#002395"], o: [
    { t: "r", x: 0, y: 7, w: 30, h: 6, c: "#ffffff" }, { t: "r", x: 0, y: 7.8, w: 30, h: 4.4, c: "#007A4D" },
    { t: "p", d: "0,0 13,10 0,20", c: "#ffffff" }, { t: "p", d: "0,1.6 10.5,10 0,18.4", c: "#000000" }] } },
  KOR: { name: "Zuid-Korea", fl: { b: ["solid", "#ffffff"], o: [
    { t: "path", d: "M11,10 A4,4 0 0,1 19,10 A2,2 0 0,1 15,10 A2,2 0 0,0 11,10 Z", c: "#C60C30" },
    { t: "path", d: "M11,10 A4,4 0 0,0 19,10 A2,2 0 0,0 15,10 A2,2 0 0,1 11,10 Z", c: "#003478" },
    { t: "l", x1: 4.5, y1: 5.2, x2: 7, y2: 6.8, c: "#000", sw: 0.5 }, { t: "l", x1: 23, y1: 13.2, x2: 25.5, y2: 14.8, c: "#000", sw: 0.5 }] } },
  CZE: { name: "Tsjechië", fl: { b: ["h", "#ffffff", "#D7141A"], o: [{ t: "p", d: "0,0 13,10 0,20", c: "#11457E" }] } },
  // Poule B
  CAN: { name: "Canada", fl: { b: ["solid", "#ffffff"], o: [
    { t: "r", x: 0, y: 0, w: 7.5, h: 20, c: "#FF0000" }, { t: "r", x: 22.5, y: 0, w: 7.5, h: 20, c: "#FF0000" },
    { t: "s", cx: 15, cy: 10, r: 3.2, c: "#FF0000" }] } },
  BIH: { name: "Bosnië-Herzegovina", fl: { b: ["solid", "#002395"], o: [{ t: "p", d: "8,0 23,0 23,20", c: "#FECB00" }] } },
  QAT: { name: "Qatar", fl: ["v", "#ffffff", "#8A1538", "#8A1538", "#8A1538", "#8A1538"] },
  SUI: { name: "Zwitserland", fl: { b: ["solid", "#D52B1E"], o: [
    { t: "r", x: 12.7, y: 5.6, w: 4.6, h: 8.8, c: "#ffffff" }, { t: "r", x: 10.5, y: 7.8, w: 9, h: 4.4, c: "#ffffff" }] } },
  // Poule C
  BRA: { name: "Brazilië", fl: { b: ["solid", "#009C3B"], o: [
    { t: "p", d: "15,2 28,10 15,18 2,10", c: "#FEDF00" }, { t: "c", cx: 15, cy: 10, r: 3.4, c: "#002776" }] } },
  MAR: { name: "Marokko", fl: { b: ["solid", "#C1272D"], o: [{ t: "s", cx: 15, cy: 10, r: 4, c: "none", stroke: "#006233", sw: 0.9 }] } },
  HAI: { name: "Haïti", fl: ["h", "#00209F", "#D21034"] },
  SCO: { name: "Schotland", fl: { b: ["solid", "#0065BF"], o: [
    { t: "l", x1: 0, y1: 0, x2: 30, y2: 20, c: "#ffffff", sw: 3.2 }, { t: "l", x1: 30, y1: 0, x2: 0, y2: 20, c: "#ffffff", sw: 3.2 }] } },
  // Poule D
  USA: { name: "Verenigde Staten", fl: { b: ["rep", "#B22234", "#ffffff", 13], o: [{ t: "r", x: 0, y: 0, w: 13, h: 10.8, c: "#3C3B6E" }] } },
  PAR: { name: "Paraguay", fl: ["h", "#D52B1E", "#ffffff", "#0038A8"] },
  AUS: { name: "Australië", fl: { b: ["solid", "#00247D"], o: [
    { t: "r", x: 0, y: 0, w: 12, h: 10, c: "#012169" },
    { t: "l", x1: 0, y1: 0, x2: 12, y2: 10, c: "#ffffff", sw: 1.4 }, { t: "l", x1: 12, y1: 0, x2: 0, y2: 10, c: "#ffffff", sw: 1.4 },
    { t: "r", x: 5, y: 0, w: 2, h: 10, c: "#ffffff" }, { t: "r", x: 0, y: 4, w: 12, h: 2, c: "#ffffff" },
    { t: "r", x: 5.5, y: 0, w: 1, h: 10, c: "#E4002B" }, { t: "r", x: 0, y: 4.5, w: 12, h: 1, c: "#E4002B" },
    { t: "s", cx: 6, cy: 15, r: 2, c: "#ffffff" }, { t: "s", cx: 22, cy: 7, r: 1.1, c: "#ffffff" },
    { t: "s", cx: 25, cy: 12, r: 1.1, c: "#ffffff" }, { t: "s", cx: 21, cy: 14, r: 1.1, c: "#ffffff" }, { t: "s", cx: 26, cy: 16.5, r: 0.8, c: "#ffffff" }] } },
  TUR: { name: "Turkije", fl: { b: ["solid", "#E30A17"], o: [
    { t: "c", cx: 13, cy: 10, r: 4, c: "#ffffff" }, { t: "c", cx: 14.3, cy: 10, r: 3.2, c: "#E30A17" }, { t: "s", cx: 18.4, cy: 10, r: 1.7, c: "#ffffff" }] } },
  // Poule E
  GER: { name: "Duitsland", fl: ["h", "#000000", "#DD0000", "#FFCE00"] },
  CUW: { name: "Curaçao", fl: { b: ["solid", "#002B7F"], o: [
    { t: "r", x: 0, y: 14, w: 30, h: 3, c: "#F9D90F" }, { t: "s", cx: 6, cy: 5, r: 1.6, c: "#ffffff" }, { t: "s", cx: 9, cy: 7.5, r: 1.1, c: "#ffffff" }] } },
  CIV: { name: "Ivoorkust", fl: ["v", "#F77F00", "#ffffff", "#009E60"] },
  ECU: { name: "Ecuador", fl: ["h", "#FFDD00", "#FFDD00", "#034EA2", "#ED1C24"] },
  // Poule F
  NED: { name: "Nederland", fl: ["h", "#AE1C28", "#ffffff", "#21468B"] },
  JPN: { name: "Japan", fl: { b: ["solid", "#ffffff"], o: [{ t: "c", cx: 15, cy: 10, r: 4, c: "#BC002D" }] } },
  SWE: { name: "Zweden", fl: { b: ["solid", "#006AA7"], o: [{ t: "r", x: 9, y: 0, w: 3.4, h: 20, c: "#FECC02" }, { t: "r", x: 0, y: 8.3, w: 30, h: 3.4, c: "#FECC02" }] } },
  TUN: { name: "Tunesië", fl: { b: ["solid", "#E70013"], o: [
    { t: "c", cx: 15, cy: 10, r: 5, c: "#ffffff" }, { t: "c", cx: 15.4, cy: 10, r: 2.6, c: "#E70013" }, { t: "c", cx: 16.7, cy: 10, r: 2.2, c: "#ffffff" }, { t: "s", cx: 16.3, cy: 10, r: 1.3, c: "#E70013" }] } },
  // Poule G
  BEL: { name: "België", fl: ["v", "#000000", "#FAE042", "#ED2939"] },
  EGY: { name: "Egypte", fl: { b: ["h", "#CE1126", "#ffffff", "#000000"], o: [{ t: "s", cx: 15, cy: 10, r: 2, c: "#C09300" }] } },
  IRN: { name: "Iran", fl: ["h", "#239F40", "#ffffff", "#DA0000"] },
  NZL: { name: "Nieuw-Zeeland", fl: { b: ["solid", "#00247D"], o: [
    { t: "r", x: 0, y: 0, w: 12, h: 10, c: "#012169" },
    { t: "l", x1: 0, y1: 0, x2: 12, y2: 10, c: "#ffffff", sw: 1.2 }, { t: "l", x1: 12, y1: 0, x2: 0, y2: 10, c: "#ffffff", sw: 1.2 },
    { t: "r", x: 5, y: 0, w: 2, h: 10, c: "#ffffff" }, { t: "r", x: 0, y: 4, w: 12, h: 2, c: "#ffffff" },
    { t: "r", x: 5.5, y: 0, w: 1, h: 10, c: "#CC142B" }, { t: "r", x: 0, y: 4.5, w: 12, h: 1, c: "#CC142B" },
    { t: "s", cx: 22, cy: 6, r: 1.2, c: "#CC142B" }, { t: "s", cx: 25, cy: 11, r: 1.2, c: "#CC142B" }, { t: "s", cx: 21, cy: 13, r: 1.2, c: "#CC142B" }, { t: "s", cx: 24.5, cy: 16, r: 0.9, c: "#CC142B" }] } },
  // Poule H
  ESP: { name: "Spanje", fl: ["h", "#AA151B", "#F1BF00", "#F1BF00", "#AA151B"] },
  CPV: { name: "Kaapverdië", fl: { b: ["solid", "#003893"], o: [
    { t: "r", x: 0, y: 11, w: 30, h: 1.6, c: "#ffffff" }, { t: "r", x: 0, y: 12.6, w: 30, h: 1.6, c: "#CF2027" }, { t: "r", x: 0, y: 14.2, w: 30, h: 1.6, c: "#ffffff" },
    { t: "s", cx: 11, cy: 13, r: 1.4, c: "#F7D116" }] } },
  KSA: { name: "Saoedi-Arabië", fl: { b: ["solid", "#006C35"], o: [{ t: "r", x: 6, y: 12.6, w: 18, h: 0.9, c: "#ffffff" }] } },
  URU: { name: "Uruguay", fl: { b: ["solid", "#ffffff"], o: [
    { t: "r", x: 0, y: 4.4, w: 30, h: 2.2, c: "#0038A8" }, { t: "r", x: 0, y: 8.9, w: 30, h: 2.2, c: "#0038A8" }, { t: "r", x: 0, y: 13.3, w: 30, h: 2.2, c: "#0038A8" }, { t: "r", x: 0, y: 17.8, w: 30, h: 2.2, c: "#0038A8" },
    { t: "r", x: 0, y: 0, w: 11, h: 11, c: "#ffffff" }, { t: "s", cx: 5.5, cy: 5.2, r: 2.4, c: "#FCD116", ir: 1, stroke: "#7B5300", sw: 0.3 }] } },
  // Poule I
  FRA: { name: "Frankrijk", fl: ["v", "#002395", "#ffffff", "#ED2939"] },
  SEN: { name: "Senegal", fl: { b: ["v", "#00853F", "#FDEF42", "#E31B23"], o: [{ t: "s", cx: 15, cy: 10, r: 2.4, c: "#00853F" }] } },
  IRQ: { name: "Irak", fl: ["h", "#CE1126", "#ffffff", "#000000"] },
  NOR: { name: "Noorwegen", fl: { b: ["solid", "#BA0C2F"], o: [
    { t: "r", x: 8.3, y: 0, w: 4.4, h: 20, c: "#ffffff" }, { t: "r", x: 0, y: 7.8, w: 30, h: 4.4, c: "#ffffff" },
    { t: "r", x: 9.3, y: 0, w: 2.4, h: 20, c: "#00205B" }, { t: "r", x: 0, y: 8.8, w: 30, h: 2.4, c: "#00205B" }] } },
  // Poule J
  ARG: { name: "Argentinië", fl: { b: ["h", "#75AADB", "#ffffff", "#75AADB"], o: [{ t: "c", cx: 15, cy: 10, r: 1.8, c: "#F6B40E" }] } },
  ALG: { name: "Algerije", fl: { b: ["v", "#006233", "#ffffff"], o: [
    { t: "c", cx: 15, cy: 10, r: 3.4, c: "#D21034" }, { t: "c", cx: 16.3, cy: 10, r: 2.7, c: "#ffffff" }, { t: "s", cx: 17.2, cy: 10, r: 1.5, c: "#D21034" }] } },
  AUT: { name: "Oostenrijk", fl: ["h", "#ED2939", "#ffffff", "#ED2939"] },
  JOR: { name: "Jordanië", fl: { b: ["h", "#000000", "#ffffff", "#007A3D"], o: [{ t: "p", d: "0,0 12,10 0,20", c: "#CE1126" }, { t: "s", cx: 4.4, cy: 10, r: 1.3, c: "#ffffff" }] } },
  // Poule K
  POR: { name: "Portugal", fl: { b: ["v", "#006600", "#006600", "#FF0000", "#FF0000", "#FF0000"], o: [{ t: "c", cx: 12, cy: 10, r: 2.3, c: "#FFD000" }, { t: "c", cx: 12, cy: 10, r: 1.3, c: "#003399" }] } },
  COD: { name: "DR Congo", fl: { b: ["solid", "#007FFF"], o: [
    { t: "l", x1: 0, y1: 20, x2: 30, y2: 0, c: "#F7D618", sw: 5 }, { t: "l", x1: 0, y1: 20, x2: 30, y2: 0, c: "#CE1021", sw: 3 }, { t: "s", cx: 4.5, cy: 4, r: 2, c: "#F7D618" }] } },
  UZB: { name: "Oezbekistan", fl: ["h", "#0099B5", "#ffffff", "#1EB53A"] },
  COL: { name: "Colombia", fl: ["h", "#FCD116", "#FCD116", "#003893", "#CE1126"] },
  // Poule L
  ENG: { name: "Engeland", fl: { b: ["solid", "#ffffff"], o: [{ t: "r", x: 12.5, y: 0, w: 5, h: 20, c: "#CF142B" }, { t: "r", x: 0, y: 7.5, w: 30, h: 5, c: "#CF142B" }] } },
  CRO: { name: "Kroatië", fl: ["h", "#FF0000", "#ffffff", "#171796"] },
  GHA: { name: "Ghana", fl: { b: ["h", "#CE1126", "#FCD116", "#006B3F"], o: [{ t: "s", cx: 15, cy: 10, r: 2.6, c: "#000000" }] } },
  PAN: { name: "Panama", fl: { b: ["solid", "#ffffff"], o: [
    { t: "r", x: 15, y: 0, w: 15, h: 10, c: "#D21034" }, { t: "r", x: 0, y: 10, w: 15, h: 10, c: "#005293" },
    { t: "s", cx: 7.5, cy: 5, r: 2.2, c: "#005293" }, { t: "s", cx: 22.5, cy: 15, r: 2.2, c: "#D21034" }] } },
};

// ---------------------------------------------------------------- Speelsteden
export const CITIES: City[] = [
  { city: "New York", stad: "MetLife Stadium", weer: { t: 23, c: "sun" } },
  { city: "Los Angeles", stad: "SoFi Stadium", weer: { t: 27, c: "sun" } },
  { city: "Dallas", stad: "AT&T Stadium", weer: { t: 33, c: "sun" } },
  { city: "Atlanta", stad: "Mercedes-Benz Stadium", weer: { t: 28, c: "part" } },
  { city: "Miami", stad: "Hard Rock Stadium", weer: { t: 30, c: "rain" } },
  { city: "Houston", stad: "NRG Stadium", weer: { t: 31, c: "part" } },
  { city: "Boston", stad: "Gillette Stadium", weer: { t: 21, c: "part" } },
  { city: "Philadelphia", stad: "Lincoln Financial Field", weer: { t: 25, c: "sun" } },
  { city: "Seattle", stad: "Lumen Field", weer: { t: 19, c: "cloud" } },
  { city: "Kansas City", stad: "Arrowhead Stadium", weer: { t: 29, c: "part" } },
  { city: "Toronto", stad: "BMO Field", weer: { t: 20, c: "cloud" } },
  { city: "Vancouver", stad: "BC Place", weer: { t: 18, c: "cloud" } },
  { city: "Mexico-Stad", stad: "Estadio Azteca", weer: { t: 22, c: "part" } },
  { city: "Guadalajara", stad: "Estadio Akron", weer: { t: 26, c: "sun" } },
  { city: "Monterrey", stad: "Estadio BBVA", weer: { t: 32, c: "sun" } },
  { city: "San Francisco", stad: "Levi's Stadium", weer: { t: 24, c: "part" } },
];

// ---------------------------------------------------------------- Poules
export const GROUPS: Group[] = [
  { id: "A", teams: ["MEX", "RSA", "KOR", "CZE"] },
  { id: "B", teams: ["CAN", "BIH", "QAT", "SUI"] },
  { id: "C", teams: ["BRA", "MAR", "HAI", "SCO"] },
  { id: "D", teams: ["USA", "PAR", "AUS", "TUR"] },
  { id: "E", teams: ["GER", "CUW", "CIV", "ECU"] },
  { id: "F", teams: ["NED", "JPN", "SWE", "TUN"] },
  { id: "G", teams: ["BEL", "EGY", "IRN", "NZL"] },
  { id: "H", teams: ["ESP", "CPV", "KSA", "URU"] },
  { id: "I", teams: ["FRA", "SEN", "IRQ", "NOR"] },
  { id: "J", teams: ["ARG", "ALG", "AUT", "JOR"] },
  { id: "K", teams: ["POR", "COD", "UZB", "COL"] },
  { id: "L", teams: ["ENG", "CRO", "GHA", "PAN"] },
];

// ---------------------------------------------------------------- Selecties (doelpuntenmakers)
// Bekende namen voor de grote landen; voor de rest een nette generieke selectie,
// zodat elke wedstrijd een gevulde dropdown heeft.
const NAMED_SQUADS: Record<string, string[]> = {
  NED: ["Cody Gakpo", "Memphis Depay", "Xavi Simons", "Donyell Malen", "Brian Brobbey"],
  BRA: ["Vinícius Jr.", "Rodrygo", "Endrick", "Raphinha", "Gabriel Martinelli"],
  FRA: ["Kylian Mbappé", "Ousmane Dembélé", "Marcus Thuram", "Bradley Barcola", "Randal Kolo Muani"],
  ENG: ["Harry Kane", "Bukayo Saka", "Jude Bellingham", "Phil Foden", "Cole Palmer"],
  ARG: ["Lionel Messi", "Julián Álvarez", "Lautaro Martínez", "Ángel Di María", "Nico Paz"],
  ESP: ["Lamine Yamal", "Nico Williams", "Álvaro Morata", "Dani Olmo", "Mikel Oyarzabal"],
  GER: ["Florian Wirtz", "Jamal Musiala", "Kai Havertz", "Niclas Füllkrug", "Serge Gnabry"],
  POR: ["Cristiano Ronaldo", "Bruno Fernandes", "Rafael Leão", "Gonçalo Ramos", "João Félix"],
  BEL: ["Romelu Lukaku", "Kevin De Bruyne", "Jérémy Doku", "Leandro Trossard", "Charles De Ketelaere"],
  USA: ["Christian Pulisic", "Folarin Balogun", "Ricardo Pepi", "Tim Weah", "Gio Reyna"],
  MEX: ["Santiago Giménez", "Raúl Jiménez", "Hirving Lozano", "Alexis Vega", "Edson Álvarez"],
  CAN: ["Jonathan David", "Alphonso Davies", "Cyle Larin", "Tajon Buchanan", "Jacob Shaffelburg"],
  JPN: ["Kaoru Mitoma", "Takefusa Kubo", "Daizen Maeda", "Junya Ito", "Ayase Ueda"],
  CRO: ["Luka Modrić", "Andrej Kramarić", "Joško Gvardiol", "Mateo Kovačić", "Ante Budimir"],
  URU: ["Darwin Núñez", "Federico Valverde", "Facundo Pellistri", "Maxi Araújo", "Rodrigo Aguirre"],
  SEN: ["Sadio Mané", "Nicolas Jackson", "Ismaïla Sarr", "Habib Diallo", "Iliman Ndiaye"],
};

const GENERIC = ["Spits", "Aanvaller", "Middenvelder", "Vleugelspeler", "Spelmaker"];

export function squad(code: string): string[] {
  if (NAMED_SQUADS[code]) return NAMED_SQUADS[code];
  const name = TEAMS[code]?.name ?? code;
  return GENERIC.map((role) => `${name} — ${role}`);
}

/** Alle doelpuntenmaker-opties voor een wedstrijd (beide ploegen). */
export function matchScorerOptions(m: Match): { team: string; players: string[] }[] {
  return [
    { team: m.h, players: squad(m.h) },
    { team: m.a, players: squad(m.a) },
  ];
}

// ---------------------------------------------------------------- Generator
function hash(n: number) {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}
const goalDist = [0, 0, 1, 1, 1, 2, 2, 3];
const goal = (n: number) => goalDist[Math.floor(hash(n) * 8)];
const pairsByDay: Record<number, number[][]> = { 1: [[0, 1], [2, 3]], 2: [[0, 2], [3, 1]], 3: [[3, 0], [1, 2]] };
const dayDates: Record<number, string[]> = {
  1: ["2026-06-11", "2026-06-12", "2026-06-13", "2026-06-14"],
  2: ["2026-06-17", "2026-06-18", "2026-06-19", "2026-06-20"],
  3: ["2026-06-24", "2026-06-25", "2026-06-26", "2026-06-27"],
};
const times = ["15:00", "18:00", "21:00", "18:00"];

function pickScorers(m: Match): string[] {
  if (!m.result) return [];
  const [hg, ag] = m.result;
  const hs = squad(m.h);
  const as = squad(m.a);
  const out: string[] = [];
  for (let i = 0; i < hg; i++) out.push(hs[Math.floor(hash(m.id * 17 + i + 1) * hs.length)]);
  for (let i = 0; i < ag; i++) out.push(as[Math.floor(hash(m.id * 23 + i + 1) * as.length)]);
  // bepaal de "eerste" doelpuntenmaker zo dat hij niet altijd thuis is
  if (out.length > 1 && hash(m.id * 29) < 0.5) out.reverse();
  return out;
}

function scorePoints(pred: [number, number], result: [number, number]): Omit<PointBreakdown, "scorer" | "first" | "jokerBonus" | "total"> {
  const o = (x: number[]) => (x[0] > x[1] ? 1 : x[0] < x[1] ? -1 : 0);
  const exactHit = pred[0] === result[0] && pred[1] === result[1];
  return {
    exact: exactHit ? POINTS.exact : 0,
    toto: !exactHit && o(pred) === o(result) ? POINTS.toto : 0,
    goalsA: pred[0] === result[0] ? POINTS.goalA : 0,
    goalsB: pred[1] === result[1] ? POINTS.goalB : 0,
  };
}

function buildMatches(): Match[] {
  const matches: Match[] = [];
  let cityIdx = 0;
  let id = 0;
  GROUPS.forEach((g, gi) => {
    [1, 2, 3].forEach((md) => {
      pairsByDay[md].forEach((pair, pi) => {
        id++;
        const h = g.teams[pair[0]];
        const a = g.teams[pair[1]];
        const c = CITIES[cityIdx % CITIES.length];
        cityIdx++;
        const date = dayDates[md][(gi + pi) % 4];
        const time = times[(gi + pi * 2) % times.length];

        // status: md1 done; md2 pair0 done (Poule F = live); md3 open
        let status: MatchStatus = "open";
        if (md === 1) status = "done";
        else if (md === 2 && pi === 0) status = g.id === "F" ? "live" : "done";

        const m: Match = { id, gid: g.id, round: md, date, time, h, a, city: c.city, stad: c.stad, weer: c.weer, status };

        if (status === "done" || status === "live") {
          m.result = [goal(id * 7 + 1), goal(id * 7 + 3)];
          if (status === "live") m.min = 58;
          m.scorers = pickScorers(m);
        }

        // jouw voorspelling
        const predRoll = hash(id * 7 + 5);
        if (status === "done" || status === "live") {
          if (predRoll < 0.34) m.pred = m.result!.slice() as [number, number];
          else if (predRoll < 0.7) m.pred = [Math.max(0, m.result![0] + (hash(id * 7 + 6) < 0.5 ? 1 : -1)), m.result![1]];
          else m.pred = [goal(id * 11 + 2), goal(id * 11 + 4)];

          // doelpuntenmaker-voorspellingen
          const opts = [...squad(m.h), ...squad(m.a)];
          m.predScorer = opts[Math.floor(hash(id * 31) * opts.length)];
          m.predFirst = opts[Math.floor(hash(id * 37) * opts.length)];

          if (status === "done") {
            const base = scorePoints(m.pred, m.result!);
            const scorerHit = m.scorers!.includes(m.predScorer!) ? POINTS.scorer : 0;
            const firstHit = m.scorers!.length > 0 && m.scorers![0] === m.predFirst ? POINTS.first : 0;
            // Perfect Match: exacte uitslag + doelpuntenmaker + 1e doelpuntenmaker allemaal goed
            const perfect = base.exact > 0 && scorerHit > 0 && firstHit > 0 ? POINTS.perfect : 0;
            const subtotal = base.exact + base.toto + base.goalsA + base.goalsB + scorerHit + firstHit + perfect;
            const jokerBonus = m.joker ? subtotal : 0;
            m.breakdown = { ...base, scorer: scorerHit, first: firstHit, perfect, jokerBonus, total: subtotal + jokerBonus };
            m.pts = m.breakdown.total;
          }
        } else {
          // open: helft al voorspeld
          m.pred = predRoll < 0.5 ? [goal(id * 13 + 2), goal(id * 13 + 4)] : null;
          if (m.pred) {
            const opts = [...squad(m.h), ...squad(m.a)];
            m.predScorer = opts[Math.floor(hash(id * 31) * opts.length)];
            m.predFirst = opts[Math.floor(hash(id * 37) * opts.length)];
          }
        }
        matches.push(m);
      });
    });
  });

  // Joker (x2) — één per speelronde (op een afgeronde wedstrijd)
  const r1joker = matches.find((m) => m.round === 1 && m.status === "done");
  const r2joker = matches.find((m) => m.round === 2 && m.status === "done");
  [r1joker, r2joker].forEach((m) => {
    if (m && m.breakdown) {
      m.joker = true;
      const subtotal = m.breakdown.total;
      m.breakdown.jokerBonus = subtotal;
      m.breakdown.total = subtotal * POINTS.jokerMult;
      m.pts = m.breakdown.total;
    }
  });

  return matches;
}

export const MATCHES: Match[] = buildMatches();

// ---------------------------------------------------------------- Standen
export type StandingRow = { code: string; sp: number; w: number; g: number; v: number; dv: number; dt: number; pt: number; saldo: number };

export function standings(gid: string): StandingRow[] {
  const g = GROUPS.find((x) => x.id === gid)!;
  const rows: Record<string, Omit<StandingRow, "saldo">> = {};
  g.teams.forEach((t) => (rows[t] = { code: t, sp: 0, w: 0, g: 0, v: 0, dv: 0, dt: 0, pt: 0 }));
  MATCHES.filter((m) => m.gid === gid && m.status === "done").forEach((m) => {
    const [hg, ag] = m.result!;
    const H = rows[m.h];
    const A = rows[m.a];
    H.sp++; A.sp++; H.dv += hg; H.dt += ag; A.dv += ag; A.dt += hg;
    if (hg > ag) { H.w++; A.v++; H.pt += 3; }
    else if (hg < ag) { A.w++; H.v++; A.pt += 3; }
    else { H.g++; A.g++; H.pt++; A.pt++; }
  });
  return Object.values(rows)
    .map((r) => ({ ...r, saldo: r.dv - r.dt }))
    .sort((a, b) => b.pt - a.pt || b.saldo - a.saldo || b.dv - a.dv);
}

export const TABLES: Record<string, StandingRow[]> = Object.fromEntries(GROUPS.map((g) => [g.id, standings(g.id)]));

// ---------------------------------------------------------------- Mijn totaal
export const myMatchPoints = MATCHES.filter((m) => m.status === "done" && typeof m.pts === "number").reduce((s, m) => s + (m.pts ?? 0), 0);
export const myExact = MATCHES.filter((m) => m.breakdown && m.breakdown.exact > 0).length;
export const myToto = MATCHES.filter((m) => m.breakdown && m.breakdown.toto > 0).length;
export const myScorerHits = MATCHES.filter((m) => m.breakdown && (m.breakdown.scorer > 0 || m.breakdown.first > 0)).length;
export const myPerfect = MATCHES.filter((m) => m.breakdown && m.breakdown.perfect > 0).length;

// ---------------------------------------------------------------- Fantasy: mijn 3 spelers
function fantasyTotal(events: FantasyEvent[]): number {
  return events.reduce((s, e) => s + e.n * e.per, 0);
}
function fantasyPick(name: string, team: string, raw: Partial<Record<keyof typeof FANTASY_POINTS, number>>): FantasyPick {
  const events: FantasyEvent[] = (Object.keys(raw) as (keyof typeof FANTASY_POINTS)[])
    .filter((k) => (raw[k] ?? 0) !== 0)
    .map((k) => ({ label: FANTASY_LABELS[k], n: raw[k] ?? 0, per: FANTASY_POINTS[k] }));
  return { name, team, events, total: fantasyTotal(events) };
}
const FANTASY_LABELS: Record<keyof typeof FANTASY_POINTS, string> = {
  play: "Speelminuten", goal: "Goals", assist: "Assists", cleanSheet: "Clean sheets",
  yellow: "Gele kaarten", red: "Rode kaarten", ownGoal: "Eigen goals", penMiss: "Gemiste penalty's",
};

export const MY_FANTASY: FantasyPick[] = [
  fantasyPick("Kylian Mbappé", "FRA", { play: 3, goal: 4, assist: 1, yellow: 1 }),
  fantasyPick("Cody Gakpo", "NED", { play: 3, goal: 2, assist: 2 }),
  fantasyPick("Vinícius Jr.", "BRA", { play: 2, goal: 1, assist: 1, yellow: 2, penMiss: 1 }),
];
export const myFantasyPoints = MY_FANTASY.reduce((s, p) => s + p.total, 0);

// ---------------------------------------------------------------- Mijn toernooi-keuze
export const MY_PICKS = { champion: "BRA" };

// totaal = wedstrijdpunten + fantasy-spelerpunten (kampioenpunten vallen pas ná de finale)
export const myTotal = myMatchPoints + myFantasyPoints;

// ---------------------------------------------------------------- Deelnemers
// [naam, factor t.o.v. mijn totaal, delta, exact, ronde-factor, kampioenkeuze, fantasy-factor, me?]
const roster: [string, number, number, number, number, string, number, boolean?][] = [
  ["Opa Gerrit", 1.13, 1, 9, 0.27, "ARG", 1.2],
  ["Jij (Tom)", 1.0, 2, myExact, 0.21, "BRA", 1.0, true],
  ["Lisa", 0.95, -1, 7, 0.24, "FRA", 0.9],
  ["Sven de Vries", 0.86, 0, 6, 0.16, "ENG", 1.1],
  ["Femke", 0.8, 3, 6, 0.28, "ESP", 0.7],
  ["Oom Rob", 0.74, -2, 5, 0.13, "BRA", 0.8],
  ["Tante Annie", 0.69, 1, 5, 0.18, "NED", 1.3],
  ["Daan Bakker", 0.64, -1, 4, 0.2, "POR", 0.6],
  ["Bram", 0.58, 0, 4, 0.14, "GER", 0.9],
  ["Sanne", 0.53, 4, 3, 0.25, "FRA", 1.0],
  ["Opa Wim", 0.49, -3, 3, 0.11, "ARG", 0.5],
  ["Eva", 0.44, 0, 3, 0.15, "BEL", 0.7],
  ["Niels", 0.4, -1, 2, 0.17, "NED", 1.1],
  ["Tante Joke", 0.35, 2, 2, 0.1, "BRA", 0.4],
  ["Koen", 0.3, -2, 1, 0.08, "ESP", 0.6],
  ["Roos", 0.24, 0, 1, 0.12, "ENG", 0.9],
];

export const PEOPLE: Person[] = roster
  .map(([name, fac, d, exact, rfac, champion, ffac, me]) => ({
    name,
    pts: Math.round(myMatchPoints * fac + myFantasyPoints * ffac),
    d,
    exact,
    rond: Math.round(myTotal * rfac),
    fantasy: Math.round(myFantasyPoints * ffac),
    champion,
    me: !!me,
  }))
  .sort((a, b) => b.pts - a.pts);

// ---------------------------------------------------------------- Bonus/info
export const ROUNDS = [
  { n: 1, label: "Speelronde 1", sub: "11 – 14 juni" },
  { n: 2, label: "Speelronde 2", sub: "17 – 20 juni" },
  { n: 3, label: "Speelronde 3", sub: "24 – 27 juni" },
];

/** Joker al gebruikt in deze ronde? (demo: ronde 1 en 2 gebruikt, ronde 3 nog open) */
export function jokerUsedInRound(round: number): boolean {
  return MATCHES.some((m) => m.round === round && m.joker);
}

export const POULE_META = {
  name: "Hartman WK Poule",
  code: "HARTMAN26",
  members: PEOPLE.length,
  host: "VS · Canada · Mexico",
};
