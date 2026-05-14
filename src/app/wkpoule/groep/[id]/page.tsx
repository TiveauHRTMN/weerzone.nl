import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, ShieldCheck, Trophy } from "lucide-react";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGroupStandings } from "@/lib/poule";
import type { PouleGroup } from "@/lib/types";

const COLORS = [
  { label: "Canada", swatch: "bg-red-500", accent: "text-red-200" },
  { label: "USA", swatch: "bg-sky-400", accent: "text-sky-200" },
  { label: "Mexico", swatch: "bg-emerald-400", accent: "text-emerald-200" },
];

export default async function GroepPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/wkpoule/inloggen");

  const admin = createSupabaseAdminClient();
  const { data: group } = await admin
    .from("poule_groups")
    .select("id, name, owner_id, invite_code")
    .eq("id", id)
    .maybeSingle();

  if (!group) notFound();

  const standings = await getGroupStandings(id);
  const top3 = standings.slice(0, 3);
  const top8 = standings.slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-4 text-white">
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#07131d] shadow-2xl shadow-black/25">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(220,38,38,0.20),transparent_34%),linear-gradient(180deg,rgba(6,182,212,0.14),transparent_36%),linear-gradient(225deg,rgba(16,185,129,0.18),transparent_35%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:84px_84px] opacity-25" />
        <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#ef4444,#38bdf8,#22c55e)]" />

        <div className="relative px-5 py-5 md:px-7 md:py-7">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/wkpoule"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Dashboard
            </Link>

            <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/60">
              <Trophy className="h-3.5 w-3.5 text-emerald-300" />
              Canada / USA / Mexico
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-emerald-200">
                <ShieldCheck className="h-4 w-4" />
                Hartman WK 2026
              </div>

              <div className="space-y-3">
                <h1 className="max-w-3xl text-4xl font-black uppercase leading-[0.92] tracking-normal md:text-6xl">
                  {(group as PouleGroup).name}
                </h1>
                <p className="max-w-2xl text-sm font-medium leading-6 text-white/68 md:text-base">
                  De belangrijkste info staat direct in beeld. Geen lange groepspagina meer, maar een compact dashboard met meteen de stand.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {COLORS.map((color) => (
                  <div key={color.label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">{color.label}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`h-3 w-3 rounded-full ${color.swatch}`} />
                      <span className={`text-lg font-black uppercase tracking-normal ${color.accent}`}>{color.label}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/75">
                  <CalendarDays className="h-4 w-4 text-emerald-300" />
                  Alles per speeldag
                </div>
                <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/75">
                  <MapPin className="h-4 w-4 text-sky-300" />
                  WK 2026 sfeer
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 md:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">Ranking</div>
                  <h2 className="mt-1 text-xl font-black uppercase tracking-normal">Stand</h2>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/60">
                  {standings.length} deelnemers
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10">
                <div className="grid grid-cols-[42px_1fr_56px_56px_72px] gap-2 bg-black/25 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                  <div>Pos</div>
                  <div>Deelnemer</div>
                  <div className="text-center">EX</div>
                  <div className="text-center">WI</div>
                  <div className="text-right">Pts</div>
                </div>

                <div className="divide-y divide-white/8">
                  {top8.map((entry, index) => (
                    <div
                      key={entry.user_id}
                      className={`grid grid-cols-[42px_1fr_56px_56px_72px] items-center gap-2 px-3 py-3 ${
                        index < 3 ? "bg-white/[0.03]" : ""
                      }`}
                    >
                      <div className="font-black text-white/45">{index + 1}</div>
                      <div className="min-w-0">
                        <div className="truncate font-black uppercase tracking-normal text-white">{entry.display_name}</div>
                      </div>
                      <div className="text-center text-xs font-bold text-white/55">{entry.exact_scores}</div>
                      <div className="text-center text-xs font-bold text-white/55">{entry.correct_winners}</div>
                      <div className="text-right text-xl font-black tracking-normal text-emerald-300">{entry.total_points}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {top3.length > 0 && (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {top3.map((entry, index) => (
                <div key={entry.user_id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">{index + 1}e plaats</div>
                  <div className="mt-2 truncate text-lg font-black uppercase tracking-normal">{entry.display_name}</div>
                  <div className="mt-1 text-sm font-semibold text-white/60">{entry.total_points} punten</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
