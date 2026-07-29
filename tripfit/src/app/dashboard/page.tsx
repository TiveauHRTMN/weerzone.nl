import type { Metadata } from "next";
import Link from "next/link";

import { getPrismaClient } from "@/db/client";
import { getCountryPackRegion } from "@/domain/countries/types";
import { dominicanRepublicPack } from "@/domain/countries/packs/dominican-republic";
import { listTripsForUser, type StoredTrip } from "@/features/trips/trip-queries";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: "Mijn trips | Calor",
  robots: { index: false, follow: false },
};

const dateFormatter = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function routeLabel(trip: StoredTrip): string {
  return trip.stops
    .map((stop) => getCountryPackRegion(dominicanRepublicPack, stop.regionId)?.name ?? stop.regionId)
    .join(" → ");
}

export default async function DashboardPage() {
  const { user } = await requireAuthenticatedUser();
  const prisma = getPrismaClient();
  const trips = prisma && user.id ? await listTripsForUser(prisma, user.id) : [];

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.13em] text-muted">Mijn Calor</p>
      <h1 className="mt-3 text-4xl font-[760] tracking-[-0.04em]">Je living trips.</h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-muted">Ingelogd als {user.email ?? "Calor-gebruiker"}.</p>

      {trips.length === 0 ? (
        <section className="mt-10 rounded-2xl border border-line bg-white p-6 sm:p-8">
          <h2 className="text-xl font-[760] tracking-[-0.03em]">Nog geen opgeslagen trips</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Sla een preview op om hem hier opnieuw te openen.
          </p>
        </section>
      ) : (
        <section className="mt-10 grid gap-4">
          {trips.map((trip) => (
            <Link
              key={trip.id}
              href={`/trips/${trip.id}`}
              className="block rounded-2xl border border-line bg-white p-6 transition-colors hover:border-ink sm:p-8"
            >
              <h2 className="text-xl font-[760] tracking-[-0.03em]">
                {trip.title ?? "Living trip"}
              </h2>
              <p className="mt-2 text-sm text-muted">
                {dateFormatter.format(trip.arrivalDate)} – {dateFormatter.format(trip.departureDate)}
              </p>
              <p className="mt-3 text-sm leading-6 text-ink">{routeLabel(trip)}</p>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
