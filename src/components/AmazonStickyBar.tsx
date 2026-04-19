"use client";

/**
 * Sticky mobile bottom-bar met één weer-relevant Amazon-product.
 * Alleen zichtbaar op mobiel (md:hidden). Dismissable per sessie.
 * Hoogste CTR-hack voor launch: blijft in beeld tijdens scroll.
 */

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { WeatherData } from "@/lib/types";
import { matchProducts } from "@/lib/amazon-matcher";
import { productHref, parseEmojiImage } from "@/lib/amazon-catalog";
import { getConditionTag } from "@/lib/affiliate-orchestrator";

interface Props {
  weather: WeatherData;
}

const DISMISS_KEY = "wz_sticky_amazon_dismissed";

export default function AmazonStickyBar({ weather }: Props) {
  const [dismissed, setDismissed] = useState(true); // default true → pas tonen na mount
  const [sessionId] = useState(() => Math.random().toString(36).slice(2));

  useEffect(() => {
    try {
      const d = sessionStorage.getItem(DISMISS_KEY);
      if (!d) setDismissed(false);
    } catch {
      setDismissed(false);
    }
  }, []);

  const { products } = useMemo(() => matchProducts(weather, 1), [weather]);
  const pick = products[0];

  if (dismissed || !pick) return null;

  const emoji = parseEmojiImage(pick.image);
  const tag = getConditionTag(weather);

  function onClick() {
    fetch("/api/affiliate/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "CLICK",
        tag,
        productId: pick.id,
        platform: "SITE_STICKY",
        sessionId,
      }),
    }).catch(() => {});
  }

  function onDismiss(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {}
    setDismissed(true);
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 pointer-events-none">
      <a
        href={productHref(pick)}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={onClick}
        className="pointer-events-auto flex items-center gap-3 p-2.5 rounded-2xl shadow-2xl bg-white/95 backdrop-blur-xl border border-black/10"
        style={{ paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom))" }}
      >
        <div
          className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-2xl"
          style={{
            background: emoji
              ? `linear-gradient(135deg, ${emoji.color}33, ${emoji.color}11)`
              : "rgba(0,0,0,0.04)",
          }}
        >
          {emoji ? (
            <span>{emoji.emoji}</span>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pick.image} alt="" className="w-full h-full object-cover rounded-xl" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-accent-orange leading-none mb-0.5">
            Bij dit weer · Amazon
          </p>
          <p className="text-[12px] font-extrabold text-text-primary leading-tight line-clamp-1">
            {pick.title}
          </p>
          <p className="text-[11px] text-text-secondary leading-tight line-clamp-1">
            {pick.priceHint ?? pick.subtitle}
          </p>
        </div>
        <span className="text-[11px] font-black text-accent-orange px-2 shrink-0">Bekijk →</span>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Sluiten"
          className="p-1.5 rounded-full hover:bg-black/5 shrink-0"
        >
          <X className="w-3.5 h-3.5 text-text-muted" />
        </button>
      </a>
    </div>
  );
}
