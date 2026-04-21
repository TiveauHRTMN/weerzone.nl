"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import type { WeatherData } from "@/lib/types";
import { matchProducts, markSeen } from "@/lib/amazon-matcher";
import { productHref, parseEmojiImage, type CatalogProduct } from "@/lib/amazon-catalog";
import { getConditionTag, getRecommendedDeals, type AffiliateDeal } from "@/lib/affiliate-orchestrator";
import { useSession } from "@/lib/session-context";

type LiveShape = {
  title?: string;
  image?: string;
  price?: string;
  oldPrice?: string;
  savings?: string;
  url?: string;
  inStock?: boolean;
  primeEligible?: boolean;
};
type EnrichedProduct = CatalogProduct & { live?: LiveShape };

// Module-level cache van live data — 1 fetch per tab-sessie, herbruikt over mounts
let liveCache: { products: EnrichedProduct[]; ts: number } | null = null;
let liveInflight: Promise<EnrichedProduct[]> | null = null;

async function fetchLive(): Promise<EnrichedProduct[]> {
  if (liveCache && Date.now() - liveCache.ts < 10 * 60 * 1000) return liveCache.products;
  if (liveInflight) return liveInflight;
  liveInflight = (async () => {
    try {
      const res = await fetch("/api/amazon/live", { cache: "force-cache" });
      if (!res.ok) return [];
      const data = await res.json() as { products: EnrichedProduct[] };
      liveCache = { products: data.products ?? [], ts: Date.now() };
      return liveCache.products;
    } catch {
      return [];
    } finally {
      liveInflight = null;
    }
  })();
  return liveInflight;
}

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
  const { tier, loading } = useSession();

  // Get our hyper-dynamic deals
  const deals = useMemo(() => getRecommendedDeals(weather, "de regio"), [weather]);
  const [hero, ...minis] = deals;

  // impressions per product
  useEffect(() => {
    if (!hero) return;
    const ids = deals.map(d => d.id);
    for (const d of deals) {
      if (impressionFired.current.has(d.id)) continue;
      impressionFired.current.add(d.id);
      fetch("/api/affiliate/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "IMPRESSION",
          tag,
          productId: d.id,
          weatherContext: { temp: weather.current.temperature },
          platform: "SITE",
          sessionId,
        }),
      }).catch(() => {});
    }
  }, [deals, hero, sessionId, tag, weather.current.temperature]);

  if (!hero) return null;
  if (loading || tier) return null;

  return (
    <section aria-label="Aanbevolen deals" className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
          <span className="text-accent-orange">LIVE DEALS</span> · GEBASEERD OP WEERDATA
        </p>
        <span className="text-[9px] text-text-muted italic underline">Check voorraad</span>
      </div>

      {/* HERO DEAL */}
      <a
        href={hero.url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative group"
        style={{
          background: "white",
          border: "2px solid #FF450015",
        }}
      >
        {/* Flash Sale Banner */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-red-600 to-orange-500 py-1 px-3 flex justify-between items-center z-20">
          <span className="text-[9px] font-black text-white uppercase tracking-tighter animate-pulse">FLASH DEAL ⚡</span>
          <span className="text-[9px] font-bold text-white/90 uppercase">{hero.badge || "NU BESCHIKBAAR"}</span>
        </div>

        <div className="flex gap-4 p-4 pt-8">
          <div className="relative w-[110px] h-[110px] rounded-xl overflow-hidden bg-black/[0.02] shrink-0 border border-black/5">
            <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-gray-50 to-gray-100">
               {hero.id.includes("rain") ? "☂️" : hero.id.includes("heat") ? "🕶️" : "📦"}
            </div>
            
            {/* Persona Badge */}
            <div className="absolute -bottom-1 -left-1 bg-black text-white text-[9px] font-black px-2 py-1 rounded-tr-lg border-t border-r border-white/20">
              {hero.persona}'S TIP
            </div>
            
            {/* Discount Stamp */}
            <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[11px] font-black w-10 h-10 flex items-center justify-center rounded-bl-xl shadow-xl rotate-6 group-hover:rotate-0 transition-transform">
              -{hero.discount}%
            </div>
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
            <div>
              <p className="text-[14px] font-black text-text-primary leading-tight line-clamp-2 uppercase tracking-tighter">
                {hero.name}
              </p>
              <p className="text-[11px] font-medium text-text-secondary italic mt-1.5 leading-tight">
                "{hero.reason}"
              </p>
            </div>
            
            <div className="mt-3 flex items-end justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] text-text-muted line-through font-bold mb-[-4px]">€{hero.originalPrice.toFixed(2)}</span>
                <span className="text-[20px] font-black text-red-600 tracking-tighter">€{hero.price.toFixed(2)}</span>
              </div>
              <div className="flex flex-col items-end">
                 <span className="text-[8px] font-black text-emerald-600 uppercase mb-1">Morgen in huis</span>
                 <div className="bg-black text-white text-[10px] font-black px-4 py-2 rounded-xl group-hover:bg-red-600 transition-colors">
                   SLA JE SLAG →
                 </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Social Proof Bar */}
        <div className="bg-gray-50 border-t border-black/5 py-1.5 px-4 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="flex -space-x-1.5">
               {[1,2,3].map(i => <div key={i} className="w-3 h-3 rounded-full bg-gray-300 border border-white" />)}
             </div>
             <span className="text-[8px] font-bold text-text-muted">+{Math.floor(Math.random() * 50) + 20} mensen kochten dit vandaag</span>
           </div>
           <span className="text-[8px] font-black text-orange-600">BEPERKTE VOORRAAD</span>
        </div>
      </a>

      {/* MINI DEALS */}
      {minis.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {minis.slice(0, 2).map((deal) => (
            <a
              key={deal.id}
              href={deal.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="group flex flex-col p-3 rounded-2xl bg-white border border-black/5 hover:border-orange-500/30 transition-all hover:shadow-lg"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="bg-red-100 text-red-600 text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm">-{deal.discount}%</span>
                <span className="text-[10px] font-black text-text-primary">€{deal.price.toFixed(2)}</span>
              </div>
              <p className="text-[10px] font-bold text-text-secondary leading-tight line-clamp-2 uppercase">
                {deal.name}
              </p>
              <div className="mt-2 text-[8px] font-black text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity">KOOP NU →</div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
