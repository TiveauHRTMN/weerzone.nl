"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { PERSONA_ORDER, type PersonaTier } from "@/lib/personas";
import { WzTextField } from "@/components/wz/WzForm";
import { updateProfile, geocodePostcode } from "@/app/actions";
import { trackEvent } from "@/lib/analytics";
import PwaInstallCard from "@/components/PwaInstallCard";
import {
  buildOnboardingMoments,
  replaceOnboardingMoments,
  type OnboardingTransport,
  type OnboardingDepart,
  type OnboardingHome,
  type OnboardingOutdoor,
  type OnboardingDogMorning,
  type OnboardingDogEvening,
} from "@/lib/agents/moments-client";

type TopicKey = "rain" | "temp" | "wind" | "uv" | "snow";
type TimeKey = "06:30" | "07:00" | "08:00" | "avond";

// `reed: true` markeert onderwerpen waarbij Reed extra scherp meekijkt.
const TOPICS: Array<{ k: TopicKey; t: string; d: string; reed?: boolean }> = [
  { k: "rain", t: "Regen & buien", d: "Meldingen bij regenkans boven 70%" },
  { k: "temp", t: "Temperatuur", d: "Bij hitte, vorst of scherpe wisselingen" },
  { k: "wind", t: "Wind & storm", d: "Code geel, oranje of rood", reed: true },
  { k: "uv", t: "UV & pollen", d: "Voor buitenplannen en allergieën" },
  { k: "snow", t: "Winterweer", d: "Sneeuw, gladheid en ijsvorming", reed: true },
];

type AgentKey = "piet" | "reed" | "koos";
const AGENTS: Array<{ k: AgentKey; t: string; d: string; dot: string }> = [
  { k: "piet", t: "Piet", d: "Elke ochtend je weerbericht", dot: "#0284C7" },
  { k: "reed", t: "Reed", d: "Alleen bij onweer, storm of zware regen", dot: "#EA580C" },
  { k: "koos", t: "Koos", d: "Tips voor een dagje weg", dot: "#059669" },
];

const TIMES: Array<{ k: TimeKey; t: string; d: string }> = [
  { k: "06:30", t: "Vroege vogel", d: "06:30 — voordat je de deur uit gaat" },
  { k: "07:00", t: "Ontbijt", d: "07:00 — bij je eerste bak koffie" },
  { k: "08:00", t: "Rustige start", d: "08:00 — voor een relaxte ochtend" },
  { k: "avond", t: "Avond vooruitblik", d: "19:00 — weer voor morgen, vanavond al" },
];

type BudgetKey = "moments_only" | "standard" | "low";

const TRANSPORTS: Array<{ k: OnboardingTransport; t: string; reward: string }> = [
  { k: "bike", t: "Fiets", reward: "“Regenpak mee om 8:10 — je rijdt door een bui heen. Eerder weg scheelt.”" },
  { k: "ov", t: "OV", reward: "“Paraplu mee naar de halte — rond 8:20 trekt er een bui over.”" },
  { k: "car", t: "Auto", reward: "“Bij gladheid of storm hoor je het van Reed vóór je vertrekt.”" },
  { k: "home", t: "Ik werk thuis", reward: "“Dan hou ik het droogste venster voor je lunchrondje in de gaten.”" },
];

const DEPARTS: Array<{ k: OnboardingDepart; t: string }> = [
  { k: "voor8", t: "Vóór 8" },
  { k: "8tot9", t: "Tussen 8 en 9" },
  { k: "na9", t: "Na 9" },
];

const HOMES: Array<{ k: OnboardingHome; t: string }> = [
  { k: "rond17", t: "Rond 17:00" },
  { k: "rond18", t: "Rond 18:00" },
  { k: "later", t: "Later" },
];

const OUTDOORS: Array<{ k: OnboardingOutdoor; t: string; reward: string }> = [
  { k: "dog", t: "Hond uitlaten", reward: "“Laat 'm vóór 21:00 uit — daarna regent het tot middernacht.”" },
  { k: "sport", t: "Hardlopen of sporten", reward: "“Tussen 18:00 en 19:30 is het droog — mooi venster voor je rondje.”" },
  { k: "garden", t: "Tuin", reward: "“Zaterdagochtend blijft het droog — de middag wordt nat.”" },
];

const DOG_MORNINGS: Array<{ k: OnboardingDogMorning; t: string }> = [
  { k: "6tot7", t: "Tussen 6 en 7" },
  { k: "7tot8", t: "Tussen 7 en 8" },
  { k: "8tot9", t: "Tussen 8 en 9" },
];

