import OpenAI from "openai";
import { nlCopyGuard } from "@/lib/nl-copy-guard";

const PRIMARY_MODEL = "nousresearch/hermes-4-70b";
const FALLBACK_MODEL = "deepseek/deepseek-v4-pro";

const MODELS = {
  large:   PRIMARY_MODEL,
  fast:    PRIMARY_MODEL,
  seo:     PRIMARY_MODEL,
  persona: "deepseek/deepseek-v4-flash", // persona briefs: speed > power
  personaPro: "deepseek/deepseek-v4-pro",
} as const;

export type HermesModel = keyof typeof MODELS;

function getClient() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY ontbreekt");
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    timeout: 8000, // Verlaagd naar 8s voor Vercel (10s limit)
    defaultHeaders: {
      "HTTP-Referer": "https://weerzone.nl",
      "X-Title": "Weerzone",
    },
  });
}

type HermesOptions = {
  model?: HermesModel;
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
  nlGuard?: boolean;
};

/**
 * Circuit breaker voor "geen krediet meer" (HTTP 402).
 *
 * Het OpenRouter-saldo raakte op 3 september 2026 op. Elke render van elke
 * programmatische /weer-pagina bleef daarna alsnog OpenRouter bellen — én
 * probeerde na de fout nóg een keer met het fallback-model. Dat waren ~24.000
 * mislukte calls in een week, twee netwerk-round-trips diep in het render-pad
 * van pagina's die de tekst tóch niet kregen (audit 2026-09-10).
 *
 * Een 402 is een accountsaldo, geen modelprobleem: een ander model helpt niet.
 * Na een 402 slaan we calls dus even helemaal over en falen we meteen, zodat de
 * aanroeper direct op zijn eigen fallback-tekst landt. De teller is per
 * lambda-instantie; bij Fluid Compute dekt één instantie veel requests.
 */
const CREDIT_COOLDOWN_MS = 15 * 60 * 1000;
let creditExhaustedUntil = 0;

function isOutOfCredit(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { status?: number }).status === 402;
}

/** Zichtbaar voor monitoring/tests: staat de kredietrem er nu op? */
export function hermesCreditPaused(): boolean {
  return Date.now() < creditExhaustedUntil;
}

export async function hermesChat(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options: HermesOptions = {}
): Promise<string> {
  if (hermesCreditPaused()) {
    throw new Error("hermesChat overgeslagen: OpenRouter-saldo is op (kredietrem actief)");
  }
  const client = getClient();
  const requestedModel = MODELS[options.model ?? "fast"];
  const params = {
    messages,
    temperature: options.temperature ?? 0.4,
    max_tokens: options.maxTokens ?? 2048,
    ...(options.json ? { response_format: { type: "json_object" as const } } : {}),
  };

  try {
    const result = await client.chat.completions.create({ model: requestedModel, ...params });
    const content = result.choices[0].message.content ?? "";
    return options.nlGuard && !options.json ? nlCopyGuard(content) : content;
  } catch (err) {
    if (isOutOfCredit(err)) {
      // Saldo op: het fallback-model faalt op precies dezelfde rekening.
      creditExhaustedUntil = Date.now() + CREDIT_COOLDOWN_MS;
      console.error("hermesChat: OpenRouter-saldo op — calls gepauzeerd voor 15 min");
      throw err;
    }
    // persona already uses a fast model — don't retry with Pro
    if (requestedModel === "deepseek/deepseek-v4-flash") throw err;
    console.warn(`hermesChat: ${requestedModel} gefaald, fallback naar ${FALLBACK_MODEL}`);
    const result = await client.chat.completions.create({ model: FALLBACK_MODEL, ...params });
    const content = result.choices[0].message.content ?? "";
    return options.nlGuard && !options.json ? nlCopyGuard(content) : content;
  }
}
