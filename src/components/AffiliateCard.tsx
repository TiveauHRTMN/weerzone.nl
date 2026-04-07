"use client";

import type { WeatherData } from "@/lib/types";

interface Props {
  variant: "weather" | "generic";
  weather: WeatherData;
}

interface AffiliateItem {
  emoji: string;
  title: string;
  description: string;
  cta: string;
  href: string;
}

function getWeatherAffiliates(weather: WeatherData): AffiliateItem[] {
  const items: AffiliateItem[] = [];
  const temp = weather.current.temperature;
  const rain = weather.current.precipitation > 0 || weather.hourly.some(h => h.precipitation > 0.5);
  const cold = temp < 10;
  const hot = temp > 25;
  const windy = weather.current.windSpeed > 30;

  if (rain) {
    items.push({
      emoji: "☂️",
      title: "Regenjas nodig?",
      description: "Top regenjassen voor fietsers. Droog blijven in Nederlands weer.",
      cta: "Bekijk regenjassen",
      href: "#regenjas",
    });
    items.push({
      emoji: "🌂",
      title: "Stormparaplu",
      description: "Bestand tegen windstoten tot 100 km/h. Gemaakt voor Nederland.",
      cta: "Bekijk paraplu's",
      href: "#paraplu",
    });
  }

  if (cold) {
    items.push({
      emoji: "🧣",
      title: "Warm blijven?",
      description: "Merino wollen thermokleding. Warm zonder bulk.",
      cta: "Bekijk thermokleding",
      href: "#thermokleding",
    });
  }

  if (hot) {
    items.push({
      emoji: "🧴",
      title: "Zonnebrand",
      description: `UV-index ${weather.uvIndex.toFixed(0)} vandaag. Bescherm je huid.`,
      cta: "Bekijk zonnebrand",
      href: "#zonnebrand",
    });
    items.push({
      emoji: "😎",
      title: "Zonnebril",
      description: "Gepolariseerde glazen. Stijlvol en beschermend.",
      cta: "Bekijk zonnebrillen",
      href: "#zonnebril",
    });
  }

  if (windy) {
    items.push({
      emoji: "🧥",
      title: "Windbreaker",
      description: "Lichtgewicht windbreakers. Perfect voor deze wind.",
      cta: "Bekijk windbreakers",
      href: "#windbreaker",
    });
  }

  // Fallback
  if (items.length === 0) {
    items.push({
      emoji: "🚴",
      title: "Fietsaccessoires",
      description: "Lekker weer om te fietsen! Upgrade je fietsuitrusting.",
      cta: "Bekijk accessoires",
      href: "#fiets",
    });
  }

  return items;
}

const GENERIC_AFFILIATES: AffiliateItem[] = [
  {
    emoji: "📱",
    title: "Weerstation voor thuis",
    description: "Je eigen KNMI. Temperatuur, luchtvochtigheid, wind — realtime op je telefoon.",
    cta: "Bekijk weerstations",
    href: "#weerstation",
  },
  {
    emoji: "🏕️",
    title: "Outdoor gear",
    description: "Weerbestendig op pad. Van Gore-Tex tot UV-kleding.",
    cta: "Bekijk outdoor gear",
    href: "#outdoor",
  },
  {
    emoji: "☕",
    title: "Thuisblijfpakket",
    description: "Kutweer buiten? Netflix-deken, warme choco, en geurkaarsen.",
    cta: "Bekijk pakketten",
    href: "#thuisblijf",
  },
];

export default function AffiliateCard({ variant, weather }: Props) {
  const items = variant === "weather" ? getWeatherAffiliates(weather) : GENERIC_AFFILIATES;
  const item = items[Math.floor(Date.now() / 60000) % items.length];

  return (
    <a
      href={item.href}
      className="card p-4 flex items-center gap-4 group cursor-pointer border-dashed! border-black/10 hover:border-accent-orange/30"
      target="_blank"
      rel="noopener noreferrer sponsored"
    >
      <div className="w-12 h-12 rounded-xl bg-accent-orange/10 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
        {item.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-bold text-text-primary">{item.title}</span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted bg-black/5 px-1.5 py-0.5 rounded">Affiliate</span>
        </div>
        <p className="text-xs text-text-muted leading-relaxed">{item.description}</p>
      </div>
      <div className="shrink-0">
        <span className="text-xs font-bold text-accent-orange group-hover:underline whitespace-nowrap">{item.cta} →</span>
      </div>
    </a>
  );
}
