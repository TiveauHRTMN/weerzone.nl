/**
 * Kleine adapter voor Mariana's opgeslagen agent-output.
 *
 * De database-shape (`MarianaSignal` + `MarianaLocalFeed`) blijft intern; Koos
 * leest via deze helper alleen zijn bruikbare stukje. Piet heeft een rijkere
 * eigen context-adapter in `piet-context`.
 */

import { isMarianaRunStale } from "@/lib/mariana/piet-context";
import type { MarianaLocalFeed, MarianaSignal } from "@/lib/mariana/regions/types";

export interface MarianaAgentData {
  signal: MarianaSignal | null;
  feed: MarianaLocalFeed | null;
  runAt: string | null;
}

export function isFreshMarianaAgentData(data: MarianaAgentData | null): data is MarianaAgentData {
  return !!data && !isMarianaRunStale(data.runAt);
}

export function marianaKoosText(data: MarianaAgentData | null): string | null {
  if (!isFreshMarianaAgentData(data)) return null;
  const text = data.signal?.agent_outputs.koos.text?.trim();
  return text || null;
}
