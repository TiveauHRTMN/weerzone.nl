import type { Metadata } from "next";

import { AuthForm } from "@/features/auth/auth-form";
import { sanitizeNextPath } from "@/lib/supabase/next-path";

export const metadata: Metadata = {
  title: "Inloggen | Calor",
  robots: { index: false, follow: false },
};

type AuthPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const next = sanitizeNextPath(rawNext);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center px-5 py-16 sm:px-8">
      <section className="w-full rounded-2xl border border-line bg-white p-6 sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.13em] text-muted">Calor account</p>
        <h1 className="mt-3 text-4xl font-[760] tracking-[-0.04em]">Bewaar je living trip.</h1>
        <p className="mt-4 text-sm leading-6 text-muted">Log in met een veilige link per e-mail of met Google.</p>
        <AuthForm next={next} />
      </section>
    </main>
  );
}
