import type { Metadata } from "next";
import { hreflangSelf } from "@/lib/hreflang";
import { getSavedLocationServer } from "@/lib/location-cookies";
import { findGetawayPicks } from "@/lib/koos-getaway";
import { koosVoice } from "@/lib/koos-voice";
import { buildKoosView } from "@/lib/koos-view";
import KoosTravelPage from "@/components/KoosTravelPage";
import "./koos-skin.css";

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

  const { origin: originOutlook, picks } = await findGetawayPicks(origin);
  const intro =
    picks.length > 0 ? await koosVoice(origin, picks.map((p) => p.opportunity)) : null;
  const view = buildKoosView(origin.name, originOutlook, picks, intro);

  return <KoosTravelPage view={view} />;
}
