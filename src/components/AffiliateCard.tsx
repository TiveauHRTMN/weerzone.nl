"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import type { WeatherData } from "@/lib/types";
import { matchProducts, markSeen } from "@/lib/amazon-matcher";
import { productHref, parseEmojiImage, type CatalogProduct } from "@/lib/amazon-catalog";
import { getConditionTag } from "@/lib/affiliate-orchestrator";

interface Props {
  weather: WeatherData;
}

function ProductImage({ src, alt, size = 100 }: { src: string; alt: string; size?: number }) {
  const emoji = parseEmojiImage(src);
  if (emoji) {
    return (
      <div
        className="w-full h-full flex items-center justify-center rounded-xl"
        style={{ background: `linear-gradient(135deg, ${emoji.color}33, ${emoji.color}11)`, fontSize: size * 0.5 }}
        aria-label={alt}
        role="img"
      >
        <span style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }}>{emoji.emoji}</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="w-full h-full object-cover"
      referrerPolicy="no-referrer"
    />
  );
}

export default function AffiliateCard({ weather }: Props) {
  const [sessionId] = useState(() => Math.random().toString(36).slice(2));
  const impressionFired = useRef<Set<string>>(new Set());
  const tag = getConditionTag(weather);

  // Match loopt opnieuw zodra weather verandert (SWR-update uit cache)
  const { products, ctx } = useMemo(() => matchProducts(weather, 3), [weather]);
  const [hero, mini1, mini2] = products;

  const weatherContext = {
    temp: weather.current.temperature,
    rain: weather.current.precipitation,
    wind: weather.current.windSpeed,
    code: weather.current.weatherCode,
  };

  // impressions per product
  useEffect(() => {
    const ids = products.map(p => p.id);
    markSeen(ids);
    for (const p of products) {
      if (impressionFired.current.has(p.id)) continue;
      impressionFired.current.add(p.id);
      fetch("/api/affiliate/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "IMPRESSION",
          tag,
          productId: p.id,
          weatherContext,
          platform: "SITE",
          sessionId,
        }),
      }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  function click(p: CatalogProduct) {
    fetch("/api/affiliate/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "CLICK",
        tag,
        productId: p.id,
        weatherContext,
        platform: "SITE",
        sessionId,
      }),
    }).catch(() => {});
  }

  if (!hero) return null;

  // Contextregel — waarom deze selectie
  const reason = (() => {
    const t = ctx.tags;
    if (t.has("storm")) return `Wind tot ${Math.round(ctx.summary.windMax)} km/u`;
    if (t.has("rain_now")) return "Het regent nu";
    if (t.has("rain_heavy")) return `${ctx.summary.rain48h.toFixed(0)}mm regen komende 48u`;
    if (t.has("rain_soon")) return "Regen op komst";
    if (t.has("extreme_cold")) return `Tot ${Math.round(ctx.summary.temp)}° — strenge vorst`;
    if (t.has("freezing")) return "Vorst verwacht";
    if (t.has("heatwave")) return `${Math.round(ctx.summary.temp)}° — hittegolf`;
    if (t.has("hot")) return `${Math.round(ctx.summary.temp)}° — tropisch warm`;
    if (t.has("uv_extreme")) return `UV ${ctx.summary.uv.toFixed(1)} — extreem`;
    if (t.has("uv_high")) return `UV ${ctx.summary.uv.toFixed(1)} — hoog`;
    if (t.has("thunder")) return "Onweerskans";
    if (t.has("snow")) return "Sneeuw verwacht";
    if (t.has("fog")) return "Mist";
    if (t.has("windy")) return `Wind tot ${Math.round(ctx.summary.windMax)} km/u`;
    if (t.has("perfect")) return `${Math.round(ctx.summary.temp)}° en droog — prachtweer`;
    return `${Math.round(ctx.summary.temp)}° — ${ctx.summary.season}`;
  })();

  return (
    <section aria-label="Aanbevolen bij dit weer" className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
          Bij dit weer · <span className="text-accent-orange">{reason}</span>
        </p>
        <span className="text-[9px] text-text-muted">Amazon · Advertentie</span>
      </div>

      {/* HERO */}
      <a
        href={productHref(hero)}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={() => click(hero)}
        className="block rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
        style={{
          background: "rgba(255,255,255,0.85)",
          border: "1px solid rgba(0,0,0,0.06)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex gap-4 p-4">
          <div className="relative w-[100px] h-[100px] rounded-xl overflow-hidden bg-black/[0.03] shrink-0">
            <ProductImage src={hero.image} alt={hero.title} size={100} />
            {hero.badge && (
              <span className="absolute top-1.5 left-1.5 text-[9px] font-bold uppercase tracking-wide bg-accent-orange text-text-primary px-2 py-0.5 rounded-full shadow-sm">
                {hero.badge}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
            <div>
              <p className="text-[13px] font-extrabold text-text-primary leading-tight line-clamp-2">
                {hero.title}
              </p>
              <p className="text-[11px] text-text-secondary mt-1 leading-snug line-clamp-2">
                {hero.subtitle}
              </p>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-black text-text-primary">{hero.priceHint}</span>
                {hero.oldPrice && (
                  <span className="text-[11px] text-text-muted line-through">{hero.oldPrice}</span>
                )}
              </div>
              <span className="text-[10px] font-bold text-accent-orange">Bekijk →</span>
            </div>
          </div>
        </div>
      </a>

      {/* MINIS */}
      {(mini1 || mini2) && (
        <div className="grid grid-cols-2 gap-2">
          {[mini1, mini2].filter(Boolean).map((p) => (
            <a
              key={p!.id}
              href={productHref(p!)}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={() => click(p!)}
              className="flex gap-2.5 p-2.5 rounded-xl transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{
                background: "rgba(255,255,255,0.72)",
                border: "1px solid rgba(0,0,0,0.05)",
                backdropFilter: "blur(8px)",
              }}
            >
              <div className="w-[52px] h-[52px] rounded-lg overflow-hidden bg-black/[0.03] shrink-0">
                <ProductImage src={p!.image} alt={p!.title} size={52} />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <p className="text-[11px] font-bold text-text-primary leading-tight line-clamp-2">
                  {p!.title}
                </p>
                <p className="text-[10px] font-black text-text-primary mt-0.5">{p!.priceHint}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
