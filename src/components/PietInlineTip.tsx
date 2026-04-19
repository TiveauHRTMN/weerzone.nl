"use client";

/**
 * Één-regelige Piet-tip met contextuele Amazon-link, onder de hoofd-commentary.
 * Kleine tekstlink, voelt natuurlijk (niet als banner).
 */

import { useMemo, useState } from "react";
import type { WeatherData } from "@/lib/types";
import { matchProducts } from "@/lib/amazon-matcher";
import { productHref } from "@/lib/amazon-catalog";
import { getConditionTag } from "@/lib/affiliate-orchestrator";

interface Props {
  weather: WeatherData;
}

function tipIntro(weather: WeatherData): string {
  const c = weather.current;
  const rainSoon = weather.hourly.slice(0, 6).reduce((a, h) => a + h.precipitation, 0);
  if (c.precipitation > 0.3 || rainSoon > 1) return "Piet's tip voor vandaag:";
  if (c.windSpeed > 45) return "Piet houdt het kort:";
  if (c.temperature >= 25) return "Piet fluistert:";
  if (c.temperature <= 2) return "Piet knipoogt:";
  return "Piet's tip:";
}

export default function PietInlineTip({ weather }: Props) {
  const { products } = useMemo(() => matchProducts(weather, 1), [weather]);
  const [sessionId] = useState(() => Math.random().toString(36).slice(2));
  const pick = products[0];
  if (!pick) return null;

  const tag = getConditionTag(weather);

  function onClick() {
    fetch("/api/affiliate/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "CLICK",
        tag,
        productId: pick.id,
        platform: "SITE_INLINE",
        sessionId,
      }),
    }).catch(() => {});
  }

  return (
    <p className="text-[13px] text-text-secondary leading-snug mb-3 relative z-10">
      <span className="font-bold text-text-primary">{tipIntro(weather)}</span>{" "}
      <a
        href={productHref(pick)}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={onClick}
        className="underline decoration-accent-orange decoration-2 underline-offset-2 font-semibold text-text-primary hover:text-accent-orange transition-colors"
      >
        {pick.title}
      </a>
      {pick.priceHint && <span className="text-text-muted"> — {pick.priceHint}</span>}
      <span className="text-[10px] text-text-muted ml-1">(Amazon · affiliate)</span>
    </p>
  );
}
