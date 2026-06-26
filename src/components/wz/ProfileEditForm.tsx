"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile, deleteAccount } from "@/app/actions";
import { Loader2, MapPin, Check, Lock, Trash2, AlertTriangle } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { WzTextField } from "./WzForm";
import Link from "next/link";
import { reverseGeocode } from "@/lib/types";
import { persistCity } from "@/lib/persist-city";

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
  const [showDanger, setShowDanger] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const emailMatches = confirmEmail.trim().toLowerCase() === user.email.toLowerCase();

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
          const city = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          const res = await updateProfile({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            locationName: city.name,
          });

          if (res.ok) {
            persistCity(city);
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

  async function handleDelete() {
    if (!emailMatches) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await deleteAccount({ confirmEmail });
      if (res.ok) {
        await createSupabaseBrowserClient().auth.signOut();
        window.location.assign("/?deleted=1");
      } else {
        setDeleteError(res.error || "Verwijderen mislukt");
        setDeleting(false);
      }
    } catch {
      setDeleteError("Verwijderen mislukt");
      setDeleting(false);
    }
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

      <div className="pt-4 border-t border-[var(--wz-border)]">
        <h3 className="text-xs font-black uppercase tracking-widest text-red-600 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-3 h-3" /> Gevarenzone
        </h3>

        {!showDanger ? (
          <button
            type="button"
            onClick={() => setShowDanger(true)}
            className="flex w-full items-center justify-between p-4 rounded-2xl border border-red-200 hover:bg-red-50 transition-all group"
          >
            <div className="text-left">
              <p className="text-sm font-bold text-red-600">Account verwijderen</p>
              <p className="text-[10px] text-[var(--ink-400)]">Onomkeerbaar — al je gegevens en agents verdwijnen</p>
            </div>
            <Trash2 className="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors" />
          </button>
        ) : (
          <div className="p-4 rounded-2xl border border-red-200 bg-red-50 space-y-3">
            <p className="text-xs text-[var(--ink-700)]">
              Dit verwijdert je account, je locaties en je agents definitief. Dit kan niet
              ongedaan worden gemaakt. Typ <span className="font-bold">{user.email}</span> om
              te bevestigen.
            </p>
            <WzTextField
              label="Bevestig je e-mailadres"
              value={confirmEmail}
              onChange={setConfirmEmail}
              placeholder={user.email}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowDanger(false); setConfirmEmail(""); setDeleteError(null); }}
                className="flex-1 py-2.5 rounded-xl border border-[var(--wz-border)] text-sm font-bold text-[var(--ink-700)] hover:bg-white transition-colors"
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!emailMatches || deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? "Verwijderen..." : "Definitief verwijderen"}
              </button>
            </div>
            {deleteError && <p className="text-xs text-red-600 text-center font-bold">{deleteError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
