"use client";

import { useState } from "react";
import { type PersonaConfig } from "@/lib/personas";
import WzAuthShell from "@/components/wz/WzAuthShell";
import { WzTextField, WzCheckbox } from "@/components/wz/WzForm";
import { Loader2 } from "lucide-react";

interface Props {
  persona: PersonaConfig;
  email: string;
  initialName: string;
  initialPostcode: string;
}

export default function CheckoutClient({ persona, email, initialName, initialPostcode }: Props) {
  const [name, setName] = useState(initialName);
  const [postcode, setPostcode] = useState(initialPostcode);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/checkout-persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, postcode, tier: persona.tier }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Er is iets misgegaan");
      }
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("Geen checkout URL ontvangen");
      }
    } catch (err: any) {
      alert(err.message);
      setLoading(false);
    }
  }

  return (
    <WzAuthShell
      title={`Start met ${persona.name}`}
      subtitle={persona.tagline}
      footer={<p className="text-xs">Je wordt doorgestuurd naar Mollie voor een veilige betaling.</p>}
    >
      <h1 className="wz-h-1 mb-2">Bevestig je plan</h1>
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
        <div className="flex justify-between items-center">
          <span className="font-bold">{persona.name}</span>
          <span className="text-slate-500">€{(persona.founderPriceCents / 100).toFixed(2)}/mnd</span>
        </div>
        <div className="text-xs text-slate-400 mt-1">{persona.label}</div>
      </div>

      <form onSubmit={handleCheckout}>
        <WzTextField
          label="Naam"
          value={name}
          onChange={setName}
          placeholder="Volledige naam"
          required
        />
        <WzTextField
          label="E-mail"
          value={email}
          disabled
          onChange={() => {}}
          placeholder="je@voorbeeld.nl"
        />
        <WzTextField
          label="Postcode"
          value={postcode}
          onChange={setPostcode}
          placeholder="1234 AB"
          required
        />

        <div className="my-4">
          <WzCheckbox checked={agreed} onChange={setAgreed}>
            Ik ga akkoord met de automatische incasso en voorwaarden.
          </WzCheckbox>
        </div>

        <button
          type="submit"
          disabled={loading || !agreed}
          className="wz-btn wz-btn-primary wz-btn-block wz-btn-lg disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Afrekenen"}
        </button>
      </form>
    </WzAuthShell>
  );
}
