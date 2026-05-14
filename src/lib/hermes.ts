import OpenAI from "openai";

const PRIMARY_MODEL = "nousresearch/hermes-4-70b";
const FALLBACK_MODEL = "deepseek/deepseek-v4-pro";

const MODELS = {
  large:   PRIMARY_MODEL,
  fast:    PRIMARY_MODEL,
  seo:     PRIMARY_MODEL,
  persona: "deepseek/deepseek-v4-flash", // persona briefs: speed > power
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
};

export async function hermesChat(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options: HermesOptions = {}
): Promise<string> {
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
    return result.choices[0].message.content ?? "";
  } catch (err) {
    // persona already uses a fast model — don't retry with Pro
    if (requestedModel === "deepseek/deepseek-v4-flash") throw err;
    console.warn(`hermesChat: ${requestedModel} gefaald, fallback naar ${FALLBACK_MODEL}`);
    const result = await client.chat.completions.create({ model: FALLBACK_MODEL, ...params });
    return result.choices[0].message.content ?? "";
  }
}
