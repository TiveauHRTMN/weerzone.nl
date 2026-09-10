/**
 * Regressietest voor de kredietrem in src/lib/hermes.ts.
 *
 * Draaien: npx tsx scripts/test-hermes-credit-brake.ts
 *
 * De storing die dit afvangt (audit 2026-09-10): het OpenRouter-saldo was op,
 * maar de rem sprong nooit aan. Het eerste model faalde namelijk om een ándere
 * reden, en pas het fallback-model kreeg de 402 -- en die call stond buiten de
 * try/catch. Gevolg: elke render van elke /weer-pagina betaalde alsnog twee
 * mislukte round-trips (~8 s), precies de deadline waarop de weer-fetch ernaast
 * sneuvelde. Zie de productielogs: "hermes-4-70b gefaald, fallback naar ..."
 * gevolgd door een 402, 23.806 keer in een week.
 *
 * We stubben op fetch-niveau i.p.v. de client te mocken, zodat de echte
 * SDK-retries meelopen. Let op: een 5xx wordt door de OpenAI-SDK zelf opnieuw
 * geprobeerd, dus die bereikt de fallback-tak niet -- daarom een 400.
 */
process.env.OPENROUTER_API_KEY ||= "test-key";

let calls = 0;
const body = (msg: string, code: number) => JSON.stringify({ error: { message: msg, code, type: "x" } });

globalThis.fetch = (async () => {
  calls++;
  return calls === 1
    ? new Response(body("model unavailable", 400), { status: 400, headers: { "content-type": "application/json" } })
    : new Response(body("no credits", 402), { status: 402, headers: { "content-type": "application/json" } });
}) as typeof fetch;

(async () => {
  const { hermesChat, hermesCreditPaused, resetHermesCreditBrake } = await import("../src/lib/hermes");
  resetHermesCreditBrake();

  if (hermesCreditPaused()) {
    console.error("FAIL: rem stond al aan bij aanvang");
    process.exit(1);
  }

  try {
    await hermesChat([{ role: "user", content: "hi" }]);
    console.error("FAIL: hermesChat had moeten gooien");
    process.exit(1);
  } catch (err) {
    const status = (err as { status?: number })?.status;
    if (status !== 402) {
      console.error(`FAIL: verwachtte een 402 door te komen, kreeg ${status}`);
      process.exit(1);
    }
  }

  if (calls !== 2) {
    console.error(`FAIL: verwachtte 2 calls (model + fallback), kreeg ${calls}`);
    process.exit(1);
  }

  if (!hermesCreditPaused()) {
    console.error("FAIL: de 402 kwam via het fallback-model en de kredietrem sprong niet aan");
    process.exit(1);
  }

  console.log("PASS: kredietrem springt aan als alleen het fallback-model 402 geeft");
})();
