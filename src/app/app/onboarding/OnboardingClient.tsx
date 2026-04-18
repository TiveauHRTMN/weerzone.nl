"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Check, Loader2, MapPin } from "lucide-react";
import {
  PERSONAS,
  PERSONA_ORDER,
  formatPrice,
  daysUntilLaunch,
  type PersonaTier,
} from "@/lib/personas";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Step = "tier" | "auth" | "sent" | "profile";

// ---------- Persona-specifieke prefs ----------

interface PietPrefs {
  hondNaam: string;
  fiets: boolean;
  tuin: boolean;
  kinderen: boolean;
  astma: boolean;
}
interface ReedPrefs {
  kelderGevoelig: boolean;
  platDak: boolean;
  baby: boolean;
  paardWei: boolean;
  waterschadeHistorie: string;
}
interface StevePrefs {
  branche: string;
  capaciteit: string;
  windBft: string;
  regenMm: string;
  tempMin: string;
  onweer: boolean;
  inkoopUur: string;
  annuleringUur: string;
}

const EMPTY_PIET: PietPrefs = {
  hondNaam: "",
  fiets: false,
  tuin: false,
  kinderen: false,
  astma: false,
};
const EMPTY_REED: ReedPrefs = {
  kelderGevoelig: false,
  platDak: false,
  baby: false,
  paardWei: false,
  waterschadeHistorie: "",
};
const EMPTY_STEVE: StevePrefs = {
  branche: "",
  capaciteit: "",
  windBft: "6",
  regenMm: "2",
  tempMin: "5",
  onweer: true,
  inkoopUur: "14",
  annuleringUur: "16",
};

