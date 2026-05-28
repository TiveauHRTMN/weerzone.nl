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
    eyebrow: "Mariana AI 48-uursupdate",
    title: (placeName) => `Modelweging voor ${placeName}`,
    fallback: (placeName) => `Mariana vergelijkt voor ${placeName} HARMONIE, AROME, ECMWF, GFS, ICON-D2 en ECMWF AIFS Set X voor de komende 48 uur.`,
    confidence: "Vertrouwen",
    models: "Dominante modellen",
    risks: "Aandacht",
  },
  de: {
    eyebrow: "Mariana AI 48h-Update",
    title: (placeName) => `Modellgewichtung fuer ${placeName}`,
    fallback: (placeName) => `Mariana vergleicht fuer ${placeName} HARMONIE, AROME, ECMWF, GFS, ICON-D2 und ECMWF AIFS Set X fuer die naechsten 48 Stunden.`,
    confidence: "Vertrauen",
    models: "Fuehrende Modelle",
    risks: "Fokus",
  },
  fr: {
    eyebrow: "Mariana AI - mise a jour 48 h",
    title: (placeName) => `Ponderation des modeles pour ${placeName}`,
    fallback: (placeName) => `Mariana compare pour ${placeName} HARMONIE, AROME, ECMWF, GFS, ICON-D2 et ECMWF AIFS Set X sur les prochaines 48 heures.`,
    confidence: "Confiance",
    models: "Modeles dominants",
    risks: "Points a suivre",
  },
  es: {
    eyebrow: "Mariana AI - actualizacion 48 h",
    title: (placeName) => `Ponderacion de modelos para ${placeName}`,
    fallback: (placeName) => `Mariana compara para ${placeName} HARMONIE, AROME, ECMWF, GFS, ICON-D2 y ECMWF AIFS Set X durante las proximas 48 horas.`,
    confidence: "Confianza",
    models: "Modelos dominantes",
    risks: "Atencion",
  },
};

const REQUIRED_MODELS = ["HARMONIE", "AROME", "ECMWF", "GFS", "ICON-D2", "AIFS Set X"];

function labelModel(model: string): string {
  if (model === "ICON_D2" || model === "ICON") return "ICON-D2";
  if (model === "ECMWF_AIFS_SET_X") return "AIFS Set X";
  return model.replace(/_/g, " ");
}

export default function MarianaSeoUpdate({ weather, placeName, locale = "nl" }: Props) {
  const text = COPY[locale];
  const mariana = weather?.mariana;
  const modelLabels = mariana?.dominantModels?.length
    ? mariana.dominantModels.map((model) => labelModel(String(model)))
    : REQUIRED_MODELS;
  const risks = mariana?.risks?.length ? mariana.risks : ["48-uurs timing", "modelspreiding"];

  return (
    <section className="card p-6 border-white/10 bg-white/5" data-speakable>
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-accent-cyan mb-2">
        {text.eyebrow}
      </p>
      <h2 className="text-lg font-black text-white tracking-tight mb-3">
        {text.title(placeName)}
      </h2>
      <p className="text-sm leading-relaxed text-white/65">
        {mariana?.interpretation ?? text.fallback(placeName)}
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-black/15 border border-white/10 p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/35 mb-1">{text.confidence}</p>
          <p className="text-sm font-black text-white">{mariana?.confidence.label ?? weather?.models.label ?? "Mariana run"}</p>
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
