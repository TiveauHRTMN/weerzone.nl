"use client";

import { useEffect, useState } from "react";

/** Houd een vloeiend stukje van max ~4 zinnen aan, altijd eindigend op een hele
 *  zin (geen afgekapte "..."-staart). */
function compactStory(value: string): string {
  const sentences = value.match(/[^.!?]+[.!?]+/g)?.map((part) => part.trim()) ?? [value.trim()];
  let out = "";
  for (const sentence of sentences.slice(0, 4)) {
    if (out && out.length + 1 + sentence.length > 360) break;
    out = out ? `${out} ${sentence}` : sentence;
  }
  return out || value.trim();
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
