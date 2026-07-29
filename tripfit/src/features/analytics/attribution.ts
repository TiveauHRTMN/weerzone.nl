import { z } from "zod";

const value = z.string().trim().min(1).max(160);

export const attributionSchema = z.object({
  source: value.optional(),
  medium: value.optional(),
  campaign: value.optional(),
  content: value.optional(),
  term: value.optional(),
  capturedAt: z.iso.datetime(),
});

export type Attribution = z.infer<typeof attributionSchema>;

export type AttributionState = {
  firstTouch: Attribution;
  lastTouch: Attribution;
};

export function attributionFromUrl(
  url: URL,
  capturedAt = new Date().toISOString(),
): Attribution | null {
  const candidate = attributionSchema.parse({
    source: url.searchParams.get("utm_source") ?? undefined,
    medium: url.searchParams.get("utm_medium") ?? undefined,
    campaign: url.searchParams.get("utm_campaign") ?? undefined,
    content: url.searchParams.get("utm_content") ?? undefined,
    term: url.searchParams.get("utm_term") ?? undefined,
    capturedAt,
  });
  return Object.keys(candidate).some((key) => key !== "capturedAt")
    ? candidate
    : null;
}

export function updateAttribution(
  current: AttributionState | null,
  touch: Attribution,
): AttributionState {
  return {
    firstTouch: current?.firstTouch ?? touch,
    lastTouch: touch,
  };
}

