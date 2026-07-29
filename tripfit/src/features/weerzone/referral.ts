import { z } from "zod";

export const weerzoneCalorReferralSchema = z.object({
  headline: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(220),
  ctaLabel: z.string().trim().min(1).max(40),
  destinationUrl: z.url(),
  campaign: z.string().trim().min(1).max(120),
  variant: z.string().trim().min(1).max(80),
});

export type WeerzoneCalorReferral = z.infer<typeof weerzoneCalorReferralSchema>;

export function buildWeerzoneReferral(
  appUrl: string,
  variant = "variant_a",
): WeerzoneCalorReferral {
  const url = new URL("/reis-plannen", appUrl);
  url.searchParams.set("utm_source", "weerzone");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", "local_weather_pages");
  url.searchParams.set("utm_content", variant);
  return weerzoneCalorReferralSchema.parse({
    headline: "Een reis gepland?",
    description:
      "Calor stemt je dagen af op je reisdata, het lokale weer en wat er rondom je bestemming gebeurt.",
    ctaLabel: "Plan je reis",
    destinationUrl: url.toString(),
    campaign: "local_weather_pages",
    variant,
  });
}

