import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import {
  ArrowRightIcon,
  CalendarIcon,
  CompassIcon,
  MapPinIcon,
  SparkIcon,
} from "@/components/ui/icons";
import { dominicanRepublicPack } from "@/domain/countries/packs/dominican-republic";
import {
  CoverageBadge,
  RegionRouteStrip,
  SourceStamp,
} from "@/features/destinations/destination-components";

type RegionPageProps = {
  params: Promise<{ region: string }>;
};

const highlightKindLabels = {
  SIGNATURE: "Signatuur",
  CULTURE: "Cultuur",
  NATURE: "Natuur",
  BEACH: "Strand",
  FOOD: "Eten",
  ACTIVE: "Actief",
  PRACTICAL: "Praktisch",
} as const;

export const dynamicParams = false;

export function generateStaticParams() {
  return dominicanRepublicPack.regions.map((region) => ({
    region: region.slug,
  }));
}

export async function generateMetadata({
  params,
}: RegionPageProps): Promise<Metadata> {
  const { region: slug } = await params;
  const region = dominicanRepublicPack.regions.find((item) => item.slug === slug);

  if (!region) return {};

  return {
    title: region.name,
    description: region.shortDescription,
    alternates: { canonical: `/dominicaanse-republiek/${region.slug}` },
    openGraph: {
      title: `${region.name} | TripFit`,
      description: region.shortDescription,
      url: `/dominicaanse-republiek/${region.slug}`,
      type: "website",
    },
  };
}

