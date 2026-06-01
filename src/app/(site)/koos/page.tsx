import type { Metadata } from "next";
import WeerzoneBackground from "@/components/WeerzoneBackground";
import { hreflangSelf } from "@/lib/hreflang";
import { getSavedLocationServer } from "@/lib/location-cookies";
import { findGetaways, koosTemplateLine } from "@/lib/koos-getaway";
import { koosVoice } from "@/lib/koos-voice";

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
  const getaways = await findGetaways(origin);
  const intro = getaways.length > 0 ? await koosVoice(origin, getaways) : null;

  return (
    <>
      <WeerzoneBackground />
      <main className="relative z-10 mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-5 py-16 text-center text-white">
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight drop-shadow-sm">
          Koos
        </h1>
        <p className="mt-3 text-lg text-white/85">Als je eropuit wilt.</p>

        {intro ? (
          <p className="mt-8 max-w-md text-base leading-relaxed text-white/90">
            {intro}
          </p>
        ) : null}

        {getaways.length === 0 ? (
          <p className="mt-10 max-w-sm text-base text-white/80">
            Thuis zit je de komende dagen prima. Koos houdt het in de gaten en
            zegt het zodra er ergens iets beters opduikt.
          </p>
        ) : (
          <ul className="mt-10 w-full space-y-3 text-left">
            {getaways.map((op) => (
              <li
                key={op.targetLocationId}
                className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur-sm"
              >
                <p className="text-base font-semibold text-white">
                  {op.targetName}
                </p>
                <p className="mt-1 text-sm text-white/80">
                  {koosTemplateLine(op)}
                </p>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-10 text-[11px] font-medium text-white/50">
          Koos adviseert alleen — nooit boekingen.
        </p>
      </main>
    </>
  );
}
