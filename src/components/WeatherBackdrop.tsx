"use client";

/**
 * WeatherBackdrop — dunne client-wrapper om de weer-gestuurde WeatherBackground
 * (clouds/rain/sun/stars, ssr:false) op server-pagina's te kunnen plaatsen.
 * Voed met het actuele weer van de actieve locatie (weatherCode + isDay).
 */

import dynamic from "next/dynamic";

const WeatherBackground = dynamic(() => import("./WeatherBackground"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 z-0 bg-sky-300" aria-hidden />,
});

export default function WeatherBackdrop({
  weatherCode,
  isDay,
}: {
  weatherCode: number;
  isDay: boolean;
}) {
  return <WeatherBackground weatherCode={weatherCode} isDay={isDay} />;
}