export default function OnboardingClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const queryTier = searchParams.get("tier") as PersonaTier | null;
  const errorParam = searchParams.get("error");

  const [tier, setTier] = useState<PersonaTier | null>(
    queryTier && PERSONA_ORDER.includes(queryTier) ? queryTier : null,
  );
  const [step, setStep] = useState<Step>(tier ? "auth" : "tier");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam === "auth" ? "Inloglink ongeldig of verlopen. Probeer opnieuw." : null,
  );
  const [checkingSession, setCheckingSession] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Profile-step state
  const [fullName, setFullName] = useState("");
  const [postcode, setPostcode] = useState("");
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "asking" | "ok" | "denied">("idle");
  const [pietPrefs, setPietPrefs] = useState<PietPrefs>(EMPTY_PIET);
  const [reedPrefs, setReedPrefs] = useState<ReedPrefs>(EMPTY_REED);
  const [stevePrefs, setStevePrefs] = useState<StevePrefs>(EMPTY_STEVE);

  const days = daysUntilLaunch();

  // On mount: session-check
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!data.user) {
        setCheckingSession(false);
        return;
      }
      setUserId(data.user.id);

      // Actieve subscription?
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("tier, status")
        .eq("user_id", data.user.id)
        .in("status", ["trialing", "active"])
        .maybeSingle();

      const activeTier = (sub?.tier ?? null) as PersonaTier | null;

      // Als er al een sub is: check of prefs compleet zijn
      if (activeTier) {
        const { data: prefs } = await supabase
          .from("persona_preferences")
          .select("onboarding_stage")
          .eq("user_id", data.user.id)
          .eq("persona", activeTier)
          .maybeSingle();

        if (prefs && prefs.onboarding_stage >= 1) {
          router.replace("/app");
          return;
        }
        setTier(activeTier);
        setStep("profile");
        setCheckingSession(false);
        return;
      }

      // Nog geen sub. Als queryTier: subscription aanmaken → profile-step
      if (queryTier && PERSONA_ORDER.includes(queryTier)) {
        await createSubscription(queryTier, data.user.id);
        setTier(queryTier);
        setStep("profile");
        setCheckingSession(false);
        return;
      }

      // Ingelogd zonder sub zonder query-tier → laat ze kiezen
      setStep("tier");
      setCheckingSession(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createSubscription(chosen: PersonaTier, uid: string) {
    // Check first — partial unique index (user_id, tier) WHERE status IN (...)
    // ondersteunt ON CONFLICT niet zonder exacte predicate-match.
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", uid)
      .eq("tier", chosen)
      .in("status", ["trialing", "active", "past_due"])
      .maybeSingle();
    if (existing) return;

    const trialEnd = new Date("2026-06-01T00:00:00+02:00").toISOString();
    const founderPrice = PERSONAS[chosen].founderPriceCents;
    await supabase.from("subscriptions").insert({
      user_id: uid,
      tier: chosen,
      status: "trialing",
      trial_end: trialEnd,
      is_founder: true,
      founder_price_cents: founderPrice,
    });
  }

  // ---------- Magic link + OAuth ----------

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!tier || !email) return;
    setLoading(true);
    setError(null);
    const redirectTo = `${window.location.origin}/auth/callback?next=/app/onboarding&tier=${tier}`;
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo, data: { chosen_tier: tier } },
    });
    setLoading(false);
    if (otpError) return setError(otpError.message);
    setStep("sent");
  }

  async function handleGoogleOAuth() {
    if (!tier) return;
    setLoading(true);
    const redirectTo = `${window.location.origin}/auth/callback?next=/app/onboarding&tier=${tier}`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  }

  // ---------- GPS ----------

  function captureGps() {
    if (!("geolocation" in navigator)) {
      setGpsStatus("denied");
      return;
    }
    setGpsStatus("asking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setGpsStatus("ok");
      },
      () => setGpsStatus("denied"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60 * 60 * 1000 },
    );
  }

  // ---------- Submit profiel ----------

  function prefsForTier(t: PersonaTier): Record<string, unknown> {
    if (t === "piet") {
      return {
        hond: pietPrefs.hondNaam ? { naam: pietPrefs.hondNaam.trim() } : null,
        fiets: pietPrefs.fiets,
        tuin: pietPrefs.tuin,
        kinderen: pietPrefs.kinderen,
        astma: pietPrefs.astma,
      };
    }
    if (t === "reed") {
      return {
        kelder_gevoelig: reedPrefs.kelderGevoelig,
        plat_dak: reedPrefs.platDak,
        baby: reedPrefs.baby,
        paard_wei: reedPrefs.paardWei,
        waterschade_historie: reedPrefs.waterschadeHistorie || null,
      };
    }
    return {
      branche: stevePrefs.branche || null,
      capaciteit: stevePrefs.capaciteit ? Number(stevePrefs.capaciteit) : null,
      drempels: {
        wind_bft: Number(stevePrefs.windBft) || 6,
        regen_mm: Number(stevePrefs.regenMm) || 2,
        temp_min: Number(stevePrefs.tempMin) || 5,
        onweer: stevePrefs.onweer,
      },
      deadlines: {
        inkoop_uur: Number(stevePrefs.inkoopUur) || 14,
        annulering_uur: Number(stevePrefs.annuleringUur) || 16,
      },
    };
  }

  async function handleSubmitProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!tier || !userId) return;
    setLoading(true);
    setError(null);

    try {
      // user_profile upsert
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData.user?.email ?? "";
      await supabase.from("user_profile").upsert(
        {
          id: userId,
          email: userEmail,
          full_name: fullName.trim() || null,
          postcode: postcode.trim().toUpperCase() || null,
          primary_lat: gpsCoords?.lat ?? null,
          primary_lon: gpsCoords?.lon ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

      // user_locations: primary locatie als GPS bekend (geen unique constraint →
      // eerst bestaande primary weghalen, dan opnieuw invoegen)
      if (gpsCoords) {
        await supabase
          .from("user_locations")
          .delete()
          .eq("user_id", userId)
          .eq("is_primary", true);
        await supabase.from("user_locations").insert({
          user_id: userId,
          label: "Thuis",
          lat: gpsCoords.lat,
          lon: gpsCoords.lon,
          is_primary: true,
          persona_scope: [tier],
        });
      }

      // persona_preferences upsert
      await supabase.from("persona_preferences").upsert(
        {
          user_id: userId,
          persona: tier,
          prefs: prefsForTier(tier),
          onboarding_stage: 1,
          last_updated: new Date().toISOString(),
        },
        { onConflict: "user_id,persona" },
      );

      router.replace("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opslaan mislukt");
      setLoading(false);
    }
  }

  // ---------- Render ----------

  if (checkingSession) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </main>
    );
  }

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur mb-4 shadow-sm">
            <span className="w-2 h-2 rounded-full animate-pulse bg-red-500" />
            <span className="text-xs font-black text-text-primary uppercase tracking-wider">
              Tijdelijk gratis · nog {days} dagen
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white drop-shadow mb-2">
            {step === "sent"
              ? "Check je inbox"
              : step === "profile"
                ? "Vertel wat over jezelf"
                : "Word founder"}
          </h1>
          <p className="text-white/90 text-sm">
            {step === "tier" && "Kies je persona — gratis tot 1 juni, founder-prijs voor altijd."}
            {step === "auth" && tier && (
              <>
                Je koos voor{" "}
                <strong style={{ color: PERSONAS[tier].color }}>
                  {PERSONAS[tier].name}
                </strong>
                . Log in om te bevestigen.
              </>
            )}
            {step === "sent" && "We stuurden je een inloglink."}
            {step === "profile" && tier && (
              <>
                Hoe beter {PERSONAS[tier].name} je kent, hoe scherper je
                dagelijkse brief. Duurt 2 minuten.
              </>
            )}
          </p>
        </div>

        {step === "tier" && <TierGrid onPick={(t) => { setTier(t); setStep("auth"); }} />}

        {step === "auth" && tier && (
          <AuthCard
            tier={tier}
            email={email}
            setEmail={setEmail}
            loading={loading}
            error={error}
            onMagicLink={handleMagicLink}
            onGoogle={handleGoogleOAuth}
            onBack={() => { setTier(null); setStep("tier"); }}
          />
        )}

        {step === "sent" && <SentCard email={email} />}

        {step === "profile" && tier && (
          <ProfileForm
            tier={tier}
            fullName={fullName}
            setFullName={setFullName}
            postcode={postcode}
            setPostcode={setPostcode}
            gpsCoords={gpsCoords}
            gpsStatus={gpsStatus}
            onGps={captureGps}
            piet={pietPrefs}
            setPiet={setPietPrefs}
            reed={reedPrefs}
            setReed={setReedPrefs}
            steve={stevePrefs}
            setSteve={setStevePrefs}
            loading={loading}
            error={error}
            onSubmit={handleSubmitProfile}
          />
        )}
      </div>
    </main>
  );
}

