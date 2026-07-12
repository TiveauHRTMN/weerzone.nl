"use client";

import Link from "next/link";

import { ArrowLeftIcon, CompassIcon } from "@/components/ui/icons";

export default function PreviewError({ reset }: { reset: () => void }) {
  return (
    <section className="mx-auto grid min-h-[64vh] w-full max-w-3xl place-items-center px-5 py-16 sm:px-8">
      <div className="surface-card w-full p-6 text-center sm:p-10">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-sand text-clay">
          <CompassIcon className="size-6" aria-hidden="true" />
        </span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.13em] text-clay">
          Preview onderbroken
        </p>
        <h1 className="display-title mt-3 text-4xl leading-tight">
          Deze reis kon even niet worden geopend.
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-muted">
          Je invoer is niet opgeslagen of gedeeld. Probeer de preview opnieuw, of
          ga terug om je reis te controleren.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" className="primary-button" onClick={reset}>
            Probeer opnieuw
          </button>
          <Link className="secondary-button" href="/#open-trip">
            <ArrowLeftIcon className="size-4" aria-hidden="true" />
            Terug naar mijn reis
          </Link>
        </div>
      </div>
    </section>
  );
}
