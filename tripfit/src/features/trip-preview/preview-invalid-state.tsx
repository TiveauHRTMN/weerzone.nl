import Link from "next/link";

import { ArrowLeftIcon, InfoIcon } from "@/components/ui/icons";

export function PreviewInvalidState() {
  return (
    <section className="mx-auto grid min-h-[64vh] w-full max-w-3xl place-items-center px-5 py-16 sm:px-8">
      <div className="surface-card w-full p-6 text-center sm:p-10">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-sand text-clay">
          <InfoIcon className="size-6" aria-hidden="true" />
        </span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.13em] text-clay">
          Reisgegevens incompleet
        </p>
        <h1 className="display-title mt-3 text-4xl leading-tight">
          We missen iets om deze reis persoonlijk te maken.
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-muted">
          Open het reisformulier opnieuw en controleer bestemming, data,
          gezelschap, interesses en route.
        </p>
        <Link className="primary-button mt-7" href="/#open-trip">
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          Vul mijn reis aan
        </Link>
      </div>
    </section>
  );
}
