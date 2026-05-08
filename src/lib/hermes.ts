import OpenAI from "openai";

const MODELS = {
  large: "nousresearch/hermes-4-405b",  // complexe taken (WWS, orchestrator)
  fast:  "nousresearch/hermes-4-70b",   // snelle taken
  seo:   "deepseek/deepseek-v4-pro",    // batch SEO
  persona: "deepseek/deepseek-v4-flash", // persona briefs (Piet/Reed/Steve)
} as const;

export type HermesModel = keyof typeof MODELS;

function getClient() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY ontbreekt");
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    timeout: 60000, // 60 sec — DeepSeek V4 flash is snel (voorheen 3 min voor Kimi)
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
  const result = await client.chat.completions.create({
    model: MODELS[options.model ?? "fast"],
    messages,
    temperature: options.temperature ?? 0.4,
    max_tokens: options.maxTokens ?? 2048,
    ...(options.json ? { response_format: { type: "json_object" } } : {}),
  });
  return result.choices[0].message.content ?? "";
}
