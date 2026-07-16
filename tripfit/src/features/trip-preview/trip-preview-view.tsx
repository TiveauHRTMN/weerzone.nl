import Link from "next/link";

import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckIcon,
  CompassIcon,
  InfoIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SparkIcon,
  UsersIcon,
} from "@/components/ui/icons";
import type { TripPhase } from "@/domain/trips/model";
import { SaveTripButton } from "@/features/trip-save/save-trip-button";

import type {
  PreviewRecommendation,
  TripPreview,
} from "./build-trip-preview";

const phaseLabels: Record<TripPhase, string> = {
  PLANNING_LONG_RANGE: "Lange termijn",
  PLANNING_SUBSEASONAL: "Seizoensbeeld",
  PLANNING_FORECAST: "Weervenster",
  IN_TRIP: "Tijdens je reis",
  COMPLETED: "Reisarchief",
};

const seasonLabels = {
  PEAK: "Piekmoment",
  AVAILABLE: "Beschikbaar",
  LIMITED: "Beperkt",
  UNAVAILABLE: "Niet beschikbaar",
} as const;

const timingLabels = {
  PAST: "Voorbij",
  CURRENT: "Nu",
  UPCOMING: "Komt eraan",
} as const;

function formatDate(date: string, includeYear = false) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    ...(includeYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

function formatReviewedAt(date: string) {
  const normalized = date.includes("T") ? date : `${date}T12:00:00Z`;
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(normalized));
}

