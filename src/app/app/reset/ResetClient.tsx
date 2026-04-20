"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import WzAuthShell from "@/components/wz/WzAuthShell";
import { WzTextField } from "@/components/wz/WzForm";

export default function ResetClient() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !/.+@.+\..+/.test(email)) {
      setError("Vul een geldig e-mailadres in");
      return;
    }
    setError(null);
    setLoading(true);
    const redirectTo = `${window.location.origin}/auth/callback?next=/app/reset/confirm`;
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo },
    );
    setLoading(false);
    if (resetErr) {
      setError(resetErr.message);
      return;
    }
    setSent(true);
  }

  return (
    <WzAuthShell
      title="Geen zorgen, dat lossen we zo op."
      subtitle="Vul je e-mailadres in en we sturen je binnen een minuut een link om een nieuw wachtwoord in te stellen."
    >
      {!sent ? (
        <>
          <h1 className="wz-h-1 mb-2">Wachtwoord vergeten</h1>
          <p className="wz-body mb-6">
            Vul je e-mailadres in. We sturen je een link om je wachtwoord opnieuw in te stellen.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <WzTextField
              label="E-mailadres"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="je@voorbeeld.nl"
              error={error ?? undefined}
              autoFocus
              autoComplete="email"
            />
            <button
              type="submit"
              disabled={loading}
              className="wz-btn wz-btn-primary wz-btn-block wz-btn-lg disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Stuur reset link"}
            </button>
          </form>

          <p className="text-sm text-center mt-5" style={{ color: "var(--wz-text-mute)" }}>
            <Link
              href="/app/login"
              className="font-bold no-underline hover:underline"
              style={{ color: "var(--wz-brand)" }}
            >
              ← Terug naar inloggen
            </Link>
          </p>
        </>
      ) : (
        <div className="text-center py-5">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-5"
            style={{ background: "var(--wz-success-bg)", color: "var(--wz-success)" }}
          >
            <Check className="w-8 h-8" strokeWidth={2.5} />
          </div>
          <h1 className="wz-h-1 mb-2">Check je inbox</h1>
          <p className="wz-body mb-6">
            We hebben een link gestuurd naar{" "}
            <strong style={{ color: "var(--wz-text)" }}>{email}</strong>. Klik erop om je wachtwoord opnieuw in te stellen.
          </p>
          <Link href="/app/login" className="wz-btn wz-btn-ghost wz-btn-block">
            Terug naar inloggen
          </Link>
          <p className="text-sm mt-5" style={{ color: "var(--wz-text-mute)" }}>
            Geen e-mail ontvangen?{" "}
            <button
              type="button"
              onClick={() => setSent(false)}
              className="font-bold bg-transparent border-0 cursor-pointer p-0"
              style={{ color: "var(--wz-brand)" }}
            >
              Opnieuw proberen
            </button>
          </p>
        </div>
      )}
    </WzAuthShell>
  );
}
