import Link from "next/link";

import { ArrowRightIcon, MapPinIcon, ShieldCheckIcon } from "@/components/ui/icons";
import type {
  CoverageLevel,
  Region,
  SourceCoverage,
} from "@/domain/countries/types";

const coverageLabels: Record<CoverageLevel, string> = {
  FLAGSHIP: "Flagship-regio",
  STANDARD: "Ruime dekking",
  BASIC: "Basisdekking",
};

const coverageStyles: Record<CoverageLevel, string> = {
  FLAGSHIP: "border-clay/25 bg-[#f4ded5] text-[#7e3f30]",
  STANDARD: "border-moss/20 bg-moss-soft text-moss-dark",
  BASIC: "border-line bg-sand/70 text-muted",
};

export function CoverageBadge({ level }: { level: CoverageLevel }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[0.66rem] font-bold uppercase tracking-[0.1em] ${coverageStyles[level]}`}
    >
      {coverageLabels[level]}
    </span>
  );
}

export function DestinationRegionCard({ region }: { region: Region }) {
  return (
    <Link
      href={`/dominicaanse-republiek/${region.slug}`}
      className="group flex h-full flex-col rounded-[1.4rem] border border-line/80 bg-paper p-5 no-underline shadow-[var(--shadow-card)] transition-[transform,border-color] hover:-translate-y-0.5 hover:border-moss/45 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <CoverageBadge level={region.coverageLevel} />
        <ArrowRightIcon
          className="size-5 shrink-0 text-moss transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        />
      </div>
      <h3 className="mt-7 text-xl font-[760] tracking-[-0.035em] text-ink">
        {region.name}
      </h3>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">
        {region.shortDescription}
      </p>
      <div className="mt-auto flex flex-wrap gap-2 pt-6">
        {region.context.bestFor.slice(0, 3).map((item) => (
          <span
            key={item}
            className="rounded-full bg-sand/65 px-2.5 py-1 text-[0.68rem] font-semibold text-moss-dark"
          >
            {item}
          </span>
        ))}
      </div>
    </Link>
  );
}

export function SourceStamp({ sourceCoverage }: { sourceCoverage: SourceCoverage }) {
  const reviewed = new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${sourceCoverage.lastReviewedAt}T12:00:00Z`));

  return (
    <aside className="flex flex-col gap-5 rounded-2xl border border-moss/20 bg-moss-soft/55 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex max-w-2xl gap-3">
        <ShieldCheckIcon
          className="mt-0.5 size-5 shrink-0 text-moss-dark"
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-bold text-moss-dark">
            {sourceCoverage.isSeedData ? "Redactionele seeddata" : "Geverifieerde brondata"}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted">{sourceCoverage.note}</p>
        </div>
      </div>
      <dl className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-1 text-xs">
        <div>
          <dt className="text-muted">Gecontroleerd</dt>
          <dd className="mt-1 font-bold text-ink">{reviewed}</dd>
        </div>
        <div>
          <dt className="text-muted">Confidence</dt>
          <dd className="mt-1 font-bold text-ink">
            {Math.round(sourceCoverage.confidence * 100)}%
          </dd>
        </div>
      </dl>
    </aside>
  );
}

export function RegionRouteStrip({ regions }: { regions: Region[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {regions.map((region) => (
        <Link
          key={region.id}
          href={`/dominicaanse-republiek/${region.slug}`}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line bg-paper px-3 py-2 text-xs font-semibold text-muted no-underline hover:border-moss hover:text-ink"
        >
          <MapPinIcon className="size-3.5 text-clay" aria-hidden="true" />
          {region.name}
        </Link>
      ))}
    </div>
  );
}
