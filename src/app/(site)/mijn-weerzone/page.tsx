import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSavedLocationServer } from "@/lib/location-cookies";
import { getDayContext } from "@/lib/agents/day-context";
import ProfileEditForm from "@/components/wz/ProfileEditForm";
import LogoutButton from "@/components/LogoutButton";
import WeerzoneBackground from "@/components/WeerzoneBackground";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mijn Weerzone",
  robots: { index: false, follow: false },
};

const AGENT_COLOR: Record<"piet" | "reed" | "koos", { dot: string; label: string }> = {
  piet: { dot: "#10b981", label: "text-emerald-700" },
  reed: { dot: "#ef4444", label: "text-rose-600" },
  koos: { dot: "#f59e0b", label: "text-amber-600" },
};

function AgentCard({
  agent,
  title,
  sublabel,
  message,
}: {
  agent: "piet" | "reed" | "koos";
  title: string;
  sublabel: string;
  message: string;
}) {
  const c = AGENT_COLOR[agent];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ background: c.dot }}
          aria-hidden
        />
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${c.label}`}>
          {title}
        </p>
      </div>
      <p className="mt-1 text-sm font-bold text-slate-700">{sublabel}</p>
      <p className="mt-4 text-base leading-relaxed text-slate-800">{message}</p>
    </div>
  );
}

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

  const profile = profileRes.data as { full_name?: string; postcode?: string } | null;
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

        {/* Vandaag — agent-blokken */}
        <section className="space-y-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70 px-1">
            Vandaag
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <AgentCard
              agent="piet"
              title="Piet"
              sublabel="Je dagelijkse heads-up"
              message="Piet kijkt mee voor je dagelijkse heads-up. Zodra er iets is om te beslissen, hoor je het hier."
            />
            <AgentCard
              agent="reed"
              title="Reed"
              sublabel="Voor buien, wind en onweer"
              message="Reed ziet geen verhoogd risico op je plekken."
            />
            <AgentCard
              agent="koos"
              title="Koos"
              sublabel="Als je eropuit wilt"
              message="Koos heeft vandaag geen betere richting nodig."
            />
          </div>
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
