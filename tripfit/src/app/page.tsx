import type { Metadata } from "next";
import Link from "next/link";

import {
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  CompassIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SparkIcon,
  SunCloudIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { dominicanRepublicPack } from "@/domain/countries/packs/dominican-republic";
import { INTERESTS } from "@/domain/trips/interests";
import { TripOnboarding } from "@/features/onboarding/trip-onboarding";

export const metadata: Metadata = {
  title: "Open je living trip",
  description:
    "Vul je bestemming en reisdata in. Calor bouwt één levende reisomgeving met wat voor jouw reis nú relevant is.",
  alternates: { canonical: "/" },
};

const productPrinciples = [
  {
    icon: CalendarIcon,
    title: "De juiste tijdshorizon",
    description:
      "Klimaat ver vooruit, concrete verwachting zodra die betrouwbaar wordt. Geen schijnprecisie.",
  },
  {
    icon: CompassIcon,
    title: "Keuzes boven lijsten",
    description:
      "Activiteiten worden relevant door seizoen, gezelschap, route en reistijd — niet door populariteit alleen.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Context met herkomst",
    description:
      "Je ziet wat officieel, lokaal geverifieerd, historisch of indicatief is en wanneer het is gecontroleerd.",
  },
];

export default function HomePage() {
  const flagshipRegions = dominicanRepublicPack.regions.filter(
    (region) => region.coverageLevel === "FLAGSHIP",
  );

  const regionOptions = dominicanRepublicPack.regions.map((region) => ({
    id: region.id,
    slug: region.slug,
    name: region.name,
    coverageLevel: region.coverageLevel,
    descriptor: region.context.bestFor.slice(0, 2).join(" · "),
  }));

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="mx-auto grid w-full max-w-[90rem] gap-12 px-5 pb-16 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,0.82fr)] lg:items-start lg:gap-16 lg:px-12 lg:pb-24 lg:pt-24">
          <div className="lg:sticky lg:top-24">
            <p className="eyebrow">Caribbean Live Travel Intelligence</p>
            <h1 className="display-title mt-6 max-w-3xl text-[clamp(3rem,7.6vw,6.6rem)] leading-[0.95] text-ink">
              Stop searching. Open your trip.
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
              Vul je bestemming en reisdata in. Calor bouwt één levende
              reisomgeving met de activiteiten, omstandigheden en lokale informatie
              die voor jouw reis nú relevant zijn.
            </p>

            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-ink">
              {["Preview zonder account", "Multi-region vanaf dag één", "Bronnen zichtbaar"].map(
                (item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <span className="grid size-5 place-items-center rounded-full bg-surface">
                      <CheckIcon className="size-3.5" aria-hidden="true" />
                    </span>
                    {item}
                  </span>
                ),
              )}
            </div>

            <div className="vlamrand relative mt-10 hidden max-w-2xl overflow-hidden rounded-2xl bg-ink p-6 text-white shadow-[var(--shadow-live)] sm:block lg:mt-14">
              <div className="relative">
                <div className="flex items-center justify-between gap-4">
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.13em] text-white/75">
                    Voorbeeld · living trip
                  </span>
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-white/60">
                    <span className="size-2 rounded-full bg-sun shadow-[0_0_0_5px_rgb(250_167_42_/_0.16)]" />
                    Past zich aan
                  </span>
                </div>

                <div className="mt-7 grid gap-7 md:grid-cols-[0.9fr_1.1fr]">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.13em] text-white/45">
                      Route · 27 jan — 7 feb
                    </p>
                    <ol className="mt-5 space-y-0">
                      {flagshipRegions.slice(0, 3).map((region, index) => (
                        <li key={region.id} className="relative flex gap-3 pb-5 last:pb-0">
                          {index < Math.min(flagshipRegions.length, 3) - 1 ? (
                            <span className="absolute left-[0.43rem] top-4 h-full w-px bg-white/15" />
                          ) : null}
                          <span className="relative mt-1.5 size-3.5 shrink-0 rounded-full border-2 border-sun bg-ink" />
                          <span className="text-sm font-semibold text-white/90">
                            {region.name}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div className="rounded-2xl border border-white/12 bg-white/[0.07] p-4">
                    <p className="flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.13em] text-sun">
                      <SparkIcon className="size-4" aria-hidden="true" />
                      Nu relevant in deze periode
                    </p>
                    <p className="mt-3 text-lg font-bold tracking-[-0.025em]">
                      Seizoenskansen langs de route
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/65">
                      Calor verbindt de exacte data, gezelschap en stops aan wat
                      op dat moment werkelijk past.
                    </p>
                    <div className="mt-4 flex gap-3 border-t border-white/10 pt-4 text-xs text-white/55">
                      <SunCloudIcon className="size-4 shrink-0 text-sun" aria-hidden="true" />
                      Seizoen nu · dagelijks weer pas zodra betrouwbaar
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <TripOnboarding
            country={{
              id: dominicanRepublicPack.country.id,
              name: dominicanRepublicPack.country.name,
            }}
            regions={regionOptions}
            interests={INTERESTS.map((interest) => ({
              value: interest.id,
              label: interest.label,
            }))}
          />
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto w-full max-w-[90rem] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
            <div>
              <p className="eyebrow">Eén reisomgeving</p>
              <h2 className="display-title mt-4 max-w-lg text-4xl leading-[1.02] sm:text-5xl">
                Minder zoeken. Beter kiezen.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-muted sm:text-base">
                Calor verandert mee van voorbereiding naar vertrek, en van
                planning naar de beste keuze van vandaag.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {productPrinciples.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="rounded-2xl border border-line bg-white p-5 sm:p-6"
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-surface text-ink">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-7 text-base font-bold tracking-[-0.025em]">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[90rem] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Eerste country pack</p>
            <h2 className="display-title mt-4 max-w-2xl text-4xl leading-[1.02] sm:text-5xl">
              De Dominicaanse Republiek, voorbij één resortregio.
            </h2>
          </div>
          <Link className="secondary-button shrink-0" href="/dominicaanse-republiek">
            Bekijk het land
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {flagshipRegions.slice(0, 3).map((region) => (
            <Link
              key={region.id}
              href={`/dominicaanse-republiek/${region.slug}`}
              className="group relative min-h-64 overflow-hidden rounded-2xl border border-line bg-white p-6 no-underline transition-colors hover:border-ink"
            >
              <div className="relative flex h-full flex-col">
                <div className="flex items-center justify-between gap-4">
                  <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-ink">
                    Flagship
                  </span>
                  <ArrowRightIcon
                    className="size-5 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-auto pt-12">
                  <h3 className="text-2xl font-[760] tracking-[-0.04em]">{region.name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                    {region.shortDescription}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-line bg-surface px-5 py-4 text-xs font-semibold text-muted">
          <span className="inline-flex items-center gap-2 text-ink">
            <MapPinIcon className="size-4" aria-hidden="true" />
            Landbrede dekking
          </span>
          <span>{dominicanRepublicPack.regions.length} reisregio’s</span>
          <span>{dominicanRepublicPack.destinationClusters.length} verblijfclusters</span>
          <span className="inline-flex items-center gap-2">
            <UsersIcon className="size-4" aria-hidden="true" />
            Gebouwd voor verschillende gezelschappen
          </span>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Calor",
            url: "https://calortravel.nl",
            description:
              "Caribbean Live Travel Intelligence voor een levende, persoonlijke reis.",
            inLanguage: "nl-NL",
          }).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}
