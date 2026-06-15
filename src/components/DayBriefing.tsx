import type { AgentContext } from "@/lib/agents/context";
import type { AgentPreferences } from "@/lib/agents/preferences";
import type { AirQualityData, HourlyForecast } from "@/lib/types";
import Link from "next/link";
import { getPollenLevel, getWeatherDescription, getWeatherEmoji } from "@/lib/weather";
import { formatWindowLabel, SEVERITY_LABEL } from "@/lib/knmi-warnings";
import { marianaKoosText } from "@/lib/mariana/agent-context";
import { nlCopyGuard } from "@/lib/nl-copy-guard";
import {
  blendedTemperatureSeries,
  topWeightedDisplayModel,
  parseTimingWindow,
  timingAppliesToDay,
  safeInsight,
  DISPLAY_MODEL_NUMBER,
  type PluimIntelligence,
} from "@/lib/model-blend";
import HeroWeatherStory from "@/components/HeroWeatherStory";
import RainMap from "@/components/RainMap";
import WeatherVisuals from "@/components/WeatherVisuals";

interface DayBriefingProps {
  ctx: AgentContext;
  preferences: AgentPreferences;
  dayOffset: 0 | 1;
  airQuality: AirQualityData | null;
}

type WeatherAgent = "piet" | "reed" | "koos";
type AgentDecisionState = "active" | "quiet" | "watching" | "urgent";

interface AgentDecision {
  agent: WeatherAgent;
  icon: string;
  label: string;
  state: AgentDecisionState;
  title: string;
  summary: string;
  timing: string;
  action: string;
  confidence: string;
  enabled: boolean;
}

const DAYPARTS = [
  { label: "Nacht", start: 0, end: 6 },
  { label: "Ochtend", start: 6, end: 12 },
  { label: "Middag", start: 12, end: 18 },
  { label: "Avond", start: 18, end: 24 },
] as const;

