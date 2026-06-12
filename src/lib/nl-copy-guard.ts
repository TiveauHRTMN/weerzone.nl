const REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bExplore\b/gi, "Bekijk"],
  [/\bDiscover\b/gi, "Ontdek"],
  [/Verdieping van\s+/gi, "Meer over "],
  [/\bAI-powered\b/gi, "slim samengesteld"],
  [/\bAssistant\b/gi, "hulp"],
  [/\bCompanion\b/gi, "hulp"],
  [/Alles onder controle/gi, "Geen bijzonderheden die je planning veranderen"],
  [/diepe duik/gi, "uitgebreide uitleg"],
  [/maak een beslissing/gi, "neem een beslissing"],
  [/doe een keuze/gi, "maak een keuze"],
  [/op dit moment in tijd/gi, "nu"],
];

const RISK_TERMS = [
  "code geel", "code oranje", "code rood", "onweer", "zware regen",
  "storm", "windstoten", "gladheid", "ijzel", "hitte",
];

export function nlCopyGuard(input: string): string {
  const protectedTerms = RISK_TERMS.filter((term) => input.toLocaleLowerCase("nl-NL").includes(term));
  let output = input;
  for (const [pattern, replacement] of REPLACEMENTS) output = output.replace(pattern, replacement);
  output = output
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (/^[A-ZÀ-Ý]/.test(input) && /^[a-zà-ÿ]/.test(output)) {
    output = output.charAt(0).toLocaleUpperCase("nl-NL") + output.slice(1);
  }

  const lowered = output.toLocaleLowerCase("nl-NL");
  return protectedTerms.some((term) => !lowered.includes(term)) ? input.trim() : output;
}

export function nlCopyGuardValue<T>(value: T): T {
  if (typeof value === "string") return nlCopyGuard(value) as T;
  if (Array.isArray(value)) return value.map((item) => nlCopyGuardValue(item)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, nlCopyGuardValue(item)]),
    ) as T;
  }
  return value;
}
