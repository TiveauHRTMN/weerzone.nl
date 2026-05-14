import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PERSONAS, formatPrice, type PersonaTier } from "@/lib/personas";
import { isFounderEmail, FOUNDER_TIER } from "@/lib/founders";
import LogoutButton from "@/components/LogoutButton";
import ProfileEditForm from "@/components/wz/ProfileEditForm";

export const dynamic = "force-dynamic";

export default async function AppDashboard() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/app/login");

  // Fetch profile and active subscriptions
  const [profileRes, subsRes] = await Promise.all([
    supabase.from("user_profile").select("*").eq("id", user.id).single(),
    supabase
      .from("subscriptions")
      .select("tier, status, trial_end, is_founder")
      .eq("user_id", user.id)
      .in("status", ["trialing", "active"])
  ]);

  const profile = profileRes.data;
  const subs = subsRes.data || [];

  // Determine "highest" or current tier
  const isFounder = isFounderEmail(user.email);
  const tierRanking: Record<string, number> = { steve: 3, reed: 2, piet: 1, free: 0 };
  const sortedSubs = [...subs].sort((a, b) => 
    (tierRanking[b.tier] ?? 0) - (tierRanking[a.tier] ?? 0)
  );
  
  const sub = sortedSubs[0];
  let tier = (sub?.tier ?? null) as PersonaTier | null;
  if (isFounder) tier = FOUNDER_TIER;
  
  const persona = tier ? PERSONAS[tier] : null;

  const greetingName = profile?.full_name || persona?.name || "Gebruiker";

  return (
    <main className="min-h-screen py-12 px-4 bg-[var(--ink-050)]">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-[var(--wz-border)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-[var(--ink-900)]">
                  Welkom, {greetingName}
                </h1>
                {isFounder && (
                  <span className="px-2 py-0.5 rounded-lg bg-[var(--wz-brand-soft)] text-[var(--wz-brand)] text-[10px] font-black uppercase tracking-wider">
                    ★ Founder
                  </span>
                )}
              </div>
              <p className="text-[var(--ink-500)] font-medium">Beheer hier je instellingen en persona-abonnement</p>
            </div>
            <LogoutButton />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Account Details (Form) */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-[var(--wz-border)] space-y-4">
              <h2 className="text-sm font-black uppercase tracking-widest text-[var(--ink-900)]">Mijn Gegevens</h2>
              
              <div className="space-y-1 pb-2">
                <label className="text-[10px] font-bold uppercase tracking-tight text-[var(--ink-400)]">E-mailadres</label>
                <p className="text-sm font-semibold text-[var(--ink-800)] truncate">{user.email}</p>
              </div>

              <ProfileEditForm 
                user={{ email: user.email!, id: user.id }} 
                profile={profile} 
              />
            </div>

            {isFounder && (
              <div className="bg-[var(--ink-900)] rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[var(--wz-brand)] rounded-full animate-pulse" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-white">Architect</h2>
                </div>
                <div className="grid gap-2">
                  <Link href="/admin/agents" className="text-xs font-bold text-white/70 hover:text-white transition-colors py-2 border-b border-white/10">
                    Agent Cockpit →
                  </Link>
                  <Link href="/admin/performance" className="text-xs font-bold text-white/70 hover:text-white transition-colors py-2">
                    Stats & Performance →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Persona / Subscription Section */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-[var(--wz-border)] h-full">
              {persona ? (
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <h2 className="text-sm font-black uppercase tracking-widest text-[var(--ink-900)]">Actueel Abonnement</h2>
                    <span 
                      className="px-3 py-1 rounded-full text-[10px] font-black uppercase"
                      style={{ background: persona.color + "20", color: persona.color }}
                    >
                      {sub?.status === 'trialing' ? 'Proefperiode' : 'Actief'}
                    </span>
                  </div>

                  <div className="p-6 rounded-2xl bg-[var(--ink-050)] border border-[var(--wz-border)]">
                    <div className="flex items-center gap-4 mb-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-black"
                        style={{ background: persona.color }}
                      >
                        {isFounder ? "★" : persona.name[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-[var(--ink-900)]">
                          {isFounder ? "Unlimited Founder Access" : persona.name}
                        </h3>
                        <p className="text-xs text-[var(--ink-500)]">
                          {isFounder ? "Je hebt volledige toegang tot alle persona's" : persona.tagline}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-2xl font-black text-[var(--ink-900)]">
                        {isFounder ? (
                          "Architect Status"
                        ) : (
                          "Tijdelijk Gratis"
                        )}
                      </p>
                      {sub?.trial_end && !isFounder && (
                        <p className="text-xs text-[var(--ink-400)] font-medium">
                          Volledige toegang tot 1 juni 2026
                        </p>
                      )}
                      {isFounder && (
                        <p className="text-xs text-[var(--wz-brand)] font-bold">
                          Geen facturatie — jouw account is voor altijd gratis.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Upgrades / Cross-sells */}
                  {!isFounder && (
                    <div className="space-y-4 pt-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-[var(--ink-900)]">Andere opties</h3>
                      <div className="grid grid-cols-1 gap-3">
                        {tier === 'piet' && (
                          <Link 
                            href="/app/checkout/reed"
                            className="flex items-center justify-between p-4 rounded-2xl border border-[var(--wz-border)] hover:border-[var(--wz-brand)] transition-all group"
                          >
                            <div>
                              <p className="text-sm font-bold text-[var(--ink-800)]">Upgrade naar Reed</p>
                              <p className="text-[10px] text-[var(--ink-400)]">Voor de serieuze onweer- en stormliefhebber</p>
                            </div>
                            <span className="text-[var(--ink-300)] group-hover:text-[var(--wz-brand)] transition-colors">→</span>
                          </Link>
                        )}
                        {tier !== 'steve' && (
                          <Link 
                            href="/zakelijk"
                            className="flex items-center justify-between p-4 rounded-2xl border border-[var(--wz-border)] hover:border-[var(--ink-900)] transition-all group"
                          >
                            <div>
                              <p className="text-sm font-bold text-[var(--ink-800)]">Weerzone Zakelijk (Steve)</p>
                              <p className="text-[10px] text-[var(--ink-400)]">Optimaliseer je bedrijfsvoering op basis van het weer</p>
                            </div>
                            <span className="text-[var(--ink-300)] group-hover:text-[var(--ink-900)] transition-colors">→</span>
                          </Link>
                        )}
                        <Link 
                          href="/prijzen"
                          className="text-xs font-bold text-[var(--ink-400)] hover:text-[var(--ink-600)] transition-colors pt-2"
                        >
                          Bekijk alle personas en prijzen →
                        </Link>
                      </div>
                    </div>
                  )}
                  {isFounder && (
                    <div className="pt-4">
                      <p className="text-xs text-[var(--ink-400)] leading-relaxed">
                        Je bent momenteel ingeschakeld als <strong>Steve</strong> (Architect). 
                        Dit geeft je automatisch toegang tot de meest uitgebreide zakelijke alerts en dashboards. 
                        Wisselen tussen persona-briefings per e-mail kan via de Agent Cockpit.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-[var(--ink-050)] rounded-full flex items-center justify-center">
                    <span className="text-2xl text-[var(--ink-300)]">?</span>
                  </div>
                  <div className="max-w-xs space-y-2">
                    <h2 className="text-lg font-black text-[var(--ink-900)]">Kies je persona</h2>
                    <p className="text-sm text-[var(--ink-500)]">Je account is klaar, maar je hebt nog geen persona gekozen om weerberichten van te ontvangen.</p>
                  </div>
                  <Link
                    href="/prijzen"
                    className="mt-4 inline-block rounded-full px-8 py-3 bg-[var(--wz-brand)] text-white font-black hover:opacity-90 transition-all shadow-lg shadow-[var(--wz-brand)]/20"
                  >
                    Persona kiezen
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
