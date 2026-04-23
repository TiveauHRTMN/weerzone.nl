"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { PERSONA_ORDER, type PersonaTier } from "@/lib/personas";
import { WzTextField } from "@/components/wz/WzForm";

type TopicKey = "rain" | "temp" | "wind" | "uv" | "snow";
type TimeKey = "06:30" | "07:00" | "08:00" | "avond";

// `reed: true` markeert onderwerpen die alleen in het Reed-abonnement zitten.
// De gebruiker mag ze aanvinken; bij checkout op Piet wordt het gated.
const TOPICS: Array<{ k: TopicKey; t: string; d: string; reed?: boolean }> = [
  { k: "rain", t: "Regen & buien", d: "Meldingen bij regenkans boven 70%" },
  { k: "temp", t: "Temperatuur", d: "Bij hitte, vorst of scherpe wisselingen" },
  { k: "wind", t: "Wind & storm", d: "Code geel, oranje of rood", reed: true },
  { k: "uv", t: "UV & pollen", d: "Voor buitenplannen en allergieën" },
  { k: "snow", t: "Winterweer", d: "Sneeuw, gladheid en ijsvorming", reed: true },
];

const TIMES: Array<{ k: TimeKey; t: string; d: string }> = [
  { k: "06:30", t: "Vroege vogel", d: "06:30 — voordat je de deur uit gaat" },
  { k: "07:00", t: "Ontbijt", d: "07:00 — bij je eerste bak koffie" },
  { k: "08:00", t: "Rustige start", d: "08:00 — voor een relaxte ochtend" },
  { k: "avond", t: "Avond vooruitblik", d: "19:00 — weer voor morgen, vanavond al" },
];

