import type { Metadata } from "next";

import { requireAuthenticatedUser } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: "Trip | Calor",
  robots: { index: false, follow: false },
};

type TripPageProps = { params: Promise<{ id: string }> };

export default async function TripPage({ params }: TripPageProps) {
  const { user } = await requireAuthenticatedUser();
  const { id } = await params;

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.13em] text-muted">Private trip</p>
      <h1 className="mt-3 text-4xl font-[760] tracking-[-0.04em]">Trip {id}</h1>
      <p className="mt-4 text-sm leading-6 text-muted">Deze trip-shell is gekoppeld aan {user.email ?? "jouw account"}.</p>
    </main>
  );
}