// ============================================================
// Sub-components
// ============================================================

function TierGrid({ onPick }: { onPick: (t: PersonaTier) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {PERSONA_ORDER.map((t) => {
        const p = PERSONAS[t];
        return (
          <button
            key={t}
            onClick={() => onPick(t)}
            className="bg-white/95 backdrop-blur rounded-2xl p-5 text-left hover:scale-[1.02] transition-transform shadow-xl"
          >
            <div className="w-3 h-3 rounded-full mb-3" style={{ background: p.color }} />
            <h2 className="text-xl font-black text-text-primary mb-1">{p.name}</h2>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-3">{p.label}</p>
            <p className="text-sm text-text-secondary mb-3">{p.tagline}</p>
            <p className="text-sm">
              <span className="font-black" style={{ color: p.color }}>
                {formatPrice(p.founderPriceCents)}
              </span>
              <span className="text-text-muted"> /mnd founder</span>
            </p>
          </button>
        );
      })}
    </div>
  );
}

function AuthCard(props: {
  tier: PersonaTier;
  email: string;
  setEmail: (v: string) => void;
  loading: boolean;
  error: string | null;
  onMagicLink: (e: React.FormEvent) => void;
  onGoogle: () => void;
  onBack: () => void;
}) {
  const { tier, email, setEmail, loading, error, onMagicLink, onGoogle, onBack } = props;
  return (
    <div className="bg-white/95 backdrop-blur rounded-3xl p-6 sm:p-8 shadow-xl">
      <form onSubmit={onMagicLink} className="space-y-4">
        <label className="block">
          <span className="text-sm font-bold text-text-primary">E-mailadres</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jij@voorbeeld.nl"
            className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-orange"
          />
          <span className="text-xs text-text-muted mt-1 block">
            Elke e-mailprovider werkt (Gmail, Outlook, eigen domein…)
          </span>
        </label>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full px-6 py-3 font-black text-white disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: PERSONAS[tier].color }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Stuur inloglink</>}
        </button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-black/10" />
        <span className="text-xs text-text-muted uppercase tracking-wider">of</span>
        <div className="flex-1 h-px bg-black/10" />
      </div>

      <button
        onClick={onGoogle}
        disabled={loading}
        className="w-full rounded-full px-6 py-3 font-bold text-text-primary border border-black/15 hover:bg-black/[0.03] disabled:opacity-60 flex items-center justify-center gap-2"
      >
        <GoogleIcon /> Doorgaan met Google
      </button>

      <button
        onClick={onBack}
        className="block mx-auto mt-5 text-xs text-text-muted hover:text-text-primary underline"
      >
        Andere persona kiezen
      </button>
    </div>
  );
}