export default function OnboardingClient({ email }: { email: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const queryTier = searchParams.get("tier") as PersonaTier | null;
  const preTier =
    queryTier && PERSONA_ORDER.includes(queryTier) ? queryTier : null;

  const [step, setStep] = useState(0);
  const [postcode, setPostcode] = useState("");
  const [showPostcode, setShowPostcode] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "asking" | "ok" | "denied">("idle");
  const [authChecked, setAuthChecked] = useState(false);
  const [topics, setTopics] = useState<TopicKey[]>(["rain", "temp"]);
  const [time, setTime] = useState<TimeKey>("07:00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Client-side protectie: als de server de gebruiker nog niet zag, checken we het hier.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user && !authChecked) {
        router.replace("/app/signup?next=/app/onboarding");
      }
      setAuthChecked(true);
    });
  }, [supabase, router, authChecked]);

  const stepTitles = [
    {
      title: "Waar ben je?",
      sub: "We gebruiken GPS om je thuislocatie eenmalig te bepalen. Later kun je meer plekken toevoegen.",
    },
    {
      title: "Waar wil je op geattendeerd worden?",
      sub: "Kies de onderwerpen die jij belangrijk vindt. Je kunt dit altijd aanpassen.",
    },
    {
      title: "Wanneer wil je je bericht?",
      sub: "We sturen je één keer per dag een e-mail met Piet's Update, afgestemd op jouw voorkeuren.",
    },
  ];

  function captureGps() {
    if (!("geolocation" in navigator)) {
      setGpsStatus("denied");
      setShowPostcode(true);
      return;
    }
    setGpsStatus("asking");
    const safety = setTimeout(() => {
      setGpsStatus((c) => {
        if (c === "asking") {
          setShowPostcode(true);
          return "denied";
        }
        return c;
      });
    }, 12000);
    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(safety);
          setGpsCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          setGpsStatus("ok");
        },
        () => {
          clearTimeout(safety);
          setGpsStatus("denied");
          setShowPostcode(true);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60 * 60 * 1000 },
      );
    } catch {
      clearTimeout(safety);
      setGpsStatus("denied");
      setShowPostcode(true);
    }
  }

  function toggleTopic(k: TopicKey) {
    setTopics((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  }

  function canAdvance(): boolean {
    if (step === 0) return postcode.trim().length >= 4 || !!gpsCoords;
    if (step === 1) return topics.length > 0;
    return true;
  }

  async function persistAndGo(nextHref: string) {
    setLoading(true);
    setError(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) {
        setError("Sessie verlopen. Log opnieuw in.");
        setLoading(false);
        return;
      }

      await supabase.from("user_profile").upsert(
        {
          id: uid,
          email,
          postcode: postcode.trim().toUpperCase() || null,
          primary_lat: gpsCoords?.lat ?? null,
          primary_lon: gpsCoords?.lon ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

      if (gpsCoords) {
        await supabase
          .from("user_locations")
          .delete()
          .eq("user_id", uid)
          .eq("is_primary", true);
        await supabase.from("user_locations").insert({
          user_id: uid,
          label: "Thuis",
          lat: gpsCoords.lat,
          lon: gpsCoords.lon,
          is_primary: true,
        });
      }

      // Onderwerpen + meldingstijd: in user_metadata. Worden bij /checkout
      // gekoppeld aan persona_preferences zodra een tier is gekozen.
      await supabase.auth.updateUser({
        data: { topics, notification_time: time },
      });

      router.replace(nextHref);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opslaan mislukt.");
      setLoading(false);
    }
  }

  async function handleFinish() {
    const next = preTier ? `/app/checkout/${preTier}` : "/prijzen";
    await persistAndGo(next);
  }

  async function handleSkip() {
    await persistAndGo(preTier ? `/app/checkout/${preTier}` : "/prijzen");
  }

  const s = stepTitles[step];

  return (
    <div className="wz-page min-h-screen flex flex-col">
      <div
        className="flex items-center justify-between px-6 md:px-8 py-5 border-b bg-white"
        style={{ borderColor: "var(--wz-border)" }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-lg px-3 h-7"
            style={{ background: "var(--wz-blue)" }}
          >
            <Image
              src="/brand/weerzone-logo.png"
              alt="Weerzone"
              width={77}
              height={18}
              priority
              style={{ height: 18, width: "auto", display: "block" }}
            />
          </Link>
          <span className="wz-micro">Instellen</span>
        </div>
        <button
          type="button"
          onClick={handleSkip}
          disabled={loading}
          className="text-sm font-bold bg-transparent border-0 cursor-pointer p-0 hover:underline disabled:opacity-60"
          style={{ color: "var(--wz-brand)" }}
        >
          Overslaan →
        </button>
      </div>

      <div className="px-6 md:px-8 pt-6">
        <div className="max-w-[560px] mx-auto">
          <div className="flex gap-1.5">
            {stepTitles.map((_, i) => (
              <div
                key={i}
                className="flex-1 h-1 rounded-full transition-colors"
                style={{ background: i <= step ? "var(--wz-brand)" : "var(--ink-200)" }}
              />
            ))}
          </div>
          <div className="wz-small mt-2">
            Stap {step + 1} van {stepTitles.length}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-6 md:px-8 py-8">
        <div className="max-w-[560px] w-full">
          <h1 className="wz-h-1 mb-2">{s.title}</h1>
          <p className="wz-body mb-7">{s.sub}</p>

          {step === 0 && (
            <div className="grid gap-3.5">
              <button
                type="button"
                onClick={captureGps}
                disabled={gpsStatus === "asking"}
                className="flex items-center gap-3.5 text-left cursor-pointer transition-colors disabled:cursor-wait"
                style={{
                  padding: "16px 18px",
                  borderRadius: 14,
                  border: `1px solid ${gpsCoords ? "var(--wz-brand)" : "var(--wz-border)"}`,
                  background: gpsCoords ? "var(--wz-brand-soft)" : "#fff",
                }}
              >
                <span
                  className="inline-flex items-center justify-center flex-none text-white"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "var(--wz-brand)",
                  }}
                  aria-hidden="true"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  >
                    <circle cx="8" cy="8" r="6" />
                    <circle cx="8" cy="8" r="2.2" fill="currentColor" stroke="none" />
                    <path
                      d="M8 .5v2M8 13.5v2M.5 8h2M13.5 8h2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-[16px] truncate">
                    {gpsCoords
                      ? "Thuislocatie bepaald"
                      : gpsStatus === "asking"
                        ? "Even kijken…"
                        : gpsStatus === "denied"
                          ? "GPS niet gelukt"
                          : "Gebruik GPS voor thuislocatie"}
                  </div>
                  <div
                    className="text-[13px] mt-0.5 truncate"
                    style={{ color: "var(--wz-text-mute)" }}
                  >
                    {gpsCoords
                      ? `GPS · ${gpsCoords.lat.toFixed(3)}, ${gpsCoords.lon.toFixed(3)}`
                      : gpsStatus === "asking"
                        ? "Browser vraagt om toestemming"
                        : gpsStatus === "denied"
                          ? "Geen toestemming — gebruik postcode hieronder"
                          : "Je telefoon bepaalt eenmalig waar thuis is"}
                  </div>
                </div>
                <span
                  className="text-[12px] font-extrabold tracking-[0.06em] flex-none uppercase"
                  style={{
                    color: gpsCoords ? "var(--wz-brand)" : "var(--wz-text-mute)",
                  }}
                >
                  {gpsStatus === "asking"
                    ? "···"
                    : gpsCoords
                      ? "Wijzig"
                      : "Zet aan →"}
                </span>
              </button>

              {!showPostcode ? (
                <div
                  className="text-[13px] pl-1"
                  style={{ color: "var(--wz-text-mute)" }}
                >
                  Geen GPS?{" "}
                  <button
                    type="button"
                    onClick={() => setShowPostcode(true)}
                    className="underline font-bold bg-transparent border-0 p-0 cursor-pointer"
                    style={{ color: "var(--wz-brand)", font: "inherit" }}
                  >
                    Voer handmatig postcode in
                  </button>
                </div>
              ) : (
                <WzTextField
                  label="Postcode"
                  value={postcode}
                  onChange={setPostcode}
                  placeholder="1012 AB"
                  autoComplete="postal-code"
                  hint="Vier cijfers en twee letters, bijvoorbeeld 1012 AB."
                />
              )}
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-2.5">
              {TOPICS.map((o) => {
                const active = topics.includes(o.k);
                return (
                  <label
                    key={o.k}
                    className="wz-card flex items-center gap-3 cursor-pointer transition-colors"
                    style={{
                      padding: 14,
                      borderColor: active ? "var(--wz-brand)" : "var(--wz-border)",
                      background: active ? "var(--wz-brand-soft)" : "#fff",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleTopic(o.k)}
                      className="w-[18px] h-[18px]"
                      style={{ accentColor: "var(--wz-brand)" }}
                    />
                    <div className="flex-1">
                      <div
                        className="font-bold text-[15px] flex items-center gap-2"
                        style={{ color: "var(--wz-text)" }}
                      >
                        {o.t}
                        {o.reed && (
                          <span
                            className="inline-block rounded-full uppercase"
                            style={{
                              background: "#fff5c2",
                              color: "#8a6100",
                              fontSize: 9,
                              padding: "2px 6px",
                              fontWeight: 800,
                              letterSpacing: "0.04em",
                              lineHeight: 1.3,
                            }}
                          >
                            Reed
                          </span>
                        )}
                      </div>
                      <div className="text-[13px]" style={{ color: "var(--wz-text-mute)" }}>
                        {o.d}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-2.5">
              {TIMES.map((o) => {
                const active = time === o.k;
                return (
                  <label
                    key={o.k}
                    className="wz-card flex items-center gap-3 cursor-pointer transition-colors"
                    style={{
                      padding: 14,
                      borderColor: active ? "var(--wz-brand)" : "var(--wz-border)",
                      background: active ? "var(--wz-brand-soft)" : "#fff",
                    }}
                  >
                    <input
                      type="radio"
                      name="wz-time"
                      checked={active}
                      onChange={() => setTime(o.k)}
                      className="w-[18px] h-[18px]"
                      style={{ accentColor: "var(--wz-brand)" }}
                    />
                    <div className="flex-1">
                      <div className="font-bold text-[15px]" style={{ color: "var(--wz-text)" }}>
                        {o.t}
                      </div>
                      <div className="text-[13px]" style={{ color: "var(--wz-text-mute)" }}>
                        {o.d}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {error && (
            <div
              className="mt-4 text-sm rounded-lg p-3"
              style={{ background: "var(--wz-danger-bg)", color: "var(--wz-danger)" }}
            >
              {error}
            </div>
          )}

          <div className="flex gap-2.5 mt-7 justify-between">
            <button
              type="button"
              onClick={() => (step === 0 ? router.replace("/app/signup") : setStep(step - 1))}
              disabled={loading}
              className="wz-btn wz-btn-ghost disabled:opacity-60"
            >
              ← Terug
            </button>
            {step < stepTitles.length - 1 ? (
              <button
                type="button"
                onClick={() => canAdvance() && setStep(step + 1)}
                disabled={!canAdvance() || loading}
                className="wz-btn wz-btn-primary disabled:opacity-60"
              >
                Verder →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={loading}
                className="wz-btn wz-btn-primary disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Klaar, toon me de opties →"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
