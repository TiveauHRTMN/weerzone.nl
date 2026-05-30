/**
 * Mariana NL — reasoning client (Hermes 4 70B via OpenRouter).
 *
 * Stuurt de OPERATIONELE baan. Eigen OpenRouter-client met ruimere timeout dan
 * de 8s-config in lib/hermes.ts (Mariana draait dagelijks/achtergrond, niet strikt
 * in het request-path), JSON-modus, fallback. Conform project_llm_setup: Hermes
 * via OpenRouter (OpenAI-compatibel).
 *
 * Vereist OPENROUTER_API_KEY.
 */

import OpenAI from "openai";
import { MARIANA_SYSTEM_PROMPT } from "./prompt";

export const DEFAULT_MARIANA_MODEL = "nousresearch/hermes-4-70b";
const FALLBACK_MARIANA_MODEL = "deepseek/deepseek-v4-pro";

export interface MarianaReasoningResult {
  raw: unknown;
  text: string;
  model: string;
}

let cachedClient: OpenAI | null = null;

function getClient(): OpenAI {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY ontbreekt — Mariana kan niet redeneren");
  cachedClient = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    timeout: 60 * 1000,
    maxRetries: 2,
    defaultHeaders: {
      "HTTP-Referer": "https://weerzone.nl",
      "X-Title": "Weerzone — Mariana",
    },
  });
  return cachedClient;
}

function stripJsonFences(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  }
  return trimmed;
}

function extractJson(text: string): unknown {
  const cleaned = stripJsonFences(text);
  try {
    return JSON.parse(cleaned);
  } catch {
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first >= 0 && last > first) {
      try {
        return JSON.parse(cleaned.slice(first, last + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function runMarianaReasoning(
  packet: string,
  opts: { model?: string } = {}
): Promise<MarianaReasoningResult> {
  const client = getClient();
  const model = opts.model ?? process.env.MARIANA_MODEL ?? DEFAULT_MARIANA_MODEL;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: MARIANA_SYSTEM_PROMPT },
    { role: "user", content: packet },
  ];
  const params = {
    messages,
    temperature: 0.4,
    max_tokens: 2048,
    response_format: { type: "json_object" as const },
  };

  let text: string;
  let usedModel = model;
  try {
    const result = await client.chat.completions.create({ model, ...params });
    text = result.choices[0]?.message?.content ?? "";
  } catch (err) {
    console.warn(`runMarianaReasoning: ${model} gefaald, fallback ${FALLBACK_MARIANA_MODEL}`, err);
    const result = await client.chat.completions.create({ model: FALLBACK_MARIANA_MODEL, ...params });
    text = result.choices[0]?.message?.content ?? "";
    usedModel = FALLBACK_MARIANA_MODEL;
  }

  return { raw: extractJson(text), text, model: usedModel };
}
