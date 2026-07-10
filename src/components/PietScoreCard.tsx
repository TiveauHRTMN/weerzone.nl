import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { loadScoreDigest, gradenTekst, type PlaceScoreDigest } from "@/lib/agents/scorecard";
import { nearestSettlement, placeRouteSlug } from "@/lib/places-data";

/** Zelfde maat als scoreVerdict (mail, ik-vorm), maar hier over Piet verteld. */
function kaartOordeel(deltaGraden: number): string {
  const diff = Math.abs(deltaGraden);
  if (diff <= 0.5) return "Strak op de graad.";
  if (diff <= 1) return "Netjes binnen de graad.";
  return `Daar zat hij ${gradenTekst(diff)}° naast — eerlijk is eerlijk.`;
}

interface PietScoreCardProps {
  province: string;
  placeSlug: string;
  placeName: string;
}

/**
 * Piets gelijk-gehad-score (handoff 2026-07-10, blok c): gisteren beloofd vs
 * gemeten, plus het lopende 30-dagen-cijfer. Pure wiskunde uit piet_scorecard;
 * geen data (eerste dagen / storing) = geen kaart. Valt terug op De Bilt
 * (landelijk) zolang de getoonde plaats zelf nog geen score heeft.
 */
export default async function PietScoreCard({ province, placeSlug, placeName }: PietScoreCardProps) {
  let digest: PlaceScoreDigest | null = null;
  let label = placeName;
  try {
    const admin = createSupabaseAdminClient();
    const all = await loadScoreDigest(admin);
    digest = all.get(`${province}/${placeSlug}`) ?? null;
    if (!digest) {
      const deBilt = nearestSettlement(52.1017, 5.1783);
      if (deBilt) {
        digest = all.get(`${deBilt.province}/${placeRouteSlug(deBilt)}`) ?? null;
        label = "Nederland";
      }
    }
  } catch {
    return null;
  }
  if (!digest?.yesterday) return null;

  const { predictedMax, measuredMax } = digest.yesterday;
  const showStats = digest.stats.days >= 7;

  return (
    <section className="va-card p-7">
      <div className="va-micro text-slate-400">Piet · gelijk gehad?</div>
      <h2 className="mt-3 text-xl font-extrabold text-slate-950">
        Gisteren beloofde Piet {label === "Nederland" ? "voor Nederland" : label} maximaal {gradenTekst(predictedMax)}°
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Het werd {gradenTekst(measuredMax)}°. {kaartOordeel(measuredMax - predictedMax)} Elke ochtend legt Piet
        zijn verwachting vast, elke avond wordt hij langs de meting gelegd.
      </p>
      {showStats ? (
        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-4xl font-extrabold text-slate-950">{digest.stats.hitRate}%</span>
          <span className="text-sm text-slate-600">
            van de afgelopen {digest.stats.days} dagen hooguit één graad ernaast
          </span>
        </div>
      ) : null}
    </section>
  );
}
