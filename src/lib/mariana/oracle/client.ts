/**
 * Mariana Oracle — reasoning client (Hermes 4 70B via OpenRouter).
 *
 * Oracle draait dagelijks/diep in een achtergrond-context, niet in het Vercel
 * request-path. Daarom een EIGEN OpenRouter-client (los van de snelle 8s-config
 * in lib/hermes.ts) met ruime timeout, JSON-modus en een grote statische
 * systeemprompt. Hermes ondersteunt geen Anthropic-stijl json_schema-tool; we
 * forceren JSON via response_format: json_object en parsen/normaliseren zelf.
 *
 * Conform project_llm_setup: Hermes wordt via OpenRouter aangesproken
 * (OpenAI-compatibel, baseURL openrouter.ai/api/v1), niet via een lokaal endpoint.
 *
 * Vereist OPENROUTER_API_KEY.
 */

import OpenAI from "openai";
import { ORACLE_SYSTEM_PROMPT } from "./prompt";

export const DEFAULT_ORACLE_MODEL = "nousresearch/hermes-4-70b";
const FALLBACK_ORACLE_MODEL = "deepseek/deepseek-v4-pro";

export interface OracleReasoningResult {
  /** Ruwe geparste JSON (nog niet genormaliseerd — zie normalizeOracleSignal). */
  raw: unknown;
  /** De ruwe tekst-output. */
  text: string;
  model: string;
}

let cachedClient: OpenAI | null = null;

function getClient(): OpenAI {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY ontbreekt — Mariana Oracle kan niet redeneren");
  cachedClient = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    // Oracle draait in een dagelijkse/achtergrond-context; ruime timeout is OK.
    timeout: 5 * 60 * 1000,
    maxRetries: 2,
    defaultHeaders: {
      "HTTP-Referer": "https://weerzone.nl",
      "X-Title": "Weerzone - Mariana Oracle",
    },
  });
  return cachedClient;
}

function stripJsonFences(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  }
  return trimmed;
}

/** Pakt het eerste valide JSON-object uit een tekst (defensief tegen pre/post-tekst). */
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

export async function runOracleReasoning(
  regimePacket: string,
  opts: { model?: string } = {}
): Promise<OracleReasoningResult> {
  const client = getClient();
  const model = opts.model ?? process.env.MARIANA_ORACLE_MODEL ?? DEFAULT_ORACLE_MODEL;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: ORACLE_SYSTEM_PROMPT },
    { role: "user", content: regimePacket },
  ];
  const params = {
    messages,
    temperature: 0.3,
    max_tokens: 4096,
    response_format: { type: "json_object" as const },
  };

  let text: string;
  let usedModel = model;
  try {
    const result = await client.chat.completions.create({ model, ...params });
    text = result.choices[0]?.message?.content ?? "";
  } catch (err) {
    console.warn(`runOracleReasoning: ${model} gefaald, fallback naar ${FALLBACK_ORACLE_MODEL}`, err);
    const result = await client.chat.completions.create({
      model: FALLBACK_ORACLE_MODEL,
      ...params,
    });
    text = result.choices[0]?.message?.content ?? "";
    usedModel = FALLBACK_ORACLE_MODEL;
  }

  return { raw: extractJson(text), text, model: usedModel };
}