function average(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function hourNumber(time: string): number {
  return Number(time.slice(11, 13));
}

function timeLabel(time: string): string {
  return new Date(time).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}

function confidenceLabel(agreement: number): string {
  if (agreement >= 80) return "Hoog";
  if (agreement >= 60) return "Redelijk";
  return "Beperkt";
}

function confidenceWord(agreement: number): string {
  if (agreement >= 80) return "hoog";
  if (agreement >= 60) return "redelijk";
  return "beperkt";
}

function compactCopy(value: string | null | undefined, maxSentences = 2): string | null {
  if (!value?.trim()) return null;
  const guarded = nlCopyGuard(value);
  const sentences = guarded.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [guarded];
  return sentences.slice(0, maxSentences).join(" ").trim();
}

function cascadeAgreement(ctx: AgentContext): number {
  const mariana = ctx.mariana?.signal?.confidence;
  const operational = mariana
    ? average([mariana.temperature, mariana.rain, mariana.wind, mariana.timing, mariana.local_detail]) * 100
    : null;
  const convective = ctx.tesla?.confidence.model_agreement
    ? ctx.tesla.confidence.model_agreement * 100
    : null;
  const available = [operational, convective].filter((value): value is number => value !== null && value > 0);
  return Math.round(available.length ? average(available) : ctx.weather.models.agreement);
}

function teslaTimingLabel(timingWindow: string): string | null {
  const window = parseTimingWindow(timingWindow);
  if (!window) return null;
  return `tussen ${String(window.fromHour).padStart(2, "0")}:00 en ${String(window.toHour).padStart(2, "0")}:00`;
}

function rainSummary(hours: HourlyForecast[], total: number): string {
  const wet = hours.filter((hour) => hour.precipitation >= 0.1 || (hour.weatherCode >= 51 && hour.weatherCode <= 82));
  if (!wet.length || total < 0.2) return "Het blijft naar verwachting meestal droog.";
  const first = wet[0];
  const peak = wet.reduce((best, hour) => hour.precipitation > best.precipitation ? hour : best, wet[0]);
  if (wet.length <= 2) return `De grootste kans op regen ligt rond ${timeLabel(first.time)}.`;
  return `Regen is vooral mogelijk vanaf ${timeLabel(first.time)}, met het natste moment rond ${timeLabel(peak.time)}.`;
}

function clothingAdvice(min: number, max: number, wind: number, rain: number): string {
  const parts: string[] = [];
  if (max < 10) parts.push("een warme jas");
  else if (min < 14) parts.push("een extra laag voor de koelere uren");
  else if (max >= 27) parts.push("luchtige kleding en voldoende water");
  else parts.push("gewone kleding voor het seizoen");
  if (wind >= 35) parts.push("iets dat de wind tegenhoudt");
  if (rain >= 1) parts.push("een regenjas binnen handbereik");
  return `Kies voor ${parts.join(" en ")}.`;
}

function riskForDay(ctx: AgentContext, hours: HourlyForecast[], date: string, maxTemp: number, dayOffset: 0 | 1) {
  const warning = ctx.knmi.find((item) => {
    if (!item.validFrom || !item.validUntil) return true;
    return item.validFrom.slice(0, 10) <= date && item.validUntil.slice(0, 10) >= date;
  });
  const maxWind = Math.max(0, ...hours.map((hour) => hour.windSpeed ?? 0));
  const maxRain = Math.max(0, ...hours.map((hour) => hour.precipitation ?? 0));
  const thunder = hours.find((hour) => hour.weatherCode >= 95 || hour.cape >= 800);
  const fog = hours.find((hour) => hour.weatherCode === 45 || hour.weatherCode === 48);
  const ice = hours.find((hour) => [56, 57, 66, 67].includes(hour.weatherCode) || (hour.temperature <= 0 && hour.precipitation > 0));

  if (warning) {
    const timing = formatWindowLabel(warning);
    return {
      meaningful: true,
      title: `${SEVERITY_LABEL[warning.severity]} voor ${warning.type.toLowerCase()}`,
      text: `${warning.description || "Er geldt een officiële waarschuwing voor jouw regio."}${timing ? ` Het belangrijkste tijdvak is ${timing.toLowerCase()}.` : ""}`,
      impact: "Pas buitenplannen en reistijd aan en controleer de waarschuwing vlak voor vertrek.",
    };
  }
  const tesla = ctx.tesla;
  const teslaRisk = tesla && timingAppliesToDay(tesla.timing_window, dayOffset) && (
    tesla.tesla_signal >= 2 || tesla.confidence.thunder >= 0.4 || tesla.confidence.severe >= 0.3
  );
  if (teslaRisk) {
    const timing = teslaTimingLabel(tesla.timing_window);
    const confidence = Math.round(Math.max(tesla.confidence.thunder, tesla.confidence.severe) * 100);
    const impact = tesla.reed_action === "ABORT" || tesla.reed_action === "COMMIT"
      ? "Vermijd open terrein en water tijdens de risicoperiode en pas buitenplannen aan."
      : tesla.reed_action === "SHIFT"
        ? "Verschuif buitenplannen naar een rustiger moment en controleer de radar voor vertrek."
        : "Controleer de radar vlak voor vertrek; de precieze plek en timing kunnen nog veranderen.";
    return {
      meaningful: true,
      title: tesla.tesla_signal >= 3 ? "Zwaar onweer kan je planning raken" : "Onweer vraagt extra aandacht",
      text: `${timing ? `De duidelijkste periode ligt ${timing}.` : "Het precieze tijdvak is nog onzeker."} De kans dat onweer ontstaat wordt op ongeveer ${confidence}% ingeschat.`,
      impact,
    };
  }
  if (thunder) return { meaningful: true, title: "Onweer kan je planning raken", text: `Het duidelijkste onweerssignaal ligt rond ${timeLabel(thunder.time)}. De onzekerheid blijft aanwezig, dus controleer kort voor vertrek opnieuw.`, impact: "Vermijd open terrein en water zodra je donder hoort." };
  if (maxRain >= 5) return { meaningful: true, title: "Plaatselijk veel regen in korte tijd", text: `Rond het natste uur kan ongeveer ${maxRain.toFixed(1)} mm vallen. Daardoor kunnen zicht en reistijd tijdelijk verslechteren.`, impact: "Plan extra reistijd en kies waar mogelijk een droger uur." };
  if (maxWind >= 55) return { meaningful: true, title: "Stevige wind vraagt aandacht", text: `De wind kan oplopen tot ongeveer ${Math.round(maxWind)} km/u. Vooral fietsen, open plekken en losse spullen kunnen daar last van hebben.`, impact: "Zet losse spullen vast en kies een beschutte route." };
  if (fog) return { meaningful: true, title: "Mist kan het zicht beperken", text: `Rond ${timeLabel(fog.time)} kan het zicht plaatselijk minder zijn. Dat kan vooral onderweg extra tijd kosten.`, impact: "Vertrek rustiger en houd meer afstand." };
  if (ice) return { meaningful: true, title: "Kans op plaatselijke gladheid", text: `Rond ${timeLabel(ice.time)} komen kou en neerslag samen. Bruggen en fietspaden kunnen dan het eerst glad worden.`, impact: "Pas snelheid en vertrektijd aan." };
  if (maxTemp >= 30) return { meaningful: true, title: "Hitte is het belangrijkste risico", text: `Met ongeveer ${Math.round(maxTemp)} graden wordt zware inspanning midden op de dag minder verstandig.`, impact: "Plan inspanning vroeg of later en drink voldoende." };
  return {
    meaningful: false,
    title: "Geen opvallend weerrisico",
    text: `Er staat geen waarschuwing voor jouw regio klaar. Ook blijven onweer, zware regen en harde wind in het 48-uursbeeld onder de relevante grenzen.`,
    impact: `De verwachting is redelijk stabiel; de grootste onzekerheid zit in lokale timing, niet in zwaar weer.`,
  };
}

function choiceForDay(ctx: AgentContext, hours: HourlyForecast[], maxTemp: number) {
  const usable = hours.filter((hour) => hourNumber(hour.time) >= 7 && hourNumber(hour.time) <= 22);
  const scored = usable.map((hour) => ({
    hour,
    score: 100 - hour.precipitation * 18 - Math.max(0, hour.windSpeed - 25) - Math.max(0, hour.temperature - 27) * 5,
  })).sort((a, b) => b.score - a.score);
  const best = scored[0]?.hour;
  const averageRain = average(usable.map((hour) => hour.precipitation));
  const marianaAdvice = compactCopy(marianaKoosText(ctx.mariana), 2);
  if (!best) return { title: "Houd je huidige plan aan", text: marianaAdvice ?? "Er is te weinig uurinformatie om een beter moment aan te wijzen. Controleer de pagina later nog eens." };
  if (maxTemp >= 28) return { title: "Ga vroeg of later op pad", text: marianaAdvice ?? `Rond ${timeLabel(best.time)} zijn temperatuur, wind en regenkans het gunstigst. Vermijd voor inspanning vooral de warmste middaguren.` };
  if (averageRain >= 0.3) return { title: `Het beste buitenmoment ligt rond ${timeLabel(best.time)}`, text: marianaAdvice ?? "Dat uur is binnen deze dag de beste combinatie van weinig regen, beperkte wind en een bruikbare temperatuur." };
  return { title: "Je hoeft niet uit te wijken", text: marianaAdvice ?? `Rond ${timeLabel(best.time)} is het buiten het prettigst, maar het verschil met de rest van de dag is klein. Lokaal blijven en je huidige plan aanhouden is daarom logisch.` };
}

function pollenForDay(airQuality: AirQualityData | null, date: string) {
  const rows = airQuality?.hourly.filter((row) => row.time.slice(0, 10) === date) ?? [];
  const peak = (key: "grass" | "birch" | "alder" | "mugwort") => Math.max(0, ...rows.map((row) => row[key] ?? 0));
  const grass = getPollenLevel(peak("grass"), "grass");
  const treePeak = Math.max(peak("birch"), peak("alder"), peak("mugwort"));
  const tree = getPollenLevel(treePeak, "tree");
  const strongest = grass.level >= tree.level ? { name: "Graspollen", ...grass } : { name: "Boom- en kruidpollen", ...tree };
  return rows.length ? `${strongest.name}: ${strongest.label.toLowerCase()}.` : "Geen actuele pollenmeting beschikbaar.";
}

function reedStateForTitle(title: string, meaningful: boolean): AgentDecisionState {
  if (!meaningful) return "quiet";
  const t = title.toLowerCase();
  if (t.includes("code rood") || t.includes("code oranje") || t.includes("zwaar")) return "urgent";
  return "watching";
}

function shortTiming(text: string, fallback: string): string {
  const first = text.split(".")[0]?.trim();
  if (!first) return fallback;
  return first.length > 82 ? `${first.slice(0, 79).trim()}...` : first;
}

function buildAgentDecisions(input: {
  preferences: AgentPreferences;
  label: string;
  pietAdvice: string;
  risk: ReturnType<typeof riskForDay>;
  choice: ReturnType<typeof choiceForDay>;
  agreement: number;
}): AgentDecision[] {
  const { preferences, label, pietAdvice, risk, choice, agreement } = input;
  const confidence = confidenceWord(agreement);
  const koosHasMove =
    !choice.title.toLowerCase().includes("hoeft niet uit") &&
    !choice.title.toLowerCase().includes("huidige plan");
  const reedState = reedStateForTitle(risk.title, risk.meaningful);

  return [
    {
      agent: "piet",
      icon: "P",
      label: "Piet",
      state: preferences.piet ? "active" : "quiet",
      title: preferences.piet ? "Dagadvies staat klaar" : "Dagadvies staat uit",
      summary: pietAdvice,
      timing: label === "Vandaag" ? "nu, straks en vanavond" : "morgen per dagdeel",
      action: preferences.piet ? "Gebruik dit als basis voor je dag." : "Zet Piet aan voor je dagelijkse briefing.",
      confidence,
      enabled: preferences.piet,
    },
    {
      agent: "reed",
      icon: "R",
      label: "Reed",
      state: preferences.reed ? reedState : "quiet",
      title: preferences.reed ? risk.title : "Risicobewaking staat uit",
      summary: preferences.reed ? risk.impact : "Reed kan onweer, wind, zware regen en gladheid voor je blijven volgen.",
      timing: preferences.reed ? shortTiming(risk.text, "geen bijzonder risicovenster") : "alleen na activeren",
      action: preferences.reed ? (risk.meaningful ? risk.impact : "Geen extra actie nodig; Weerzone blijft kijken.") : "Zet Reed aan voor risicosignalen.",
      confidence,
      enabled: preferences.reed,
    },
    {
      agent: "koos",
      icon: "K",
      label: "Koos",
      state: preferences.koos ? (koosHasMove ? "active" : "quiet") : "quiet",
      title: preferences.koos ? choice.title : "Planningshulp staat uit",
      summary: preferences.koos ? choice.text : "Koos kan meekijken of later, morgen of een andere plek slimmer is.",
      timing: koosHasMove ? "als je je plan kunt schuiven" : "geen duidelijke uitwijk nodig",
      action: preferences.koos ? (koosHasMove ? "Neem dit mee voordat je vertrekt." : "Blijf bij je huidige plan.") : "Zet Koos aan voor planning en alternatieven.",
      confidence,
      enabled: preferences.koos,
    },
  ];
}

function pluimIntelligence(
  ctx: AgentContext,
  preferences: AgentPreferences,
  dayOffset: 0 | 1,
  date: string,
): PluimIntelligence {
  const weights = ctx.mariana?.feed?.modelWeights ?? null;
  const blended = blendedTemperatureSeries(ctx.weather.hourly, weights);
  const leadModel = topWeightedDisplayModel(ctx.weather.hourly, weights);

  const baseInsight = safeInsight(compactCopy(
    ctx.mariana?.signal?.model_blend_summary || ctx.mariana?.signal?.local_forecast_logic,
    2,
  ));
  const leadSentence = leadModel
    ? `De doorgetrokken lijn leunt ${dayOffset === 0 ? "vandaag" : "voor morgen"} het meest op verwachting ${DISPLAY_MODEL_NUMBER[leadModel]}.`
    : null;
  // LLM-tekst eindigt niet altijd op een leesteken; zonder punt plakken de
  // twee zinnen aan elkaar.
  const normalizedBase = baseInsight ? baseInsight.trimEnd().replace(/([^.!?])$/, "$1.") : null;
  const insight = [normalizedBase, leadSentence].filter(Boolean).join(" ") || null;

  const tesla = ctx.tesla;
  const teslaRisk = Boolean(
    preferences.reed && tesla && timingAppliesToDay(tesla.timing_window, dayOffset) && (
      tesla.tesla_signal >= 2 || tesla.confidence.thunder >= 0.4 || tesla.confidence.severe >= 0.3
    ),
  );
  const window = teslaRisk && tesla ? parseTimingWindow(tesla.timing_window) : null;

  return {
    blended,
    leadModel,
    insight,
    thunderWindow: window ? { date, ...window } : null,
  };
}

export default function DayBriefing({ ctx, preferences, dayOffset, airQuality }: DayBriefingProps) {
  const daily = ctx.weather.daily[dayOffset];
  const date = daily.date;
  const hours = ctx.weather.hourly.filter((hour) => hour.time.slice(0, 10) === date);
  const label = dayOffset === 0 ? "Vandaag" : "Morgen";
  const condition = getWeatherDescription(daily.weatherCode);
  const maxWind = Math.max(daily.windSpeedMax, ...hours.map((hour) => hour.windSpeed));
  const maxRain = Math.max(0, ...hours.map((hour) => hour.precipitation));
  const dayHours = hours.filter((hour) => hourNumber(hour.time) >= 9 && hourNumber(hour.time) <= 21);
  const feels = dayHours.length
    ? average(dayHours.map((hour) => hour.apparentTemperature))
    : hours.length
      ? average(hours.map((hour) => hour.apparentTemperature))
      : dayOffset === 0 ? ctx.weather.current.feelsLike : daily.tempMax;
  const risk = riskForDay(ctx, hours, date, daily.tempMax, dayOffset);
  const choice = choiceForDay(ctx, hours, daily.tempMax);
  const pluim = pluimIntelligence(ctx, preferences, dayOffset, date);
  const rain = rainSummary(hours, daily.precipitationSum);
  const pollen = pollenForDay(airQuality, date);
  const defaultStory = `${condition} met temperaturen tussen ${Math.round(daily.tempMin)} en ${Math.round(daily.tempMax)} graden. ${rain}`;
  const synthesisParts = [`${condition}, maximaal ${Math.round(daily.tempMax)} graden`];
  if (preferences.reed && risk.meaningful) synthesisParts.push(risk.title.toLowerCase());
  if (preferences.koos) synthesisParts.push(choice.title.toLowerCase());
  const synthesis = `${synthesisParts.join("; ")}.`;
  const uvMax = daily.uvIndexMax ?? ctx.weather.uvIndex;
  const uvLabel = uvMax >= 6 ? "Hoog" : uvMax >= 3 ? "Matig" : "Laag";
  const agreement = cascadeAgreement(ctx);
  const pietAdvice = compactCopy(
    ctx.mariana?.signal?.location_output_contract.best_action
      || ctx.mariana?.signal?.agent_outputs.piet.text,
    2,
  ) ?? clothingAdvice(daily.tempMin, daily.tempMax, maxWind, daily.precipitationSum);
  const agentDecisions = buildAgentDecisions({ preferences, label, pietAdvice, risk, choice, agreement });

  return (
    <div className="va-stagger va-page relative z-10 mx-auto max-w-[820px] space-y-7 px-4 py-9 sm:px-6 sm:py-14">
      <header className="va-card va-hero p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <nav className="va-day-toggle" aria-label="Vandaag of morgen">
            <Link href="/vandaag" className={dayOffset === 0 ? "is-active" : ""}>Vandaag</Link>
            <Link href="/morgen" className={dayOffset === 1 ? "is-active" : ""}>Morgen</Link>
          </nav>
        </div>
        <div className="va-micro text-slate-400">Weerzone · {label}</div>
        <div className="mt-4 flex items-center justify-between gap-5">
          <div className="min-w-0">
            <h1 className="text-[34px] font-extrabold leading-none tracking-[-0.035em] text-slate-950 sm:text-[46px]">
              {dayOffset === 0 ? Math.round(ctx.weather.current.temperature) : Math.round(daily.tempMax)}° in {ctx.location.name}
            </h1>
            <p className="mt-2 text-sm font-bold text-slate-600">{condition} · {Math.round(daily.tempMin)}° tot {Math.round(daily.tempMax)}°</p>
          </div>
          <span className="va-weather-orb shrink-0 text-5xl sm:text-6xl" aria-label={condition}>
            {getWeatherEmoji(daily.weatherCode, true)}
          </span>
        </div>
        <div className="va-one-line mt-5"><span>{label} in één zin</span><strong>{synthesis}</strong></div>
        <HeroWeatherStory initialStory={defaultStory} lat={ctx.location.lat} lon={ctx.location.lon} city={ctx.location.name} dayOffset={dayOffset} />
        <div className="va-hero-metrics mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          <div><span>Regenpiek</span><strong>{maxRain.toFixed(1)} mm/u</strong></div>
          <div><span>Wind</span><strong>{Math.round(maxWind)} km/u</strong></div>
          <div><span>Zekerheid</span><strong>{agreement}%</strong></div>
        </div>
      </header>

      {dayOffset === 0 && <RainMap lat={ctx.location.lat} lon={ctx.location.lon} />}

      <section className="space-y-3">
        <div className="va-section-head px-1">
          <div><span className="va-onsky va-micro">Drie blikken vooruit</span><h2>Piet, Reed en Koos</h2></div>
          <span className="va-section-number">01</span>
        </div>
        <div className="va-agent-strip grid gap-3 lg:grid-cols-3">
          {agentDecisions.map((decision) => (
            <article
              key={decision.agent}
              id={decision.agent}
              className={`va-card va-agent-tile is-${decision.state} ${decision.enabled ? "" : "is-muted"} scroll-mt-24 p-4 sm:p-5`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="va-agent-mark" aria-hidden>{decision.icon}</span>
                  <div className="min-w-0">
                    <span className="va-chip"><span className={`va-dot ${decision.state === "urgent" ? "is-urgent" : ""}`} />{decision.label}</span>
                    <h3>{decision.title}</h3>
                  </div>
                </div>
                <span className={`va-state-pill is-${decision.state}`}>
                  {decision.state === "quiet" ? "Rustig" : decision.state === "watching" ? "Let op" : decision.state === "urgent" ? "Urgent" : "Actief"}
                </span>
              </div>
              <p>{decision.summary}</p>
              <dl className="va-agent-ops">
                <div><dt>Timing</dt><dd>{decision.timing}</dd></div>
                <div><dt>Actie</dt><dd>{decision.action}</dd></div>
                <div><dt>Zekerheid</dt><dd>{decision.confidence}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="va-section-head px-1">
          <div><span className="va-onsky va-micro">Van uur tot uur</span><h2>Zo verloopt je dag</h2></div>
          <span className="va-section-number">02</span>
        </div>
        <div className="va-daypart-grid grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DAYPARTS.map((part) => {
            const partHours = hours.filter((hour) => hourNumber(hour.time) >= part.start && hourNumber(hour.time) < part.end);
            if (!partHours.length) return null;
            const wettest = Math.max(0, ...partHours.map((hour) => hour.precipitation));
            const representative = partHours[Math.floor(partHours.length / 2)];
            return (
              <article key={part.label} className="va-card va-daypart p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <div><div className="va-micro text-slate-400">{part.label}</div><strong>{Math.round(average(partHours.map((hour) => hour.temperature)))}°</strong></div>
                  <span className="text-3xl" aria-hidden>{getWeatherEmoji(representative.weatherCode, part.start >= 6 && part.start < 18)}</span>
                </div>
                <div className="va-daypart-foot"><span>{getWeatherDescription(representative.weatherCode)}</span><span>{wettest >= 0.2 ? `🌧 ${timeLabel(partHours.find((hour) => hour.precipitation === wettest)?.time ?? representative.time)}` : "Droog"}</span></div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="va-section-head px-1">
          <div><span className="va-onsky va-micro">Nog even controleren</span><h2>Details voor je planning</h2></div>
          <span className="va-section-number">03</span>
        </div>
        <article className="va-card va-facts-grid grid grid-cols-2 sm:grid-cols-3">
          {[
            ["💨", "Wind", `${Math.round(maxWind)} km/u`],
            ["🌧️", "Regen", `${daily.precipitationSum.toFixed(1)} mm`],
            ["🌡️", "Gevoel", `${Math.round(feels)}°`],
            ["☀️", "UV", `${uvLabel} · ${Math.round(uvMax)}`],
            ["🌿", "Pollen", pollen.replace(/\.$/, "")],
            ["🎯", "Zekerheid", `${agreement}% · ${confidenceLabel(agreement)}`],
          ].map(([icon, title, value]) => (
            <div key={title}><span>{icon}</span><small>{title}</small><strong>{value}</strong></div>
          ))}
        </article>
      </section>

      <WeatherVisuals weather={ctx.weather} lat={ctx.location.lat} lon={ctx.location.lon} locationName={ctx.location.name} dayOffset={dayOffset} reedEnabled={preferences.reed} pluim={pluim} />
    </div>
  );
}
