import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { hreflangSelf } from "@/lib/hreflang";
import { getSavedLocationServer } from "@/lib/location-cookies";
import { findGetawayPicks } from "@/lib/koos-getaway";
import { koosVoice } from "@/lib/koos-voice";
import { buildKoosView } from "@/lib/koos-view";
import { fetchWeatherData } from "@/lib/weather";
import KoosTravelPage from "@/components/KoosTravelPage";
import "./koos-skin.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Koos — als je eropuit wilt",
  description:
    "Koos vergelijkt jouw plek met haalbare bestemmingen en zegt waar het de komende dagen fijner is. Alleen als er écht iets beters is.",
  alternates: {
    canonical: "https://weerzone.nl/koos",
    languages: hreflangSelf("nl", "/koos"),
  },
};

const DEFAULT_ORIGIN = { name: "De Bilt", lat: 52.1, lon: 5.18 };

export default async function KoosPage() {
  const saved = await getSavedLocationServer();
  const origin = saved ?? DEFAULT_ORIGIN;

  // Achtergrond volgt het lokale weer (dag/nacht), net als /piet en /reed.
  const [{ origin: originOutlook, picks }, currentWeather] = await Promise.all([
    findGetawayPicks(origin),
    fetchWeatherData(origin.lat, origin.lon).catch(() => undefined),
  ]);
  const intro =
    picks.length > 0 ? await koosVoice(origin, picks.map((p) => p.opportunity)) : null;
  const view = buildKoosView(origin.name, originOutlook, picks, intro);

  return (
    <KoosTravelPage
      view={view}
      fontClassName={manrope.className}
      isDay={currentWeather?.current.isDay ?? true}
    />
  );
}
