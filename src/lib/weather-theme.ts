/**
 * Gedeeld WMO→kleur-thema voor de achtergrond-gradient. Puur (geen "use client"),
 * zodat zowel server- (WeerzoneBackground) als client-componenten
 * (GlobalWeatherBackground) dezelfde lucht-kleuren gebruiken als WeatherBackground.
 */
export function weatherTheme(code: number, isDay: boolean): { bg1: string; bg2: string } {
  // De achtergrond kleurt mee met het weer, in een strak premium palet:
  //   onbewolkt → luchtblauw · regen → donkergrijs · onweer → antraciet.
  // Daartussen loopt het vloeiend van helder/blauw naar grijs naar charcoal.
  if (code === 200) return { bg1: "#8f867a", bg2: "#b3a99b" }; // smog
  if (code === 201) return { bg1: "#cda367", bg2: "#ecd2a4" }; // Sahara-stof
  if (!isDay) {
    if (code === 0) return { bg1: "#0b1026", bg2: "#1a2750" }; // heldere nacht
    if (code === 1) return { bg1: "#0d1530", bg2: "#1d2c58" };
    if (code <= 67) return { bg1: "#161a20", bg2: "#252b34" }; // regen-nacht (donker)
    if (code >= 95) return { bg1: "#0e1013", bg2: "#202329" }; // onweer-nacht (antraciet)
    return { bg1: "#0f1828", bg2: "#223450" };
  }
  // — overdag —
  if (code === 0) return { bg1: "#3f9be6", bg2: "#9fcef4" }; // onbewolkt → luchtblauw
  if (code === 1) return { bg1: "#4f9fe1", bg2: "#a6d0f1" }; // licht bewolkt
  if (code === 2) return { bg1: "#6aa6d6", bg2: "#b6d4ea" }; // half bewolkt
  if (code === 3) return { bg1: "#8a9bac", bg2: "#bcc8d4" }; // zwaar bewolkt → grijsblauw
  if (code <= 48) return { bg1: "#959fa9", bg2: "#c4ccd3" }; // mist
  if (code <= 57) return { bg1: "#6b727b", bg2: "#9aa1aa" }; // motregen → middengrijs
  if (code <= 67) return { bg1: "#3c424a", bg2: "#565d66" }; // regen → donkergrijs
  if (code <= 77) return { bg1: "#c2cdd8", bg2: "#e6edf2" }; // sneeuw → koel lichtgrijs
  if (code <= 82) return { bg1: "#444b54", bg2: "#626a74" }; // buien → donkergrijs
  if (code <= 86) return { bg1: "#b6c2ce", bg2: "#dce4ea" }; // natte sneeuw
  if (code >= 95) return { bg1: "#23272d", bg2: "#363c44" }; // onweer → antraciet
  return { bg1: "#4f9fe1", bg2: "#a6d0f1" };
}

/**
 * Is de lucht donker genoeg dat content lichte tekst nodig heeft?
 * (regen/buien/onweer overdag, en bijna alles 's nachts behalve sneeuw.)
 */
export function isDarkSky(code: number, isDay: boolean): boolean {
  if (!isDay) return !(code >= 71 && code <= 77); // sneeuw-nacht blijft lichtig
  if (code >= 95) return true;            // onweer
  if (code >= 58 && code <= 67) return true; // regen
  if (code >= 80 && code <= 82) return true; // buien
  return false;
}

/**
 * Warme horizon-gloed (laagstaande zon). Alleen zinvol bij helder/licht weer;
 * bij grijs/onweer vrijwel uit (een storm heeft geen warme horizon).
 */
export function horizonGlow(code: number, isDay: boolean): string {
  const clearish = code <= 2;
  const a = !isDay ? 0.06 : clearish ? 0.18 : code <= 3 ? 0.08 : 0.0;
  if (a <= 0) return "radial-gradient(0 0 at 50% 116%, transparent, transparent)";
  return (
    `radial-gradient(140% 56% at 50% 116%, rgba(255,209,32,${a}) 0%, ` +
    `rgba(255,180,52,${a * 0.5}) 22%, transparent 50%)`
  );
}
