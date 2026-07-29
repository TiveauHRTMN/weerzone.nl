import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPrismaClient } from "@/db/client";
import { dominicanRepublicPack } from "@/domain/countries/packs/dominican-republic";
import { getCountryPackRegion } from "@/domain/countries/types";
import { isoDateFromDate } from "@/domain/trips/dates";
import { INTERESTS } from "@/domain/trips/interests";
import { calculateTripPhase } from "@/domain/trips/phase";
import { encodeTripPreviewRequest } from "@/domain/trips/preview-request";
import { getTripForUser, toTripPreviewRequest } from "@/features/trips/trip-queries";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";

import { updateTripSettings } from "./actions";

export const metadata: Metadata = {
  title: "Trip | Calor",
  robots: { index: false, follow: false },
};

const phaseLabels = {
  PLANNING_LONG_RANGE: "Lange termijn",
  PLANNING_SUBSEASONAL: "Seizoensbeeld",
  PLANNING_FORECAST: "Weervenster",
  IN_TRIP: "Tijdens je reis",
  COMPLETED: "Reisarchief",
} as const;

const dateFormatter = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

type TripPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
};

export default async function TripPage({ params, searchParams }: TripPageProps) {
  const { user } = await requireAuthenticatedUser();
  const { id } = await params;

  const prisma = getPrismaClient();
  if (!prisma) notFound();

  const trip = await getTripForUser(prisma, id, user.id);
  if (!trip) notFound();

  const interestCodeById = new Map(INTERESTS.map((interest) => [`interest-${interest.id}`, interest.id]));
  const interestLabelByCode = new Map(INTERESTS.map((interest) => [interest.id, interest.label]));
  const request = toTripPreviewRequest(trip, interestCodeById);
  const phase = calculateTripPhase(request, isoDateFromDate(new Date()));
  const adults = request.travelers.adults;
  const children = request.travelers.childAges.length;
  const saved = (await searchParams).saved;

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.13em] text-muted">Private trip · {phaseLabels[phase]}</p>
      <h1 className="mt-3 text-4xl font-[760] tracking-[-0.04em]">{trip.title ?? "Living trip"}</h1>
      <p className="mt-4 text-sm leading-6 text-muted">
        {dateFormatter.format(trip.arrivalDate)} – {dateFormatter.format(trip.departureDate)} ·{" "}
        {adults} volwassene{adults === 1 ? "" : "n"}
        {children > 0 ? ` · ${children} kind${children === 1 ? "" : "eren"}` : ""}
      </p>
      {saved && <p className="mt-4 text-sm font-bold text-ink">Reisinstellingen opgeslagen.</p>}

      <section className="mt-10 rounded-2xl border border-line bg-white p-6 sm:p-8">
        <h2 className="text-xl font-[760] tracking-[-0.03em]">Route</h2>
        <ol className="mt-4 space-y-3">
          {request.stops.map((stop, index) => {
            const region = getCountryPackRegion(dominicanRepublicPack, stop.regionId);
            return (
              <li key={`${stop.regionId}-${index}`} className="flex items-baseline justify-between gap-4 text-sm">
                <span className="font-bold text-ink">{index + 1}. {region?.name ?? stop.regionId}</span>
                <span className="text-muted">
                  {dateFormatter.format(new Date(`${stop.arrivalDate}T12:00:00Z`))} –{" "}
                  {dateFormatter.format(new Date(`${stop.departureDate}T12:00:00Z`))}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-white p-6 sm:p-8">
        <h2 className="text-xl font-[760] tracking-[-0.03em]">Interesses</h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          {request.interests.map((code) => interestLabelByCode.get(code) ?? code).join(" · ")}
        </p>
      </section>

      <form action={updateTripSettings} className="mt-6 rounded-2xl border border-line bg-white p-6 sm:p-8">
        <input name="tripId" type="hidden" value={trip.id} />
        <h2 className="text-xl font-[760] tracking-[-0.03em]">Reisinstellingen</h2>
        <label className="mt-5 block text-sm font-bold" htmlFor="title">Naam van de reis</label>
        <input
          className="mt-2 min-h-12 w-full rounded-xl border border-line px-4"
          defaultValue={trip.title ?? "Living trip"}
          id="title"
          maxLength={120}
          name="title"
          required
        />
        <label className="mt-5 block text-sm font-bold" htmlFor="accommodationLabel">Verblijf</label>
        <input
          className="mt-2 min-h-12 w-full rounded-xl border border-line px-4"
          defaultValue={trip.stops[0]?.accommodationLabel ?? ""}
          id="accommodationLabel"
          maxLength={160}
          name="accommodationLabel"
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <label className="text-sm font-bold" htmlFor="budgetLevel">
            Budget
            <select
              className="mt-2 min-h-12 w-full rounded-xl border border-line bg-white px-4 font-normal"
              defaultValue={trip.preferenceSnapshot?.budgetLevel ?? "BALANCED"}
              id="budgetLevel"
              name="budgetLevel"
            >
              <option value="BUDGET">Voordelig</option>
              <option value="BALANCED">In balans</option>
              <option value="PREMIUM">Premium</option>
            </select>
          </label>
          <label className="text-sm font-bold" htmlFor="preferredPace">
            Reistempo
            <select
              className="mt-2 min-h-12 w-full rounded-xl border border-line bg-white px-4 font-normal"
              defaultValue={trip.preferenceSnapshot?.preferredPace ?? "BALANCED"}
              id="preferredPace"
              name="preferredPace"
            >
              <option value="SLOW">Rustig</option>
              <option value="BALANCED">In balans</option>
              <option value="ACTIVE">Actief</option>
            </select>
          </label>
          <label className="text-sm font-bold" htmlFor="mobility">
            Mobiliteit
            <select
              className="mt-2 min-h-12 w-full rounded-xl border border-line bg-white px-4 font-normal"
              defaultValue={trip.preferenceSnapshot?.mobility ?? "STANDARD"}
              id="mobility"
              name="mobility"
            >
              <option value="STANDARD">Standaard</option>
              <option value="LIMITED">Beperkt</option>
            </select>
          </label>
        </div>
        <button className="primary-button mt-5" type="submit">Instellingen opslaan</button>
      </form>

      <div className="mt-10">
        <Link className="primary-button mr-3" href={`/live?trip=${trip.id}`}>
          Open de dageditie
        </Link>
        <Link className="primary-button" href={`/preview?${encodeTripPreviewRequest(request)}`}>
          Open de live preview
        </Link>
        <Link className="quiet-button ml-3" href={`/trips/${trip.id}/album`}>
          Reisalbum
        </Link>
      </div>
    </main>
  );
}
