"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

export type PulseStation = {
  name: string;
  temp: number;
  weatherCode: number;
  isDay: boolean;
};

type PulseTickerProps = {
  items: PulseStation[];
  label: string;
  emoji: (code: number, isDay: boolean) => string;
  shellStyle: CSSProperties;
  labelStyle: CSSProperties;
  rightFadeStyle: CSSProperties;
  hotThreshold?: number;
  coldThreshold?: number;
  speedPxPerSecond?: number;
};

export default function PulseTicker({
  items,
  label,
  emoji,
  shellStyle,
  labelStyle,
  rightFadeStyle,
  hotThreshold = 20,
  coldThreshold = 2,
  speedPxPerSecond = 28,
}: PulseTickerProps) {
  const segmentRef = useRef<HTMLDivElement | null>(null);
  const [duration, setDuration] = useState(110);
  const duplicated = useMemo(() => [items, items], [items]);

  useEffect(() => {
    const segment = segmentRef.current;
    if (!segment) return;

    const update = () => {
      const width = segment.getBoundingClientRect().width;
      if (width > 0) {
        setDuration(Math.max(30, width / speedPxPerSecond));
      }
    };

    update();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(update);
    observer.observe(segment);
    return () => observer.disconnect();
  }, [items, speedPxPerSecond]);

  if (items.length === 0) return null;

  return (
    <div
      className="relative overflow-hidden h-9 flex items-center border-b"
      style={shellStyle}
    >
      <div
        className="absolute left-0 top-0 bottom-0 z-20 flex items-center gap-1.5 px-3 pr-5"
        style={labelStyle}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--wz-brand)] opacity-60" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--wz-brand)]" />
        </span>
        <span className="text-[10px] font-black uppercase tracking-[0.18em] whitespace-nowrap" style={{ color: "var(--wz-brand)" }}>
          {label}
        </span>
      </div>

      <div
        className="flex whitespace-nowrap"
        style={{
          width: "max-content",
          animation: "pulse-marquee var(--pulse-duration) linear infinite",
          paddingLeft: "5rem",
          ["--pulse-duration" as any]: `${duration}s`,
          willChange: "transform",
        }}
      >
        {duplicated.map((segment, segmentIndex) => (
          <div
            key={segmentIndex}
            ref={segmentIndex === 0 ? segmentRef : undefined}
            className="flex gap-5 text-[12px] whitespace-nowrap"
          >
            {segment.map((station, itemIndex) => (
              <span key={`${station.name}-${segmentIndex}-${itemIndex}`} className="flex items-center gap-1 shrink-0">
                <span>{emoji(station.weatherCode, station.isDay)}</span>
                <span style={{ color: "var(--ink-800)", fontWeight: 600 }}>{station.name}</span>
                <span
                  style={{
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                    color: station.temp > hotThreshold ? "#c07000" : station.temp < coldThreshold ? "#2563eb" : "var(--ink-600)",
                  }}
                >
                  {station.temp > 0 ? `+${station.temp}°` : `${station.temp}°`}
                </span>
              </span>
            ))}
          </div>
        ))}
      </div>

      <div
        className="absolute right-0 top-0 bottom-0 z-10 w-12 pointer-events-none"
        style={rightFadeStyle}
      />

      <style>{`
        @keyframes pulse-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
