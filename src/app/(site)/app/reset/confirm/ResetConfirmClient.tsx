"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import WzAuthShell from "@/components/wz/WzAuthShell";
import { WzPasswordField } from "@/components/wz/WzForm";

/**
 * Na de reset-mail heeft Supabase een recovery-sessie gezet en landt de
 * gebruiker hier. We vragen een nieuw wachtwoord en roepen updateUser.
 */
export default function ResetConfirmClient() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [errors, setErrors] = useState<{ pw?: string; pw2?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      setHasSession(!!data.user);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!password || password.length < 8) errs.pw = "Minimaal 8 tekens";
    if (password2 !== password) errs.pw2 = "Wachtwoorden komen niet overeen";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitError(null);
    setLoading(true);
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateErr) {
      setSubmitError(updateErr.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.replace("/app"), 1500);
  }

  return (
    <WzAuthShell
      title="Nog even een nieuw wachtwoord."
      subtitle="Kies iets stevigs dat je goed onthoudt. Straks sta je er weer in."
    >
      {hasSession === null ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--wz-text-mute)" }} />
        </div>
      ) : !hasSession ? (
        <>
          <h1 className="wz-h-1 mb-2">Link verlopen</h1>
          <p className="wz-body mb-6">
            Deze reset-link is niet meer geldig. Vraag hieronder een nieuwe aan.
          </p>
          <Link href="/app/reset" className="wz-btn wz-btn-primary wz-btn-block wz-btn-lg">
            Nieuwe link aanvragen
          </Link>
        </>
      ) : done ? (
        <div className="text-center py-5">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-5"
            style={{ background: "var(--wz-success-bg)", color: "var(--wz-success)" }}
          >
            <Check className="w-8 h-8" strokeWidth={2.5} />
          </div>
          <h1 className="wz-h-1 mb-2">Wachtwoord ingesteld</h1>
          <p className="wz-body">We sturen je even door naar je account…</p>
        </div>
      ) : (
        <>
          <h1 className="wz-h-1 mb-2">Nieuw wachtwoord</h1>
          <p className="wz-body mb-6">Minstens 8 tekens. Dubbel invullen voor de zekerheid.</p>

          <form onSubmit={handleSubmit} noValidate>
            <WzPasswordField
              label="Nieuw wachtwoord"
              value={password}
              onChange={setPassword}
              placeholder="Minimaal 8 tekens"
              error={errors.pw}
              showStrength
              autoComplete="new-password"
              autoFocus
            />
            <WzPasswordField
              label="Herhaal wachtwoord"
              value={password2}
              onChange={setPassword2}
              placeholder="Nog een keer"
              error={errors.pw2}
              autoComplete="new-password"
            />

            {submitError && (
              <div
                className="mb-3 text-sm rounded-lg p-3"
                style={{ background: "var(--wz-danger-bg)", color: "var(--wz-danger)" }}
              >
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="wz-btn wz-btn-primary wz-btn-block wz-btn-lg disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Wachtwoord opslaan"}
            </button>
          </form>
        </>
      )}
    </WzAuthShell>
  );
}
