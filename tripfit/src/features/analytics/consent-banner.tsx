"use client";

import { useEffect, useState } from "react";

import { setAnalyticsConsent } from "./client";

type ConsentState = "loading" | "unset" | "granted" | "denied";

export function AnalyticsConsentBanner() {
  const [consent, setConsent] = useState<ConsentState>("loading");

  useEffect(() => {
    void fetch("/api/analytics/consent", { cache: "no-store" })
      .then((response) => response.json())
      .then((result: { consent?: ConsentState }) =>
        setConsent(result.consent ?? "unset"),
      )
      .catch(() => setConsent("unset"));
  }, []);

  if (consent !== "unset") return null;

  const choose = async (value: "granted" | "denied") => {
    if (!(await setAnalyticsConsent(value))) return;
    setConsent(value);
    if (value === "granted") {
      window.dispatchEvent(new Event("calor:analytics-consent-granted"));
    }
  };

  return (
    <aside
      aria-label="Keuze voor gebruiksmeting"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-2xl border border-white/15 bg-ink/95 p-5 text-white shadow-2xl backdrop-blur-xl sm:bottom-6 sm:p-6"
    >
      <p className="text-base font-bold">Mag Calor anoniem leren?</p>
      <p className="mt-2 text-sm leading-6 text-white/70">
        We meten welke onderdelen helpen. Geen e-mail, kindleeftijden of
        verblijfsadres.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-ink"
          onClick={() => void choose("granted")}
          type="button"
        >
          Akkoord
        </button>
        <button
          className="rounded-full border border-white/25 px-5 py-2.5 text-sm font-bold text-white"
          onClick={() => void choose("denied")}
          type="button"
        >
          Niet nodig
        </button>
      </div>
    </aside>
  );
}

