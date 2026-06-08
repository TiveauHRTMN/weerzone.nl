import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSavedLocationServer } from "@/lib/location-cookies";
import { getDayContext } from "@/lib/agents/day-context";
import ProfileEditForm from "@/components/wz/ProfileEditForm";
import AgentTogglesForm from "@/components/wz/AgentTogglesForm";
import LogoutButton from "@/components/LogoutButton";
import WeerzoneBackground from "@/components/WeerzoneBackground";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mijn Weerzone",
  robots: { index: false, follow: false },
};

export default async function MijnWeerzonePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/app/login?next=/mijn-weerzone");
  }

  const [profileRes, savedLocation] = await Promise.all([
    supabase.from("user_profile").select("*").eq("id", user.id).single(),
    getSavedLocationServer(),
  ]);

  const profile = profileRes.data as
    | { full_name?: string; postcode?: string; piet_on?: boolean; reed_on?: boolean; koos_on?: boolean }
    | null;
  const firstName = profile?.full_name?.trim().split(/\s+/)[0] ?? "";

  const day = getDayContext();
  const dayLabel = day.isHoliday
    ? `${day.weekday} — ${day.holidayName}`
    : day.weekday;

  return (
    <>
      <WeerzoneBackground />
      <main className="relative z-10 min-h-screen px-4 py-10 sm:py-14 text-white">
      <div className="mx-auto max-w-3xl space-y-10">
        {/* Header */}
        <header className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">
            Mijn Weerzone
          </p>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm">
            {firstName ? `Welkom, ${firstName}` : "Welkom"}
          </h1>
          <p className="text-sm text-white/75 capitalize">{dayLabel}</p>
        </header>

        {/* Je agents — welke mogen je per e-mail een seintje geven */}
        <section className="space-y-3">
          <div className="flex items-baseline justify-between px-1">
            <h2 className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">
              Je agents
            </h2>
            <Link href="/vandaag" className="text-[11px] font-bold text-white/75 hover:text-white">
              Bekijk vandaag →
            </Link>
          </div>
          <AgentTogglesForm
            initial={{
              piet: profile?.piet_on ?? true,
              reed: profile?.reed_on ?? false,
              koos: profile?.koos_on ?? false,
            }}
          />
        </section>

        {/* Mijn plek */}
        <section className="space-y-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70 px-1">
            Mijn plek
          </h2>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {savedLocation ? (
              <>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Huidige plek
                </p>
                <p className="mt-1 text-xl font-black text-slate-900">
                  {savedLocation.name}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Piet, Reed en Koos kijken hier mee.
                </p>
                <Link
                  href="/weer"
                  className="mt-4 inline-flex items-center text-xs font-black uppercase tracking-widest text-slate-900 hover:underline"
                >
                  Open je weer →
                </Link>
              </>
            ) : (
              <>
                <p className="text-base text-slate-800">
                  Je hebt nog geen plek bewaard.
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Kies je plek vanaf een weerpagina; daarna kijken Piet, Reed
                  en Koos hier mee.
                </p>
                <Link
                  href="/weer"
                  className="mt-4 inline-flex items-center text-xs font-black uppercase tracking-widest text-slate-900 hover:underline"
                >
                  Kies een plek →
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Mijn gegevens */}
        <section className="space-y-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70 px-1">
            Mijn gegevens
          </h2>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="pb-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                E-mailadres
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800 truncate">
                {user.email}
              </p>
            </div>
            <ProfileEditForm
              user={{ email: user.email!, id: user.id }}
              profile={profile}
            />
          </div>
        </section>

        {/* Footer-acties */}
        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-white/20 pt-6">
          <div className="flex gap-5 text-xs font-bold text-white/75">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              Contact
            </Link>
          </div>
          <LogoutButton className="!text-white/75 hover:!text-white" />
        </footer>
      </div>
      </main>
    </>
  );
}