function SentCard({ email }: { email: string }) {
  return (
    <div className="bg-white/95 backdrop-blur rounded-3xl p-8 shadow-xl text-center">
      <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
        <Check className="w-7 h-7" />
      </div>
      <p className="text-text-primary font-bold mb-2">
        Inloglink verstuurd naar <br />
        <span className="text-accent-orange">{email}</span>
      </p>
      <p className="text-sm text-text-secondary">
        Check je inbox (en spam). Klik de link om door te gaan. Je kan dit tabblad sluiten.
      </p>
    </div>
  );
}

function ProfileForm(props: {
  tier: PersonaTier;
  fullName: string;
  setFullName: (v: string) => void;
  postcode: string;
  setPostcode: (v: string) => void;
  gpsCoords: { lat: number; lon: number } | null;
  gpsStatus: "idle" | "asking" | "ok" | "denied";
  onGps: () => void;
  piet: PietPrefs;
  setPiet: (v: PietPrefs) => void;
  reed: ReedPrefs;
  setReed: (v: ReedPrefs) => void;
  steve: StevePrefs;
  setSteve: (v: StevePrefs) => void;
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const {
    tier, fullName, setFullName, postcode, setPostcode,
    gpsCoords, gpsStatus, onGps,
    piet, setPiet, reed, setReed, steve, setSteve,
    loading, error, onSubmit,
  } = props;
  const color = PERSONAS[tier].color;

  return (
    <form onSubmit={onSubmit} className="bg-white/95 backdrop-blur rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
      {/* Basis */}
      <section className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-text-muted">Basis</h2>
        <Field label="Naam (hoe mag je persona je aanspreken?)">
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Roy Hartman"
            className="input"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Postcode (optioneel)">
            <input
              type="text"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              placeholder="1012 AB"
              className="input"
            />
          </Field>
          <Field label="GPS-locatie">
            <button
              type="button"
              onClick={onGps}
              disabled={gpsStatus === "asking" || gpsStatus === "ok"}
              className="input flex items-center justify-between text-left disabled:opacity-60"
            >
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {gpsStatus === "ok" && gpsCoords
                  ? `${gpsCoords.lat.toFixed(3)}, ${gpsCoords.lon.toFixed(3)}`
                  : gpsStatus === "asking"
                    ? "Bepalen…"
                    : gpsStatus === "denied"
                      ? "Geweigerd — vul postcode in"
                      : "Klik om te delen"}
              </span>
              {gpsStatus === "ok" && <Check className="w-4 h-4 text-green-600" />}
            </button>
          </Field>
        </div>
      </section>

      {/* Persona-specifiek */}
      <section className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-wider" style={{ color }}>
          {PERSONAS[tier].name}-profiel
        </h2>

        {tier === "piet" && (
          <div className="space-y-4">
            <Field label="Hond — wat is z'n naam? (leeg = geen hond)">
              <input
                type="text"
                value={piet.hondNaam}
                onChange={(e) => setPiet({ ...piet, hondNaam: e.target.value })}
                placeholder="Peppercorn"
                className="input"
              />
            </Field>
            <CheckRow label="Ik fiets dagelijks" checked={piet.fiets} onChange={(v) => setPiet({ ...piet, fiets: v })} />
            <CheckRow label="Ik heb een tuin" checked={piet.tuin} onChange={(v) => setPiet({ ...piet, tuin: v })} />
            <CheckRow label="Ik heb kinderen thuis" checked={piet.kinderen} onChange={(v) => setPiet({ ...piet, kinderen: v })} />
            <CheckRow label="Ik ben gevoelig voor astma / luchtweg-klachten" checked={piet.astma} onChange={(v) => setPiet({ ...piet, astma: v })} />
          </div>
        )}

        {tier === "reed" && (
          <div className="space-y-4">
            <CheckRow label="Kelder is watergevoelig" checked={reed.kelderGevoelig} onChange={(v) => setReed({ ...reed, kelderGevoelig: v })} />
            <CheckRow label="Plat dak (windgevoelig)" checked={reed.platDak} onChange={(v) => setReed({ ...reed, platDak: v })} />
            <CheckRow label="Baby in huis" checked={reed.baby} onChange={(v) => setReed({ ...reed, baby: v })} />
            <CheckRow label="Paarden / vee in de wei" checked={reed.paardWei} onChange={(v) => setReed({ ...reed, paardWei: v })} />
            <Field label="Eerder waterschade gehad? (jaartal, optioneel)">
              <input
                type="text"
                value={reed.waterschadeHistorie}
                onChange={(e) => setReed({ ...reed, waterschadeHistorie: e.target.value })}
                placeholder="2018"
                className="input"
              />
            </Field>
          </div>
        )}

        {tier === "steve" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Branche">
                <input
                  type="text"
                  required
                  value={steve.branche}
                  onChange={(e) => setSteve({ ...steve, branche: e.target.value })}
                  placeholder="strandtent, dakdekker, horeca…"
                  className="input"
                />
              </Field>
              <Field label="Capaciteit (plekken / dagomzet-schaal)">
                <input
                  type="number"
                  value={steve.capaciteit}
                  onChange={(e) => setSteve({ ...steve, capaciteit: e.target.value })}
                  placeholder="120"
                  className="input"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="Wind-drempel (bft)">
                <input type="number" value={steve.windBft} onChange={(e) => setSteve({ ...steve, windBft: e.target.value })} className="input" />
              </Field>
              <Field label="Regen-drempel (mm)">
                <input type="number" value={steve.regenMm} onChange={(e) => setSteve({ ...steve, regenMm: e.target.value })} className="input" />
              </Field>
              <Field label="Temp-minimum (°C)">
                <input type="number" value={steve.tempMin} onChange={(e) => setSteve({ ...steve, tempMin: e.target.value })} className="input" />
              </Field>
              <Field label="Onweer meetellen">
                <select
                  value={steve.onweer ? "ja" : "nee"}
                  onChange={(e) => setSteve({ ...steve, onweer: e.target.value === "ja" })}
                  className="input"
                >
                  <option value="ja">Ja</option>
                  <option value="nee">Nee</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Inkoop-deadline (uur)">
                <input type="number" min={0} max={23} value={steve.inkoopUur} onChange={(e) => setSteve({ ...steve, inkoopUur: e.target.value })} className="input" />
              </Field>
              <Field label="Annulering-deadline (uur)">
                <input type="number" min={0} max={23} value={steve.annuleringUur} onChange={(e) => setSteve({ ...steve, annuleringUur: e.target.value })} className="input" />
              </Field>
            </div>
          </div>
        )}
      </section>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full px-6 py-3 font-black text-white disabled:opacity-60 flex items-center justify-center gap-2"
        style={{ background: color }}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Klaar — stuur mijn eerste brief</>}
      </button>

      <p className="text-[11px] text-text-muted text-center">
        Je kan dit later aanpassen in je dashboard.
      </p>

      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          background: #fff;
          font-size: 0.95rem;
        }
        .input:focus {
          outline: 2px solid var(--color-accent-orange, #f97316);
          outline-offset: 1px;
        }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-text-primary block mb-1">{label}</span>
      {children}
    </label>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-black/20"
      />
      <span className="text-sm text-text-primary">{label}</span>
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
