import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPrismaClient } from "@/db/client";
import { TripAlbum } from "@/features/trip-album/trip-album";
import { getTripForUser } from "@/features/trips/trip-queries";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: "Reisalbum | Calor",
  robots: { index: false, follow: false },
};

export default async function TripAlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await requireAuthenticatedUser();
  const { id } = await params;
  const prisma = getPrismaClient();
  if (!prisma) notFound();

  const trip = await getTripForUser(prisma, id, user.id);
  if (!trip) notFound();

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.13em] text-muted">Reisalbum</p>
      <h1 className="mt-3 text-4xl font-[760] tracking-[-0.04em]">
        {trip.title ?? "Jullie reis"}
      </h1>
      <TripAlbum tripId={trip.id} userId={user.id} />
      <Link className="quiet-button mt-10" href={`/trips/${trip.id}`}>Terug naar de reis</Link>
    </main>
  );
}
