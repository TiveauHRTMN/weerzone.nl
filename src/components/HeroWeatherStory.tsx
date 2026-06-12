"use client";

import { useEffect, useState } from "react";

function compactStory(value: string): string {
  const sentences = value.match(/[^.!?]+[.!?]+/g)?.map((part) => part.trim()) ?? [value.trim()];
  const compact = sentences.slice(0, 2).join(" ");
  if (compact.length <= 240) return compact;
  return `${compact.slice(0, 237).trimEnd()}...`;
}

export default function HeroWeatherStory({
  initialStory,
  lat,
  lon,
  city,
  dayOffset,
}: {
  initialStory: string;
  lat: number;
  lon: number;
  city: string;
  dayOffset: 0 | 1;
}) {
  const [story, setStory] = useState(initialStory);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ lat: String(lat), lon: String(lon), city, dayOffset: String(dayOffset) });
    fetch(`/api/piet-weerbericht?${params}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((text) => { if (typeof text === "string" && text.trim()) setStory(text.trim()); })
      .catch(() => undefined);
    return () => controller.abort();
  }, [city, dayOffset, lat, lon]);

  return <p className="va-hero-story mt-5 text-[15px] font-medium leading-6 text-slate-700">{compactStory(story)}</p>;
}
