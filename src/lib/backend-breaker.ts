/**
 * Zekeringetje voor een backend die plat ligt.
 *
 * Een deadline beschermt één render. Hij onthoudt alleen niets: ligt de backend
 * er echt uit, dan betaalt élke volgende render die deadline opnieuw om
 * precies hetzelfde te ontdekken. Tijdens de storing van september 2026 kostte
 * dat 1200 + 1200 ms per paginaweergave — bij ~5.500 renders per dag puur
 * wachten op een host waarvan we al wisten dat hij niet bestond.
 *
 * Deze zekering onthoudt het wél: na een paar opeenvolgende missers gaat hij
 * open en slaan we de call meteen over, tot de koelperiode voorbij is. Daarna
 * proberen we het één keer opnieuw; lukt dat, dan sluit hij en is alles weer
 * normaal. Zo herstelt de site vanzelf zodra de backend terugkomt, zonder dat
 * iemand iets hoeft te deployen.
 *
 * De staat leeft per lambda-instance. Dat is precies goed: geen gedeelde
 * opslag nodig (die ligt in dit scenario juist plat), en een nieuwe instance
 * begint netjes met een frisse poging.
 */

type Breaker = {
  fouten: number;
  openTot: number;
};

const breakers = new Map<string, Breaker>();

/** Zoveel missers achter elkaar voordat we het opgeven. */
const DREMPEL = 3;

/** Zo lang slaan we over voordat we het opnieuw proberen. */
const KOELPERIODE_MS = 60_000;

function breaker(naam: string): Breaker {
  let b = breakers.get(naam);
  if (!b) {
    b = { fouten: 0, openTot: 0 };
    breakers.set(naam, b);
  }
  return b;
}

/** Staat de zekering open? Zo ja, dan is de call niet het proberen waard. */
export function isOpen(naam: string): boolean {
  return breaker(naam).openTot > Date.now();
}

export function meldMisser(naam: string): void {
  const b = breaker(naam);
  b.fouten += 1;
  if (b.fouten >= DREMPEL && b.openTot <= Date.now()) {
    b.openTot = Date.now() + KOELPERIODE_MS;
    console.warn(
      `[breaker] ${naam} ligt eruit na ${b.fouten} missers — ${KOELPERIODE_MS / 1000}s overslaan`,
    );
  }
}

export function meldSucces(naam: string): void {
  const b = breaker(naam);
  if (b.fouten > 0 || b.openTot > 0) {
    console.info(`[breaker] ${naam} antwoordt weer — zekering dicht`);
  }
  b.fouten = 0;
  b.openTot = 0;
}

/**
 * Let op wat een "misser" is: alleen een fout of een overschreden deadline.
 * Een call die netjes `null` teruggeeft is GEEN misser -- `loadMarianaMemory`
 * geeft terecht null als er voor die locatie nog geen geheugen is opgeslagen.
 * Dat als storing tellen zou de verrijking uitzetten terwijl de backend
 * kerngezond is. Daarom melden de aanroepers zelf wat er gebeurde, in plaats
 * van dat deze module naar de waarde raadt.
 */
