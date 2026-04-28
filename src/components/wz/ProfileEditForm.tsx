"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/actions";
import { Loader2, MapPin, Check, Lock } from "lucide-react";
import { WzTextField } from "./WzForm";
import Link from "next/link";

interface Props {
  user: { email: string; id: string };
  profile: { full_name?: string; postcode?: string } | null;
  onSuccess?: () => void;
}

export default function ProfileEditForm({ user, profile, onSuccess }: Props) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(profile?.full_name?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(profile?.full_name?.split(" ").slice(1).join(" ") || "");
  const [postcode, setPostcode] = useState(profile?.postcode || "");
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await updateProfile({
        fullName: `${firstName} ${lastName}`.trim(),
        postcode,
      });

      if (res.ok) {
        setSuccess(true);
        router.refresh();
        if (onSuccess) onSuccess();
        // Reset success state after a few seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(res.error || "Er ging iets mis");
      }
    } catch (err: any) {
      setError(err.message || "Er ging iets mis");
    } finally {
      setLoading(false);
    }
  }

  async function handleGPS() {
    if (!navigator.geolocation) {
      setError("GPS is niet beschikbaar in je browser");
      return;
    }

    setGpsLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await updateProfile({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });

          if (res.ok) {
            setSuccess(true);
            router.refresh();
            setTimeout(() => setSuccess(false), 3000);
            if (onSuccess) onSuccess();
          } else {
            setError(res.error || "Locatie bijwerken mislukt");
          }
        } catch (err) {
          setError("Locatie bijwerken mislukt");
        } finally {
          setGpsLoading(false);
        }
      },
      () => {
        setError("Toegang tot locatie geweigerd");
        setGpsLoading(false);
      },
      { timeout: 10000 }
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <WzTextField
            label="Voornaam"
            value={firstName}
            onChange={setFirstName}
            placeholder="Jan"
            required
          />
          <WzTextField
            label="Achternaam"
            value={lastName}
            onChange={setLastName}
            placeholder="de Boer"
            required
          />
        </div>

        <div className="relative">
          <WzTextField
            label="Postcode"
            value={postcode}
            onChange={setPostcode}
            placeholder="1234 AB"
          />
          <button
            type="button"
            onClick={handleGPS}
            disabled={gpsLoading}
            className="absolute right-2 top-8 p-2 rounded-lg hover:bg-[var(--ink-050)] transition-colors text-[var(--wz-brand)] disabled:opacity-50"
            title="Gebruik mijn huidige GPS locatie"
          >
            {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
          </button>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[var(--wz-brand)] text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : success ? (
              <Check className="w-4 h-4" />
            ) : null}
            {success ? "Gegevens opgeslagen!" : loading ? "Verwerken..." : "Wijzigingen opslaan"}
          </button>
          
          {error && <p className="text-xs text-red-500 text-center font-bold">{error}</p>}
        </div>
      </form>

      <div className="pt-4 border-t border-[var(--wz-border)]">
        <h3 className="text-xs font-black uppercase tracking-widest text-[var(--ink-900)] mb-3 flex items-center gap-2">
          <Lock className="w-3 h-3" /> Beveiliging
        </h3>
        <Link 
          href="/app/reset"
          className="flex items-center justify-between p-4 rounded-2xl border border-[var(--wz-border)] hover:bg-[var(--ink-050)] transition-all group"
        >
          <div>
            <p className="text-sm font-bold text-[var(--ink-800)]">Wachtwoord wijzigen</p>
            <p className="text-[10px] text-[var(--ink-400)]">Stuur een beveiligde link naar je e-mail</p>
          </div>
          <span className="text-[var(--ink-300)] group-hover:text-[var(--ink-900)] transition-colors">→</span>
        </Link>
      </div>
    </div>
  );
}
