import type { Metadata } from "next";

import { requireAuthenticatedUser } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: "Account | Calor",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const { user } = await requireAuthenticatedUser();

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-14 sm:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.13em] text-muted">Account</p>
      <h1 className="mt-3 text-4xl font-[760] tracking-[-0.04em]">Je gegevens.</h1>
      <p className="mt-6 text-sm text-muted">{user.email ?? "Geen e-mailadres beschikbaar"}</p>
    </main>
  );
}

