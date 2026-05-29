/**
 * Mariana Tesla — reasoning client.
 *
 * Tesla draait async (cron/achtergrond), niet in de request-path: de redenering
 * is te diep voor het Vercel-request-budget. Daarom een EIGEN Anthropic-client
 * (los van de snelle persona-config in lib/hermes.ts), met:
 *   - claude-opus-4-8 (env-overridable via MARIANA_TESLA_MODEL)
 *   - adaptive thinking + effort "high" (convectieve redenering is complex)
 *   - prompt caching op de grote statische systeemprompt (de variabele
 *     situatie-packet staat ná het cache-breakpoint in de user-turn)
 *   - structured outputs (output_config.format) -> gegarandeerd parseerbare JSON
 *   - streaming (lange redenering -> geen request-timeout)
 *
 * Vereist ANTHROPIC_API_KEY. Faalt expliciet als die ontbreekt.
 */

import Anthropic from "@anthropic-ai/sdk";
import { TESLA_SYSTEM_PROMPT } from "./prompt";
import { TESLA_OUTPUT_JSON_SCHEMA } from "./types";

export const DEFAULT_TESLA_MODEL = "claude-opus-4-8";

type TeslaEffort = "low" | "medium" | "high" | "xhigh" | "max";

export interface TeslaReasoningResult {
  /** Ruwe geparste JSON-output (nog niet genormaliseerd — zie types.normalizeTeslaSignal). */
  raw: unknown;
  /** De ruwe tekst-output (de JSON-string). */
  text: string;
  /** Het gebruikte model. */
  model: string;
  /** Token-usage incl. cache-hits (voor cost/observability). */
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheCreationTokens: number;
  };
}

let cachedClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY ontbreekt — Mariana Tesla kan niet redeneren");
  cachedClient = new Anthropic({
    apiKey,
    // Tesla draait in een cron/achtergrond met ruim budget; lange timeout is OK.
    timeout: 10 * 60 * 1000,
    maxRetries: 2,
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

/**
 * Voert Tesla's convectieve redenering uit op een samengestelde situatie-packet
 * en geeft de gestructureerde (geparste) output terug.
 *
 * @param situationPacket  De per-regio convectieve situatie (modelvelden,
 *   ESTOFEX/KNMI/DWD, founder-input, valid-window) als tekst. Staat ná het
 *   cache-breakpoint, dus mag per run variëren zonder de cache te breken.
 */
export async function runTeslaReasoning(
  situationPacket: string,
  opts: { model?: string; effort?: TeslaEffort } = {}
): Promise<TeslaReasoningResult> {
  const client = getClient();
  const model = opts.model ?? process.env.MARIANA_TESLA_MODEL ?? DEFAULT_TESLA_MODEL;
  const effort = opts.effort ?? "high";

  // De stream-params worden als platte object-literal opgebouwd en met `as any`
  // doorgegeven. Reden: het literal tegen de enorme MessageStreamParams-union
  // laten relateren liet de TS-checker exploderen (RangeError: Map maximum size
  // exceeded, removeSubtypes over een mega-union). Gedrag is identiek; alleen de
  // compile-time relatie aan deze grens vervalt.
  const params = {
    model,
    max_tokens: 16000,
    thinking: { type: "adaptive" as const },
    output_config: {
      effort,
      format: {
        type: "json_schema" as const,
        schema: TESLA_OUTPUT_JSON_SCHEMA,
      },
    },
    // Grote statische spec -> cachen. Byte-identiek over runs = cache-hit.
    system: [
      {
        type: "text" as const,
        text: TESLA_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" as const },
      },
    ],
    messages: [{ role: "user" as const, content: situationPacket }],
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stream = client.messages.stream(params as any);
  const final = await stream.finalMessage();

  // Losjes uitlezen: voorkomt union-relatie tegen het ContentBlock-type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const f = final as any;
  const blocks: Array<{ type?: string; text?: string }> = Array.isArray(f?.content)
    ? f.content
    : [];
  const textBlock = blocks.find((b) => b?.type === "text");
  const text = typeof textBlock?.text === "string" ? textBlock.text : "";

  let raw: unknown = null;
  if (text) {
    try {
      raw = JSON.parse(stripJsonFences(text));
    } catch {
      raw = null;
    }
  }

  return {
    raw,
    text,
    model: typeof f?.model === "string" ? f.model : model,
    usage: {
      inputTokens: f?.usage?.input_tokens ?? 0,
      outputTokens: f?.usage?.output_tokens ?? 0,
      cacheReadTokens: f?.usage?.cache_read_input_tokens ?? 0,
      cacheCreationTokens: f?.usage?.cache_creation_input_tokens ?? 0,
    },
  };
}