export default async function DominicanRepublicRegionPage({
  params,
}: RegionPageProps) {
  const { region: slug } = await params;
  const region = dominicanRepublicPack.regions.find((item) => item.slug === slug);

  if (!region) notFound();

  const clusters = dominicanRepublicPack.destinationClusters.filter(
    (cluster) => cluster.regionId === region.id,
  );
  const otherRegions = dominicanRepublicPack.regions.filter(
    (item) => item.id !== region.id,
  );
  const highlights = [...region.previewHighlights]
    .sort((left, right) => right.priority - left.priority)
    .slice(0, 8);

  const canonicalUrl = `https://tripfit.travel/dominicaanse-republiek/${region.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TouristDestination",
        name: region.name,
        description: region.shortDescription,
        url: canonicalUrl,
        containedInPlace: {
          "@type": "Country",
          name: dominicanRepublicPack.country.name,
        },
        touristType: region.context.bestFor,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://tripfit.travel",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: dominicanRepublicPack.country.name,
            item: "https://tripfit.travel/dominicaanse-republiek",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: region.name,
            item: canonicalUrl,
          },
        ],
      },
    ],
  };

  return (
    <>
      <section className="relative overflow-hidden border-b border-line/80 bg-paper">
        <div
          className="absolute right-[-10rem] top-[-12rem] size-[38rem] rounded-full bg-clay/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto w-full max-w-[90rem] px-5 pb-14 pt-8 sm:px-8 sm:pb-20 sm:pt-10 lg:px-12 lg:pb-24">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: dominicanRepublicPack.country.name, href: "/dominicaanse-republiek" },
              { label: region.name },
            ]}
          />
          <div className="mt-14 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:gap-16">
            <div>
              <CoverageBadge level={region.coverageLevel} />
              <h1 className="display-title mt-5 max-w-4xl text-5xl leading-[0.94] sm:text-6xl lg:text-7xl">
                {region.context.headline}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
                {region.shortDescription}
              </p>
            </div>
            <aside className="rounded-2xl border border-line/80 bg-sand/45 p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.13em] text-clay">
                Sterk voor
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {region.context.bestFor.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-semibold text-moss-dark"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <Link className="primary-button mt-6 w-full" href="/#open-trip">
                Open mijn reis
                <ArrowRightIcon className="size-4" aria-hidden="true" />
              </Link>
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[90rem] gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16 lg:px-12 lg:py-24">
        <div>
          <p className="eyebrow">Regionale context</p>
          <h2 className="display-title mt-4 text-4xl leading-[1.03] sm:text-5xl">
            Waarom {region.name} anders voelt.
          </h2>
          <p className="mt-6 text-sm leading-7 text-muted sm:text-base">
            {region.context.identity}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <article className="rounded-2xl border border-line/80 bg-paper p-5 sm:p-6">
            <CalendarIcon className="size-6 text-clay" aria-hidden="true" />
            <h3 className="mt-5 text-base font-bold">Seizoen en timing</h3>
            <p className="mt-3 text-sm leading-6 text-muted">
              {region.context.seasonalNote}
            </p>
          </article>
          <article className="rounded-2xl border border-line/80 bg-paper p-5 sm:p-6">
            <CompassIcon className="size-6 text-clay" aria-hidden="true" />
            <h3 className="mt-5 text-base font-bold">Verplaatsen</h3>
            <p className="mt-3 text-sm leading-6 text-muted">
              {region.context.gettingAround}
            </p>
          </article>
          {region.context.localEtiquette ? (
            <article className="rounded-2xl border border-line/80 bg-paper p-5 sm:col-span-2 sm:p-6">
              <SparkIcon className="size-6 text-clay" aria-hidden="true" />
              <h3 className="mt-5 text-base font-bold">Lokale omgang</h3>
              <p className="mt-3 text-sm leading-6 text-muted">
                {region.context.localEtiquette}
              </p>
            </article>
          ) : null}
        </div>
      </section>

      <section className="border-y border-line/75 bg-paper/70">
        <div className="mx-auto w-full max-w-[90rem] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
          <div className="max-w-3xl">
            <p className="eyebrow">Relevante mogelijkheden</p>
            <h2 className="display-title mt-4 text-4xl leading-[1.03] sm:text-5xl">
              Geen afvinklijst, wel een sterke basis.
            </h2>
            <p className="mt-5 text-sm leading-7 text-muted sm:text-base">
              In je persoonlijke preview worden deze mogelijkheden verder gefilterd
              op exacte data, gezelschap en interesses.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((highlight) => (
              <article
                key={highlight.id}
                className="flex min-h-60 flex-col rounded-2xl border border-line/80 bg-white p-5 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-sand/70 px-2.5 py-1 text-[0.66rem] font-bold uppercase tracking-[0.1em] text-moss-dark">
                    {highlightKindLabels[highlight.kind]}
                  </span>
                  <span className="text-[0.68rem] font-semibold text-muted">
                    Familie-fit {highlight.familyFit}/100
                  </span>
                </div>
                <h3 className="mt-6 text-base font-bold tracking-[-0.025em]">
                  {highlight.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {highlight.shortDescription}
                </p>
                <p className="mt-auto pt-6 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-muted">
                  {highlight.dataStatus === "SEED"
                    ? "Indicatieve seeddata"
                    : "Redactioneel geverifieerd"}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {clusters.length > 0 ? (
        <section className="mx-auto w-full max-w-[90rem] px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
            <div>
              <p className="eyebrow">Verblijfsbases</p>
              <h2 className="display-title mt-4 text-4xl leading-[1.03]">
                Je plek verandert je dag.
              </h2>
              <p className="mt-5 text-sm leading-7 text-muted">
                TripFit gebruikt een verblijfcluster om reistijden en haalbaarheid
                realistischer te maken, zonder je exacte adres te vragen.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {clusters.map((cluster) => (
                <article
                  key={cluster.id}
                  className="rounded-2xl border border-line/80 bg-paper p-5"
                >
                  <MapPinIcon className="size-5 text-clay" aria-hidden="true" />
                  <h3 className="mt-4 text-sm font-bold">{cluster.name}</h3>
                  <p className="mt-2 text-xs leading-5 text-muted">
                    {cluster.shortDescription}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto w-full max-w-[90rem] px-5 pb-16 sm:px-8 sm:pb-20 lg:px-12 lg:pb-24">
        <SourceStamp sourceCoverage={dominicanRepublicPack.sourceCoverage} />
        <div className="mt-10 border-t border-line pt-8">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-muted">
            Verder door het land
          </p>
          <RegionRouteStrip regions={otherRegions} />
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}
