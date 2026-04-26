"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { formatPrice, type PersonaConfig } from "@/lib/personas";
import { WzNavbar, WzFooter } from "@/components/wz";
import { reverseGeocode } from "@/lib/types";
import { confirmCheckout } from "./actions";

interface Props {
  persona: PersonaConfig;
  email: string;
  initialName: string;
  initialPostcode: string;
}

interface GpsLocation {
  label: string;
  lat: number;
  lon: number;
}

export default function CheckoutClient({
  persona,
  email,
  initialName,
  initialPostcode,
}: Props) {
  const [name, setName] = useState(initialName);
  const [postcode, setPostcode] = useState(initialPostcode);
  const [gps, setGps] = useState<GpsLocation | null>(null);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const [method, setMethod] = useState<"ideal" | "card" | "bancontact">("ideal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function captureGps() {
    if (!("geolocation" in navigator)) {
      setGpsError("Je browser ondersteunt geen GPS. Vul je postcode in.");
      return;
    }
    setGpsBusy(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const city = await reverseGeocode(lat, lon);
          setGps({ label: city.name, lat, lon });
        } catch {
          setGpsError("Locatie ophalen mislukt. Vul anders je postcode in.");
        } finally {
          setGpsBusy(false);
        }
      },
      () => {
        setGpsBusy(false);
        setGpsError(
          "Geen toegang tot je locatie. Vul in plaats daarvan je postcode in."
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Vul je naam in.");
      return;
    }
    if (!gps && !postcode.trim()) {
      setError("Geef een thuislocatie op: GPS of postcode.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await confirmCheckout({
        tier: persona.tier,
        name,
        postcode,
        gpsLat: gps?.lat ?? null,
        gpsLon: gps?.lon ?? null,
        gpsLabel: gps?.label ?? null,
      });

      if (!result.ok) {
        setError(result.error ?? "Er is iets misgegaan.");
        setLoading(false);
        return;
      }

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onbekende fout");
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="wz-page">
        <WzNavbar />
        <div
          className="flex items-center justify-center"
          style={{ padding: 40, minHeight: 500 }}
        >
          <div
            className="bg-white rounded-3xl text-center"
            style={{
              padding: 40,
              maxWidth: 480,
              border: "1px solid var(--wz-border)",
              boxShadow: "var(--wz-shadow-md)",
            }}
          >
            <div
              className="inline-flex items-center justify-center"
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "var(--wz-success-bg)",
                color: "var(--wz-success)",
                marginBottom: 20,
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 12l5 5L20 6"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="h-1" style={{ marginBottom: 8 }}>
              Welkom bij Weerzone {persona.name}!
            </h1>
            <p className="t-body" style={{ marginBottom: 8 }}>
              Morgenochtend vóór 7:00 staat je eerste weermail klaar in je inbox op{" "}
              <strong>{gps?.label ?? postcode ?? "je thuislocatie"}</strong>.
            </p>
            <p className="t-small" style={{ marginBottom: 24 }}>
              Je bent nu tijdelijk <strong>gratis</strong> ingeschreven — geen
              creditcard nodig.
            </p>
            <Link
              href="/app/account"
              className="btn btn-primary btn-block btn-lg"
            >
              Naar mijn account →
            </Link>
          </div>
        </div>
        <WzFooter />
      </div>
    );
  }

  return (
    <div className="wz-page">
      <WzNavbar />

      <div
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: "clamp(24px, 4vw, 48px) clamp(16px, 3vw, 32px)",
        }}
      >
        <Link
          href="/prijzen"
          className="inline-flex items-center gap-1 text-[14px] font-semibold mb-4"
          style={{ color: "var(--wz-text-mute)" }}
        >
          ← Terug naar abonnementen
        </Link>

        <div
          className="checkout-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)",
            gap: "clamp(20px, 3vw, 32px)",
          }}
        >
          {/* LEFT COLUMN ---------------------------------------- */}
          <form onSubmit={submit}>
            <h1 className="h-1" style={{ marginBottom: 8 }}>
              Aanmelden voor {persona.name}
            </h1>
            <p className="t-body" style={{ marginBottom: 28 }}>
              Nu nog gratis, geen creditcard nodig. Je schrijft je in zonder
              verplichting.
            </p>

            {/* Jouw gegevens */}
            <div
              className="bg-white rounded-2xl"
              style={{
                padding: 22,
                marginBottom: 20,
                border: "1px solid var(--wz-border)",
                boxShadow: "var(--wz-shadow-sm)",
              }}
            >
              <h3 className="h-3" style={{ marginBottom: 14 }}>
                Jouw gegevens
              </h3>

              <div style={{ marginBottom: 14 }}>
                <label
                  className="block text-[13px] font-bold mb-1.5"
                  style={{ color: "var(--wz-text)" }}
                  htmlFor="ck-name"
                >
                  Naam
                </label>
                <input
                  id="ck-name"
                  className="wz-input"
                  placeholder="Jouw naam"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label
                  className="block text-[13px] font-bold mb-1.5"
                  style={{ color: "var(--wz-text)" }}
                  htmlFor="ck-email"
                >
                  E-mailadres
                </label>
                <input
                  id="ck-email"
                  className="wz-input"
                  value={email}
                  disabled
                  style={{ background: "var(--ink-050)", color: "var(--wz-text-mute)" }}
                />
              </div>

              <div style={{ marginBottom: 4 }}>
                <label
                  className="block text-[13px] font-bold mb-1.5"
                  style={{ color: "var(--wz-text)" }}
                >
                  Thuislocatie
                </label>
                <button
                  type="button"
                  onClick={captureGps}
                  disabled={gpsBusy}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    background: gps ? "var(--wz-brand-soft)" : "#fff",
                    border: `1px solid ${gps ? "var(--wz-brand)" : "var(--wz-border)"}`,
                    borderRadius: 12,
                    cursor: gpsBusy ? "wait" : "pointer",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "var(--wz-brand)",
                      color: "#fff",
                      flex: "0 0 auto",
                    }}
                  >
                    {gpsBusy ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      >
                        <circle cx="8" cy="8" r="6" />
                        <circle cx="8" cy="8" r="2.2" fill="currentColor" stroke="none" />
                        <path d="M8 .5v2M8 13.5v2M.5 8h2M13.5 8h2" strokeLinecap="round" />
                      </svg>
                    )}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>
                      {gps
                        ? gps.label
                        : gpsBusy
                          ? "Locatie bepalen…"
                          : "Gebruik GPS voor thuislocatie"}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--wz-text-mute)" }}>
                      {gps
                        ? "GPS · thuislocatie bepaald"
                        : "We bepalen je thuislocatie eenmalig via GPS"}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--wz-text-mute)",
                      fontWeight: 600,
                    }}
                  >
                    {gps ? "WIJZIG" : "ZET AAN →"}
                  </span>
                </button>
                {gpsError && (
                  <div
                    className="mt-2 text-[12px]"
                    style={{ color: "var(--wz-danger)" }}
                  >
                    {gpsError}
                  </div>
                )}
                {!gps && (
                  <div style={{ marginTop: 12 }}>
                    <label
                      className="block text-[12px] font-semibold mb-1"
                      style={{ color: "var(--wz-text-mute)" }}
                      htmlFor="ck-postcode"
                    >
                      Of vul je postcode in (handmatig)
                    </label>
                    <input
                      id="ck-postcode"
                      className="wz-input"
                      placeholder="1234 AB"
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value)}
                      style={{ fontSize: 14, padding: "10px 12px" }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Betaalmethode — later */}
            <div
              className="bg-white rounded-2xl"
              style={{
                padding: 22,
                border: "1px solid var(--wz-border)",
                boxShadow: "var(--wz-shadow-sm)",
              }}
            >
              <h3 className="h-3" style={{ marginBottom: 6 }}>
                Betaalmethode — later
              </h3>
              <p className="t-small" style={{ marginBottom: 14 }}>
                Je betaalt nu niets. Zodra we live gaan vragen we je je
                betaalmethode te bevestigen.
              </p>
              <div style={{ display: "grid", gap: 10 }}>
                {(
                  [
                    ["ideal", "iDEAL", "Direct via je bank"],
                    ["card", "Creditcard", "Visa, Mastercard, Amex"],
                    ["bancontact", "Bancontact", "Voor Belgische klanten"],
                  ] as const
                ).map(([k, l, d]) => (
                  <label
                    key={k}
                    style={{
                      padding: 14,
                      cursor: "pointer",
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      borderRadius: 12,
                      borderWidth: 1,
                      borderStyle: "solid",
                      borderColor:
                        method === k ? "var(--wz-brand)" : "var(--wz-border)",
                      background: method === k ? "var(--wz-brand-soft)" : "#fff",
                    }}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      checked={method === k}
                      onChange={() => setMethod(k)}
                      style={{
                        width: 18,
                        height: 18,
                        accentColor: "var(--wz-brand)",
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{l}</div>
                      <div style={{ fontSize: 13, color: "var(--wz-text-mute)" }}>
                        {d}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div
                className="mt-4 rounded-xl px-4 py-3 text-sm"
                style={{
                  background: "var(--wz-danger-bg)",
                  color: "var(--wz-danger)",
                  border: "1px solid var(--wz-danger)",
                }}
              >
                {error}
              </div>
            )}

            {/* Mobile-only CTA — op desktop staat de knop rechts in de sticky kaart */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-block btn-lg checkout-mobile-cta disabled:opacity-60"
              style={{ marginTop: 20 }}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Bevestig aanmelding"
              )}
            </button>
          </form>

          {/* RIGHT COLUMN -------------------------------------- */}
          <div>
            <div
              className="bg-white rounded-2xl"
              style={{
                padding: 22,
                position: "sticky",
                top: 88,
                border: "1px solid var(--wz-border)",
                boxShadow: "var(--wz-shadow-md)",
              }}
            >
              <div className="t-micro" style={{ marginBottom: 8 }}>
                Besteloverzicht
              </div>
              <h3 className="h-2" style={{ marginBottom: 4 }}>
                Weerzone {persona.name}
              </h3>
              <p className="t-small" style={{ marginBottom: 20 }}>
                {persona.tagline}
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  borderTop: "1px solid var(--wz-border)",
                }}
              >
                <span className="t-small">Abonnement</span>
                <span style={{ fontSize: 14, fontWeight: 700 }}>
                  {persona.name} · {persona.label}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  borderTop: "1px solid var(--wz-border)",
                }}
              >
                <span className="t-small">Periode</span>
                <span style={{ fontSize: 14, fontWeight: 700 }}>
                  Tijdelijk gratis
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  borderTop: "1px solid var(--wz-border)",
                }}
              >
                <span className="t-small">Normale prijs straks</span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--wz-text-mute)",
                  }}
                >
                  {formatPrice(persona.priceCents || 0)}/mnd
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  padding: "16px 0 0",
                  borderTop: "2px solid var(--ink-900)",
                  marginTop: 4,
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 800 }}>
                  Vandaag te betalen
                </span>
                <span style={{ fontSize: 24, fontWeight: 800 }}>€0,00</span>
              </div>
              <div
                className="t-small"
                style={{ textAlign: "right", marginTop: 4 }}
              >
                Straks: {formatPrice(persona.priceCents || 0)}/mnd · opzeggen kan
                maandelijks
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  (document.querySelector("form") as HTMLFormElement)?.requestSubmit()
                }
                className="btn btn-primary btn-block btn-lg checkout-desktop-cta disabled:opacity-60"
                style={{ marginTop: 20 }}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Bevestig aanmelding"
                )}
              </button>
              <p
                className="t-small"
                style={{ marginTop: 12, textAlign: "center" }}
              >
                Geen creditcard nodig. Opzeggen op elk moment.
              </p>
            </div>
          </div>
        </div>
      </div>

      <WzFooter />

      <style>{`
        .checkout-desktop-cta { display: inline-flex; }
        .checkout-mobile-cta  { display: none; }
        @media (max-width: 760px) {
          .checkout-grid { grid-template-columns: 1fr !important; }
          .checkout-desktop-cta { display: none; }
          .checkout-mobile-cta  { display: inline-flex; }
        }
      `}</style>
    </div>
  );
}
