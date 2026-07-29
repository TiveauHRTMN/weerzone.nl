import type { Metadata } from "next";

import { requireAuthenticatedUser } from "@/lib/supabase/auth";

import { updateProfile } from "./actions";

export const metadata: Metadata = {
  title: "Account | Calor",
  robots: { index: false, follow: false },
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { user } = await requireAuthenticatedUser();
  const state = await searchParams;
  const displayName =
    typeof user.user_metadata.display_name === "string"
      ? user.user_metadata.display_name
      : "";

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-14 sm:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.13em] text-muted">Account</p>
      <h1 className="mt-3 text-4xl font-[760] tracking-[-0.04em]">Je gegevens.</h1>
      <p className="mt-6 text-sm text-muted">{user.email ?? "Geen e-mailadres beschikbaar"}</p>
      {state.saved && <p className="mt-5 text-sm font-bold text-ink">Opgeslagen.</p>}
      {state.error && <p className="mt-5 text-sm font-bold text-red">Opslaan mislukt. Probeer het opnieuw.</p>}
      <form action={updateProfile} className="mt-8 rounded-2xl border border-line bg-white p-6 sm:p-8">
        <label className="block text-sm font-bold text-ink" htmlFor="displayName">
          Naam
        </label>
        <input
          className="mt-3 min-h-12 w-full rounded-xl border border-line px-4"
          defaultValue={displayName}
          id="displayName"
          maxLength={80}
          name="displayName"
          required
        />
        <button className="primary-button mt-5" type="submit">Naam opslaan</button>
      </form>
    </main>
  );
}
