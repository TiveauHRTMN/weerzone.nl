import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import {
  ArrowRightIcon,
  CompassIcon,
  MapPinIcon,
  SparkIcon,
} from "@/components/ui/icons";
import { dominicanRepublicPack } from "@/domain/countries/packs/dominican-republic";
import { AnalyticsBeacon } from "@/features/analytics/analytics-beacon";
import {
  DestinationRegionCard,
  SourceStamp,
} from "@/features/destinations/destination-components";

export const metadata: Metadata = {
  title: "Dominicaanse Republiek",
  description:
    "Open een persoonlijke, levende reis voor Punta Cana, Santo Domingo, Samaná en de rest van de Dominicaanse Republiek.",
  alternates: { canonical: "/dominicaanse-republiek" },
  openGraph: {
    title: "Dominicaanse Republiek | Calor",
    description:
      "Landbrede live travel intelligence, verdiept voor de belangrijkste reisregio’s.",
    url: "/dominicaanse-republiek",
    type: "website",
  },
};

export default function DominicanRepublicPage() {
  const { country, nationalContext, regions, sourceCoverage } =
    dominicanRepublicPack;
  const flagshipRegions = regions.filter(
    (region) => region.coverageLevel === "FLAGSHIP",
  );
  const otherRegions = regions.filter(
    (region) => region.coverageLevel !== "FLAGSHIP",
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TouristDestination",
        name: country.name,
        description: nationalContext.introduction,
        url: "https://calortravel.nl/dominicaanse-republiek",
        touristType: nationalContext.travelIdentity,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://calortravel.nl",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: country.name,
            item: "https://calortravel.nl/dominicaanse-republiek",
          },
        ],
      },
    ],
  };

  return (
    <>
      <AnalyticsBeacon
        name="destination_view"
        destinationId={country.id}
        includeAttribution
      />
      <section className="relative border-b border-line bg-white">
        <div className="relative mx-auto w-full max-w-[90rem] px-5 pb-16 pt-8 sm:px-8 sm:pb-20 sm:pt-10 lg:px-12 lg:pb-24">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: country.name }]}
          />
          <div className="mt-14 grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <p className="eyebrow">Volledig country pack</p>
              <h1 className="display-title mt-5 max-w-4xl text-5xl leading-[0.98] text-ink sm:text-6xl lg:text-7xl">
                {nationalContext.headline}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
                {nationalContext.introduction}
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-ink">
                <SparkIcon className="size-4" aria-hidden="true" />
                Calor-dekking
              </p>
              <dl className="mt-5 grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs text-muted">Flagships</dt>
                  <dd className="mt-1 text-2xl font-bold tabular">{flagshipRegions.length}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Reisregio’s</dt>
                  <dd className="mt-1 text-2xl font-bold tabular">{regions.length}</dd>
                </div>
              </dl>
              <Link className="primary-button mt-6 w-full" href="/#open-trip">
                Open mijn reis
                <ArrowRightIcon className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[90rem] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <div className="max-w-3xl">
          <p className="eyebrow">Maximale verdieping</p>
          <h2 className="display-title mt-4 text-4xl leading-[1.02] sm:text-5xl">
            Drie regio’s als inhoudelijk kompas.
          </h2>
          <p className="mt-5 text-sm leading-7 text-muted sm:text-base">
            Hier verbindt Calor de meeste lokale context, tijdelijke kansen en
            route-informatie. De ranking blijft in elke regio aan dezelfde
            uitlegbare regels gebonden.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {flagshipRegions.map((region) => (
            <DestinationRegionCard key={region.id} region={region} />
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto w-full max-w-[90rem] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-14">
            <div>
              <p className="eyebrow">Landbrede route</p>
              <h2 className="display-title mt-4 text-4xl leading-[1.03]">
                Ruimte voor het hele land.
              </h2>
              <p className="mt-5 text-sm leading-7 text-muted">
                Van noordkust en bergland tot het diepe zuidwesten: elke stop kan
                onderdeel worden van dezelfde living trip.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {otherRegions.map((region) => (
                <DestinationRegionCard key={region.id} region={region} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[90rem] gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:px-12 lg:py-24">
        <div>
          <p className="eyebrow">Landcontext</p>
          <h2 className="display-title mt-4 text-4xl leading-[1.03]">
            Context die je reis rijker maakt.
          </h2>
          <p className="mt-5 text-sm leading-7 text-muted">
            {nationalContext.travelIdentity}
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {nationalContext.practicalFacts.slice(0, 6).map((fact) => (
              <div key={fact.id} className="rounded-xl border border-line bg-white p-4">
                <p className="text-xs font-semibold text-muted">{fact.label}</p>
                <p className="mt-1.5 text-sm font-bold text-ink">{fact.value}</p>
                {fact.note ? (
                  <p className="mt-2 text-xs leading-5 text-muted">{fact.note}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <CompassIcon className="size-7 text-ink" aria-hidden="true" />
          <h2 className="mt-6 text-2xl font-[760] tracking-[-0.04em]">
            Niet één Dominicaanse ervaring
          </h2>
          <div className="mt-6 space-y-6">
            {nationalContext.culturalContext.slice(0, 3).map((item) => (
              <article key={item.id}>
                <h3 className="text-sm font-bold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{item.body}</p>
              </article>
            ))}
          </div>
          <div className="mt-7 flex items-center gap-2 border-t border-line pt-5 text-xs font-semibold text-muted">
            <MapPinIcon className="size-4" aria-hidden="true" />
            Context wordt straks automatisch op je route gefilterd.
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[90rem] px-5 pb-16 sm:px-8 sm:pb-20 lg:px-12 lg:pb-24">
        <SourceStamp sourceCoverage={sourceCoverage} />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}