const DOG_EVENINGS: Array<{ k: OnboardingDogEvening; t: string }> = [
  { k: "20tot21", t: "Tussen 20 en 21" },
  { k: "21tot22", t: "Tussen 21 en 22" },
  { k: "later", t: "Later" },
];

const BUDGETS: Array<{ k: BudgetKey; t: string; d: string; reward: string }> = [
  { k: "moments_only", t: "Alleen als het mijn plannen raakt", d: "Piet zwijgt tenzij een bui jouw momenten kruist", reward: "“Afgesproken: alleen als het jouw dag raakt.”" },
  { k: "standard", t: "Bij elke omslag", d: "Nooit meer dan drie seintjes per dag", reward: "“Bij elke omslag een seintje — en verder hou ik m'n mond.”" },
  { k: "low", t: "Zo min mogelijk", d: "Hooguit één per dag", reward: "“Hooguit één per dag, alleen als het er echt toe doet.”" },
];

export default function OnboardingClient({ email }: { email: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const queryTier = searchParams?.get("tier") as PersonaTier | null;
  const preTier =
    queryTier && PERSONA_ORDER.includes(queryTier) ? queryTier : null;

  const [step, setStep] = useState(0);
  const [postcode, setPostcode] = useState("");
  const [showPostcode, setShowPostcode] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "asking" | "ok" | "denied">("idle");
  const [authChecked, setAuthChecked] = useState(false);
  const [topics, setTopics] = useState<TopicKey[]>(["rain", "temp"]);
  const [agents, setAgents] = useState<{ piet: boolean; reed: boolean; koos: boolean }>({
    piet: true,
    reed: false,
    koos: false,
  });
  const [time, setTime] = useState<TimeKey>("07:00");
  const [transport, setTransport] = useState<OnboardingTransport | null>(null);
  const [depart, setDepart] = useState<OnboardingDepart>("8tot9");
  const [home, setHome] = useState<OnboardingHome>("rond18");
  const [outdoor, setOutdoor] = useState<OnboardingOutdoor[]>([]);
  const [dogMorning, setDogMorning] = useState<OnboardingDogMorning>("7tot8");
  const [dogEvening, setDogEvening] = useState<OnboardingDogEvening>("21tot22");
  const [budget, setBudget] = useState<BudgetKey>("standard");
  const [freeday, setFreeday] = useState(false); // opt-in ⇒ default uit
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
      title: "Hoe beweeg jij je meestal?",
      sub: "Piet: “Dan weet ik wanneer jij buiten bent — en wanneer ik m'n mond moet houden.”",
    },
    {
      title: "Wat doe jij buiten?",
      sub: "Piet: “Tik aan wat op jou slaat. Alles is later bij te stellen.”",
    },
    {
      title: "Wanneer wil je Piet zeker horen?",
      sub: "Piet: “Zeg het maar — ik ben er niet om je scherm te laten trillen.”",
    },
    {
      title: "Waar wil je op geattendeerd worden?",
      sub: "Kies de onderwerpen die jij belangrijk vindt. Je kunt dit altijd aanpassen.",
    },
    {
      title: "Wanneer wil je je bericht?",
      sub: "We sturen je één keer per dag een e-mail met Piet's Update, afgestemd op jouw voorkeuren.",
    },
    {
      title: "Zet Weerzone op je telefoon",
      sub: "Piet: “Dan bereiken mijn seintjes je ook onderweg — op iPhone kan het alleen zo.”",
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
    if (step === 4) return topics.length > 0;
    return true; // vragen 1-3 en de telefoon-stap mogen altijd door (overslaan is oké)
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

      const trimmedPostcode = postcode.trim().toUpperCase();

      // Coördinaten bepalen: GPS heeft voorrang, anders geocoden we de postcode.
      // Zonder coördinaten valt het account uit de agent-cron (die filtert op
      // niet-null primary_lat/lon), dus dit is wat de e-mail laat aankomen.
      let coords: { lat: number; lon: number } | null = gpsCoords;
      if (!coords && trimmedPostcode) {
        const geo = await geocodePostcode(trimmedPostcode);
        if (geo) {
          coords = { lat: geo.lat, lon: geo.lon };
        } else {
          setError("Die postcode konden we niet vinden. Controleer 'm of gebruik GPS.");
          setLoading(false);
          return;
        }
      }

      // Een agent is alleen zinvol "aan" als er een locatie is om over te mailen.
      const hasLocation = !!coords;

      await supabase.from("user_profile").upsert(
        {
          id: uid,
          email,
          postcode: trimmedPostcode || null,
          primary_lat: coords?.lat ?? null,
          primary_lon: coords?.lon ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

      const preferenceResult = await updateProfile({
        pietOn: hasLocation && agents.piet,
        reedOn: hasLocation && agents.reed,
        koosOn: hasLocation && agents.koos,
      });
      if (!preferenceResult.ok) throw new Error(preferenceResult.error ?? "Voorkeuren opslaan mislukt.");

      // Piets vragen (spec agent-headsup §3C): antwoorden zijn momenten-rijen +
      // een persoonlijk budget. Fail-soft: mislukt dit, dan blokkeert het de
      // onboarding niet (bijstellen kan altijd in de regiekamer).
      const moments = buildOnboardingMoments(transport, depart, home, outdoor, dogMorning, dogEvening);
      const momentsResult = await replaceOnboardingMoments(supabase, uid, moments);
      const budgetResult = await updateProfile({ headsupBudget: budget, freedayHeadsup: freeday });
      if (!momentsResult.ok || !budgetResult.ok) {
        console.error("[onboarding] momenten/budget opslaan mislukte (niet blokkerend)");
      }
      trackEvent("onboarding_profile", {
        transport: transport ?? "geen",
        outdoor: [...outdoor].sort().join(",") || "geen",
        moments: moments.length,
        budget,
        freeday,
      });

      if (coords) {
        await supabase
          .from("user_locations")
          .delete()
          .eq("user_id", uid)
          .eq("is_primary", true);
        await supabase.from("user_locations").insert({
          user_id: uid,
          label: "Thuis",
          lat: coords.lat,
          lon: coords.lon,
          is_primary: true,
        });
      }

      // Onderwerpen + meldingstijd: in user_metadata. Mijn Weerzone gebruikt
      // deze later voor persoonlijke heads-ups. agent_preferences blijft gelijk
      // aan de gegate-waarde (geen locatie ⇒ alles uit), want metadata wint van
      // het profiel in preferencesFromProfile.
      await supabase.auth.updateUser({
        data: {
          topics,
          notification_time: time,
          agent_preferences: {
            piet: hasLocation && agents.piet,
            reed: hasLocation && agents.reed,
            koos: hasLocation && agents.koos,
          },
        },
      });

      router.replace(nextHref);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opslaan mislukt.");
      setLoading(false);
    }
  }

  async function handleFinish() {
    await persistAndGo("/mijn-weerzone");
  }

  async function handleSkip() {
    await persistAndGo("/mijn-weerzone");
  }

  const s = stepTitles[step];

  function Chip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="cursor-pointer rounded-full border px-4 py-2.5 text-[14px] font-bold transition-colors"
        style={{
          borderColor: active ? "var(--wz-brand)" : "var(--wz-border)",
          background: active ? "var(--wz-brand-soft)" : "#fff",
          color: "var(--wz-text)",
        }}
      >
        {label}
      </button>
    );
  }

  function Reward({ text }: { text: string | null }) {
    if (!text) return null;
    return (
      <div
        className="rounded-2xl p-3.5 text-[13px] font-semibold leading-relaxed"
        style={{ background: "var(--wz-brand-soft)", color: "var(--wz-text)" }}
      >
        <span className="mr-1.5" aria-hidden>💬</span>
        Piet zegt dan bijvoorbeeld: {text}
      </div>
    );
  }

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
            <div className="grid gap-4">
              <div className="flex flex-wrap gap-2">
                {TRANSPORTS.map((o) => (
                  <Chip key={o.k} active={transport === o.k} label={o.t} onClick={() => setTransport(o.k)} />
                ))}
              </div>
              {transport && transport !== "home" && (
                <>
                  <div className="wz-micro" style={{ color: "var(--wz-text-mute)" }}>Wanneer ga je meestal weg?</div>
                  <div className="flex flex-wrap gap-2">
                    {DEPARTS.map((o) => (
                      <Chip key={o.k} active={depart === o.k} label={o.t} onClick={() => setDepart(o.k)} />
                    ))}
                  </div>
                  <div className="wz-micro" style={{ color: "var(--wz-text-mute)" }}>En weer thuis?</div>
                  <div className="flex flex-wrap gap-2">
                    {HOMES.map((o) => (
                      <Chip key={o.k} active={home === o.k} label={o.t} onClick={() => setHome(o.k)} />
                    ))}
                  </div>
                </>
              )}
              <Reward text={TRANSPORTS.find((o) => o.k === transport)?.reward ?? null} />
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4">
              <div className="flex flex-wrap gap-2">
                {OUTDOORS.map((o) => (
                  <Chip
                    key={o.k}
                    active={outdoor.includes(o.k)}
                    label={o.t}
                    onClick={() =>
                      setOutdoor((prev) => (prev.includes(o.k) ? prev.filter((x) => x !== o.k) : [...prev, o.k]))
                    }
                  />
                ))}
                <Chip active={outdoor.length === 0} label="Weinig, eigenlijk" onClick={() => setOutdoor([])} />
              </div>
              {outdoor.includes("dog") && (
                <>
                  <div className="wz-micro" style={{ color: "var(--wz-text-mute)" }}>Wanneer is de ochtendronde meestal?</div>
                  <div className="flex flex-wrap gap-2">
                    {DOG_MORNINGS.map((o) => (
                      <Chip key={o.k} active={dogMorning === o.k} label={o.t} onClick={() => setDogMorning(o.k)} />
                    ))}
                  </div>
                  <div className="wz-micro" style={{ color: "var(--wz-text-mute)" }}>En de avondronde?</div>
                  <div className="flex flex-wrap gap-2">
                    {DOG_EVENINGS.map((o) => (
                      <Chip key={o.k} active={dogEvening === o.k} label={o.t} onClick={() => setDogEvening(o.k)} />
                    ))}
                  </div>
                </>
              )}
              <Reward
                text={
                  outdoor.length === 0
                    ? "“Prima — dan hoor je me alleen als het echt uitmaakt.”"
                    : OUTDOORS.find((o) => o.k === outdoor[outdoor.length - 1])?.reward ?? null
                }
              />
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-2.5">
              {BUDGETS.map((o) => {
                const active = budget === o.k;
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
                      name="wz-budget"
                      checked={active}
                      onChange={() => setBudget(o.k)}
                      className="w-[18px] h-[18px]"
                      style={{ accentColor: "var(--wz-brand)" }}
                    />
                    <div className="flex-1">
                      <div className="font-bold text-[15px]" style={{ color: "var(--wz-text)" }}>{o.t}</div>
                      <div className="text-[13px]" style={{ color: "var(--wz-text-mute)" }}>{o.d}</div>
                    </div>
                  </label>
                );
              })}
              <div className="wz-micro mt-2" style={{ color: "var(--wz-text-mute)" }}>
                Mag Piet op een vrije dag &rsquo;s ochtends vragen wat je gaat doen?
              </div>
              <div className="flex flex-wrap gap-2">
                <Chip active={freeday} label="Ja, handig" onClick={() => setFreeday(true)} />
                <Chip active={!freeday} label="Nee, alleen mijn ritme" onClick={() => setFreeday(false)} />
              </div>
              <Reward text={BUDGETS.find((o) => o.k === budget)?.reward ?? null} />
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-2.5">
              <p className="wz-micro" style={{ color: "var(--wz-text-mute)" }}>
                Welke agents mogen je een seintje geven? (alleen e-mail — op de site zie je altijd alles)
              </p>
              {AGENTS.map((a) => {
                const active = agents[a.k];
                return (
                  <label
                    key={a.k}
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
                      onChange={() => setAgents((s) => ({ ...s, [a.k]: !s[a.k] }))}
                      className="w-[18px] h-[18px]"
                      style={{ accentColor: "var(--wz-brand)" }}
                    />
                    <div className="flex-1">
                      <div
                        className="font-bold text-[15px] flex items-center gap-2"
                        style={{ color: "var(--wz-text)" }}
                      >
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full"
                          style={{ background: a.dot }}
                          aria-hidden
                        />
                        {a.t}
                      </div>
                      <div className="text-[13px]" style={{ color: "var(--wz-text-mute)" }}>
                        {a.d}
                      </div>
                    </div>
                  </label>
                );
              })}
              <div
                className="mt-2 mb-1 text-[11px] font-bold uppercase tracking-[0.14em]"
                style={{ color: "var(--wz-text-mute)" }}
              >
                Fijn afstellen
              </div>
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

          {step === 5 && (
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

          {step === 6 && (
            <div className="grid gap-4">
              <PwaInstallCard />
              <p className="text-[13px]" style={{ color: "var(--wz-text-mute)" }}>
                Al gebeurd of liever niet? Dan ben je nu klaar — je vindt alles terug in Mijn Weerzone.
              </p>
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
