import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getPrismaClient } from "@/db/client";
import { CalorLiveApp } from "@/features/live-day/calor-live-app";
import { getLiveDayForUser } from "@/features/live-day/live-day-query";
import { listTripsForUser } from "@/features/trips/trip-queries";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: "Vandaag | Calor Live",
  description: "Je levende dageditie voor vandaag.",
  robots: { index: false, follow: false },
};

export default async function LivePage({
  searchParams,
}: {
  searchParams: Promise<{ trip?: string | string[] }>;
}) {
  const { user } = await requireAuthenticatedUser();
  const prisma = getPrismaClient();
  if (!prisma) redirect("/dashboard");

  const requestedTrip = (await searchParams).trip;
  let tripId = typeof requestedTrip === "string" ? requestedTrip : null;

  if (!tripId) {
    const trips = await listTripsForUser(prisma, user.id);
    tripId = trips[0]?.id ?? null;
  }
  if (!tripId) redirect("/dashboard");

  const liveDay = await getLiveDayForUser(prisma, tripId, user.id);
  if (!liveDay) notFound();

  return (
    <div className="calor-live-route">
      <CalorLiveApp data={liveDay} />
    </div>
  );
}
