import type { WeatherData } from "@/lib/types";

type Locale = "nl" | "de" | "fr" | "es";

interface Props {
  weather?: WeatherData | null;
  placeName: string;
  locale?: Locale;
}

const COPY: Record<Locale, {
  eyebrow: string;
  title: (placeName: string) => string;
  fallback: (placeName: string) => string;
  confidence: string;
  models: string;
  risks: string;
}> = {
  nl: {
    eyebrow: "Oracle AI 48-96h Update",
    title: (placeName) => `Middellange-termijn modelweging voor ${placeName}`,
    fallback: (placeName) => `Oracle AI weegt en kalibreert voor ${placeName} de modellen ECMWF IFS, GFS en ECMWF AIFS voor de middellange termijn (48-96 uur).`,
    confidence: "Vertrouwen",
    models: "Dominante modellen",
    risks: "Aandacht & risico",
  },
  de: {
    eyebrow: "Oracle AI 48-96h Update",
    title: (placeName) => `Mittelfristige Modellgewichtung fuer ${placeName}`,
    fallback: (placeName) => `Oracle AI gewichtet und kalibriert fuer ${placeName} die Modelle ECMWF IFS, GFS und ECMWF AIFS fuer den mittelfristigen Zeitraum (48-96 Stunden).`,
    confidence: "Vertrauen",
    models: "Fuehrende Modelle",
    risks: "Fokus & Risiko",
  },
  fr: {
    eyebrow: "Oracle AI - mise a jour 48-96 h",
    title: (placeName) => `Ponderation moyenne echeance pour ${placeName}`,
    fallback: (placeName) => `Oracle AI evalue et pondere pour ${placeName} les modeles ECMWF IFS, GFS et ECMWF AIFS sur la moyenne echeance (48-96 heures).`,
    confidence: "Confiance",
    models: "Modeles dominants",
    risks: "Points a suivre",
  },
  es: {
    eyebrow: "Oracle AI - actualizacion 48-96 h",
    title: (placeName) => `Ponderacion de modelos a medio plazo para ${placeName}`,
    fallback: (placeName) => `Oracle AI analiza y calibra para ${placeName} los modelos ECMWF IFS, GFS y ECMWF AIFS durante el periodo de 48-96 horas.`,
    confidence: "Confianza",
    models: "Modelos dominantes",
    risks: "Atencion y riesgos",
  },
};

const REQUIRED_MODELS = ["AIFS Set X", "ECMWF IFS", "GFS"];

function labelModel(model: string): string {
  if (model === "ECMWF_AIFS_SET_X") return "AIFS Set X";
  if (model === "ECMWF") return "ECMWF IFS";
  return model.replace(/_/g, " ");
}

export default function OracleSeoUpdate({ weather, placeName, locale = "nl" }: Props) {
  const text = COPY[locale];
  const oracle = weather?.oracle;
  const modelLabels = oracle?.dominantModels?.length
    ? oracle.dominantModels.map((model) => labelModel(String(model)))
    : REQUIRED_MODELS;
  const risks = oracle?.risks?.length ? oracle.risks : ["Middellange termijn timing", "Modelspreiding"];

  return (
    <section className="card p-6 border-white/10 bg-white/5" data-speakable>
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-accent-cyan mb-2">
        {text.eyebrow}
      </p>
      <h2 className="text-lg font-black text-white tracking-tight mb-3">
        {text.title(placeName)}
      </h2>
      <p className="text-sm leading-relaxed text-white/65">
        {oracle?.interpretation ?? text.fallback(placeName)}
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-black/15 border border-white/10 p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/35 mb-1">{text.confidence}</p>
          <p className="text-sm font-black text-white">{oracle?.confidence.label ?? weather?.models.label ?? "Oracle run"}</p>
        </div>
        <div className="rounded-2xl bg-black/15 border border-white/10 p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/35 mb-1">{text.models}</p>
          <p className="text-sm font-black text-white">{modelLabels.slice(0, 3).join(" / ")}</p>
        </div>
        <div className="rounded-2xl bg-black/15 border border-white/10 p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/35 mb-1">{text.risks}</p>
          <p className="text-sm font-black text-white">{risks.slice(0, 2).join(" / ")}</p>
        </div>
      </div>
    </section>
  );
}