function RecommendationCard({
  recommendation,
  featured = false,
}: {
  recommendation: PreviewRecommendation;
  featured?: boolean;
}) {
  return (
    <article
      className={`flex h-full flex-col rounded-2xl border p-5 sm:p-6 ${
        featured
          ? "vlamrand overflow-hidden border-ink bg-ink text-white shadow-[var(--shadow-live)]"
          : "border-line bg-white text-ink"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <span
          className={`rounded-full px-2.5 py-1 text-[0.66rem] font-bold uppercase tracking-[0.1em] ${
            featured
              ? "bg-white/10 text-sun"
              : recommendation.seasonStatus === "PEAK"
                ? "bg-sun/20 text-ink"
                : "bg-surface text-muted"
          }`}
        >
          {seasonLabels[recommendation.seasonStatus]}
        </span>
        <span
          className={`text-right text-xs font-bold tabular ${
            featured ? "text-white/70" : "text-muted"
          }`}
        >
          Relevantie {recommendation.score}
        </span>
      </div>

      <p
        className={`mt-6 text-[0.68rem] font-bold uppercase tracking-[0.12em] ${
          featured ? "text-white/45" : "text-muted"
        }`}
      >
        {recommendation.regionName}
        {recommendation.destinationClusterName
          ? ` · ${recommendation.destinationClusterName}`
          : ""}
      </p>
      <h3 className="mt-2 text-xl font-[760] tracking-[-0.035em]">
        {recommendation.title}
      </h3>
      <p
        className={`mt-3 text-sm leading-6 ${
          featured ? "text-white/65" : "text-muted"
        }`}
      >
        {recommendation.shortDescription}
      </p>

      <div
        className={`mt-6 border-t pt-5 ${
          featured ? "border-white/10" : "border-line"
        }`}
      >
        <p
          className={`text-xs font-bold ${featured ? "text-white/80" : "text-ink"}`}
        >
          Waarom voor deze reis?
        </p>
        <ul className="mt-3 space-y-2.5">
          {recommendation.relevanceReasons.slice(0, 3).map((reason) => (
            <li
              key={reason}
              className={`flex gap-2 text-xs leading-5 ${
                featured ? "text-white/65" : "text-muted"
              }`}
            >
              <CheckIcon
                className={`mt-0.5 size-3.5 shrink-0 ${
                  featured ? "text-sun" : "text-ink"
                }`}
                aria-hidden="true"
              />
              {reason}
            </li>
          ))}
        </ul>
      </div>

      <div
        className={`mt-auto flex items-center justify-between gap-3 pt-6 text-[0.68rem] font-semibold ${
          featured ? "text-white/50" : "text-muted"
        }`}
      >
        <span>Familie-fit {recommendation.familyFit}/100</span>
        <span>Indicatieve preview</span>
      </div>

      {recommendation.bookingAdvice ? (
        <div
          className={`mt-4 flex gap-2 rounded-xl p-3 text-xs leading-5 ${
            featured ? "bg-white/[0.07] text-white/65" : "bg-surface text-muted"
          }`}
        >
          <InfoIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <p>{recommendation.bookingAdvice}</p>
        </div>
      ) : null}
    </article>
  );
}

export function TripPreviewView({
  preview,
  save,
}: {
  preview: TripPreview;
  save: { enabled: boolean; previewQuery: string };
}) {
  const primaryHighlight = preview.highlights[0];
  const alternatives = preview.highlights.slice(1, 5);

  return (
    <>
      <section className="relative border-b border-line bg-white">
        <div className="relative mx-auto w-full max-w-[90rem] px-5 pb-14 pt-8 sm:px-8 sm:pb-20 sm:pt-10 lg:px-12">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/#open-trip"
              className="inline-flex items-center gap-2 rounded-full text-xs font-bold text-muted no-underline hover:text-ink"
            >
              <ArrowLeftIcon className="size-4" aria-hidden="true" />
              Reis aanpassen
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.11em] text-ink">
              <span className="size-1.5 rounded-full bg-sun" />
              Anonieme preview
            </span>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:gap-16">
            <div>
              <p className="eyebrow">{preview.phaseGuidance.eyebrow}</p>
              <h1 className="display-title mt-5 max-w-4xl text-5xl leading-[0.94] sm:text-6xl lg:text-7xl">
                {preview.phaseGuidance.title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
                {preview.phaseGuidance.body}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line">
              <div className="bg-white p-4 sm:p-5">
                <dt className="flex items-center gap-2 text-xs font-semibold text-muted">
                  <CalendarIcon className="size-4" aria-hidden="true" />
                  Reisdata
                </dt>
                <dd className="mt-2 text-sm font-bold text-ink">
                  <span className="block">
                    {formatDate(preview.trip.arrivalDate)} — {formatDate(preview.trip.departureDate, true)}
                  </span>
                  <span className="mt-1 block text-xs font-normal text-muted">
                    {preview.trip.nights} nachten
                  </span>
                </dd>
              </div>
              <div className="bg-white p-4 sm:p-5">
                <dt className="flex items-center gap-2 text-xs font-semibold text-muted">
                  <UsersIcon className="size-4" aria-hidden="true" />
                  Gezelschap
                </dt>
                <dd className="mt-2 text-sm font-bold text-ink">
                  <span className="block">{preview.trip.partyLabel}</span>
                  <span className="mt-1 block text-xs font-normal text-muted">
                    {preview.trip.travelerCount} reizigers
                  </span>
                </dd>
              </div>
              <div className="col-span-2 flex items-center justify-between gap-4 bg-white p-4 sm:p-5">
                <div>
                  <dt className="text-xs font-semibold text-muted">Reisfase</dt>
                  <dd className="mt-1 text-sm font-bold text-ink">
                    {phaseLabels[preview.phase]}
                  </dd>
                </div>
                <span className="rounded-full bg-surface px-3 py-1.5 text-xs font-bold text-ink">
                  {preview.route.length} {preview.route.length === 1 ? "regio" : "regio’s"}
                </span>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[90rem] gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[0.72fr_1.28fr] lg:gap-14 lg:px-12 lg:py-24">
        <div>
          <p className="eyebrow">Jouw route</p>
          <h2 className="display-title mt-4 text-4xl leading-[1.03]">
            Eén reis, lokale intelligentie per stop.
          </h2>
          <p className="mt-5 text-sm leading-7 text-muted">
            De relevantie verschuift mee met je locatie. Zo concurreert een activiteit
            in Samaná niet met een dag waarop je nog in Santo Domingo bent.
          </p>
        </div>

        <ol className="space-y-3">
          {preview.route.map((stop, index) => (
            <li
              key={`${stop.regionId}-${stop.arrivalDate}`}
              className="relative rounded-2xl border border-line bg-white p-5 sm:p-6"
            >
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div className="flex gap-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-[760] tracking-[-0.03em]">
                        {stop.regionName}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[0.63rem] font-bold uppercase tracking-[0.08em] ${
                          stop.timing === "CURRENT"
                            ? "bg-sun/20 text-ink"
                            : "bg-surface text-muted"
                        }`}
                      >
                        {timingLabels[stop.timing]}
                      </span>
                    </div>
                    {stop.destinationClusterName ? (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                        <MapPinIcon className="size-3.5" aria-hidden="true" />
                        {stop.destinationClusterName}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="pl-13 text-left sm:pl-0 sm:text-right">
                  <p className="text-sm font-bold text-ink">
                    {formatDate(stop.arrivalDate)} — {formatDate(stop.departureDate)}
                  </p>
                  <p className="mt-1 text-xs text-muted">{stop.nights} nachten</p>
                </div>
              </div>

              {stop.highlights.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4 sm:ml-13">
                  {stop.highlights.slice(0, 3).map((highlight) => (
                    <span
                      key={highlight.id}
                      className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-ink"
                    >
                      {highlight.title}
                    </span>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      {primaryHighlight ? (
        <section className="border-y border-line bg-white">
          <div className="mx-auto w-full max-w-[90rem] px-5 py-14 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow">Nu relevant voor jouw reis</p>
                <h2 className="display-title mt-4 max-w-2xl text-4xl leading-[1.03] sm:text-5xl">
                  Een eerste selectie, al vóór registratie.
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-muted">
                Deze preview gebruikt redactionele brondata. Live weer en dagelijkse
                ranking volgen pas wanneer de tijdshorizon dat toelaat.
              </p>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
              <RecommendationCard recommendation={primaryHighlight} featured />
              <div className="grid gap-4 sm:grid-cols-2">
                {alternatives.map((recommendation) => (
                  <RecommendationCard
                    key={recommendation.id}
                    recommendation={recommendation}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto grid w-full max-w-[90rem] gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1fr_1fr] lg:gap-14 lg:px-12 lg:py-24">
        <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <CompassIcon className="size-7 text-ink" aria-hidden="true" />
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.12em] text-muted">
            Country & culture
          </p>
          <h2 className="mt-3 text-2xl font-[760] tracking-[-0.04em]">
            {preview.nationalContext.headline}
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted">
            {preview.nationalContext.introduction}
          </p>
          <p className="mt-5 border-t border-line pt-5 text-xs leading-5 text-muted">
            {preview.nationalContext.travelIdentity}
          </p>
        </div>

        <div className="flex flex-col rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <ShieldCheckIcon className="size-7 text-ink" aria-hidden="true" />
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.12em] text-muted">
            Herkomst en vertrouwen
          </p>
          <h2 className="mt-3 text-2xl font-[760] tracking-[-0.04em]">
            Zichtbaar wat deze preview weet.
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted">{preview.trust.note}</p>
          <dl className="mt-auto grid grid-cols-2 gap-5 border-t border-line pt-6">
            <div>
              <dt className="text-xs text-muted">Status</dt>
              <dd className="mt-1 text-sm font-bold text-ink">
                {preview.trust.isSeedData ? "Indicatieve seeddata" : "Actuele brondata"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Confidence</dt>
              <dd className="mt-1 text-sm font-bold text-ink">
                {Math.round(preview.trust.confidence * 100)}%
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-muted">Laatst gecontroleerd</dt>
              <dd className="mt-1 text-sm font-bold text-ink">
                {formatReviewedAt(preview.trust.lastReviewedAt)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="bg-ink text-white">
        <div className="mx-auto grid w-full max-w-[90rem] gap-8 px-5 py-14 sm:px-8 sm:py-16 lg:grid-cols-[1fr_auto] lg:items-center lg:px-12">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-sun">
              <SparkIcon className="size-4" aria-hidden="true" />
              Volgende stap
            </p>
            <h2 className="display-title mt-4 max-w-2xl text-4xl leading-[1.03] text-white sm:text-5xl">
              Bewaar deze living trip.
            </h2>
            <p id="save-note" className="mt-4 max-w-xl text-sm leading-6 text-white/60">
              {save.enabled
                ? "Met een account blijft je route privé opgeslagen en beweegt Calor mee met je reisfase."
                : "Met een account blijft je route privé opgeslagen. Opslaan is in deze omgeving nog niet beschikbaar."}
            </p>
          </div>
          {save.enabled ? (
            <SaveTripButton previewQuery={save.previewQuery} />
          ) : (
            <button
              type="button"
              className="primary-button lg:min-w-60"
              disabled
              aria-describedby="save-note"
            >
              Maak account & bewaar
            </button>
          )}
        </div>
      </section>
    </>
  );
}
