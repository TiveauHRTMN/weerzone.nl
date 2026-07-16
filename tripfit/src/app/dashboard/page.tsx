import type { Metadata } from "next";

import { requireAuthenticatedUser } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: "Mijn trips | Calor",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const { user } = await requireAuthenticatedUser();

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.13em] text-muted">Mijn Calor</p>
      <h1 className="mt-3 text-4xl font-[760] tracking-[-0.04em]">Je living trips.</h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-muted">Ingelogd als {user.email ?? "Calor-gebruiker"}.</p>
      <section className="mt-10 rounded-2xl border border-line bg-white p-6 sm:p-8">
        <h2 className="text-xl font-[760] tracking-[-0.03em]">Nog geen opgeslagen trips</h2>
        <p className="mt-3 text-sm leading-6 text-muted">Sla straks een preview op om hem hier opnieuw te openen.</p>
      </section>
    </main>
  );
}

