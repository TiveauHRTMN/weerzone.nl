import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PERSONAS, formatPrice, type PersonaTier } from "@/lib/personas";
import { isFounderEmail, FOUNDER_TIER } from "@/lib/founders";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AppDashboard() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/app/onboarding");

  // Actieve subscriptions ophalen
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("tier, status, trial_end, is_founder")
    .eq("user_id", user.id)
    .in("status", ["trialing", "active"]);

  // We kunnen meerdere subs hebben (bv Piet van de trigger + Steve van onboarding).
  // We pakken de "hoogste".
  const tierRanking: Record<string, number> = { steve: 3, reed: 2, piet: 1, free: 0 };
  const sortedSubs = (subs || []).sort((a, b) => 
    (tierRanking[b.tier] ?? 0) - (tierRanking[a.tier] ?? 0)
  );
  
  const sub = sortedSubs[0];
  let tier = (sub?.tier ?? null) as PersonaTier | null;
  const isFounder = isFounderEmail(user.email);
  if (!tier && isFounder) tier = FOUNDER_TIER;
  const persona = tier ? PERSONAS[tier] : null;

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/95 backdrop-blur rounded-3xl p-8 shadow-xl">
          <div className="flex items-center justify-between gap-4 mb-2">
            <p className="text-xs uppercase tracking-wider text-text-muted">
              Ingelogd als {user.email}
            </p>
            <LogoutButton />
          </div>
          <h1 className="text-3xl font-black text-text-primary mb-4">
            {persona ? (
              <>
                Welkom,{" "}
                <span style={{ color: persona.color }}>{persona.name}</span>-abonnee
              </>
            ) : (
              <>Kies je persona</>
            )}
          </h1>

          {persona ? (
            <>
              <p className="text-text-secondary mb-6">
                {persona.description}
              </p>
              <div className="rounded-2xl bg-black/[0.03] p-5 mb-6">
                <p className="text-sm text-text-secondary mb-1">
                  {isFounder ? "Founder-toegang (architect)" : "Jouw introductieprijs"}
                </p>
                <p className="text-2xl font-black text-text-primary">
                  {isFounder ? (
                    <>Volledige toegang <span className="text-sm font-normal text-text-muted"> — alle personas</span></>
                  ) : (
                    <>
                      {formatPrice(persona.founderPriceCents)}
                      <span className="text-sm font-normal text-text-muted">
                        {" "}/ maand, voor altijd
                      </span>
                    </>
                  )}
                </p>
                {!isFounder && sub?.trial_end && (
                  <p className="text-xs text-text-muted mt-2">
                    Gratis proefperiode tot{" "}
                    {new Date(sub.trial_end).toLocaleDateString("nl-NL", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
              <p className="text-sm text-text-secondary">
                Je eerste brief arriveert morgenochtend 07:00. Dashboard met
                uurdetail + werkramen is in aanbouw — verschijnt hier zodra
                klaar.
              </p>
            </>
          ) : (
            <>
              <p className="text-text-secondary mb-6">
                Je account bestaat, maar er is nog geen persona gekoppeld.
              </p>
              <Link
                href="/prijzen"
                className="inline-block rounded-full px-6 py-3 bg-accent-orange text-white font-black hover:bg-accent-orange/90 transition-colors"
              >
                Kies je persona
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
