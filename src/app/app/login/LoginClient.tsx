"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import WzAuthShell from "@/components/wz/WzAuthShell";
import {
  WzTextField,
  WzPasswordField,
  WzCheckbox,
  WzDivider,
  WzSocialButtons,
} from "@/components/wz/WzForm";

export default function LoginClient() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; pw?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!email.trim()) errs.email = "Vul je e-mailadres in";
    if (!password) errs.pw = "Vul je wachtwoord in";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitError(null);
    setLoading(true);
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInErr) {
      setSubmitError("E-mail of wachtwoord klopt niet.");
      setLoading(false);
      return;
    }
    // `remember` blijft visueel; Supabase bewaart sessies standaard in
    // localStorage/cookie. Toggle staat klaar voor toekomstige session-scope.
    void remember;
    router.replace("/app");
  }

  async function handleGoogle() {
    setSubmitError(null);
    setLoading(true);
    const redirectTo = `${window.location.origin}/auth/callback?next=/app`;
    const { error: oauthErr } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (oauthErr) {
      const msg = oauthErr.message.toLowerCase();
      setSubmitError(
        msg.includes("provider") || msg.includes("unsupported")
          ? "Google-login is nog niet actief. Gebruik e-mail + wachtwoord."
          : oauthErr.message,
      );
      setLoading(false);
    }
  }

  return (
    <WzAuthShell
      title="Welkom terug."
      subtitle="Log in om je persoonlijke weerbericht, voorkeuren en abonnement te beheren."
      footer={
        <>
          Nog geen account?{" "}
          <Link
            href="/app/signup"
            className="font-bold no-underline hover:underline"
            style={{ color: "var(--wz-brand)" }}
          >
            Maak er gratis één
          </Link>
        </>
      }
    >
      <h1 className="wz-h-1 mb-2">Inloggen</h1>
      <p className="wz-body mb-6">Welkom terug bij Weerzone.</p>

      <WzSocialButtons onGoogle={handleGoogle} loading={loading} />
      <WzDivider />

      <form onSubmit={handleSubmit} noValidate>
        <WzTextField
          label="E-mailadres"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="je@voorbeeld.nl"
          error={errors.email}
          autoComplete="email"
          autoFocus
        />

        <div className="flex justify-between items-baseline mb-1.5">
          <label
            className="text-[13px] font-bold"
            style={{ color: "var(--wz-text)" }}
            htmlFor="wz-login-pw"
          >
            Wachtwoord
          </label>
          <Link
            href="/app/reset"
            className="text-[13px] font-bold no-underline hover:underline"
            style={{ color: "var(--wz-brand)" }}
          >
            Vergeten?
          </Link>
        </div>
        <WzPasswordField
          id="wz-login-pw"
          value={password}
          onChange={setPassword}
          placeholder="Je wachtwoord"
          error={errors.pw}
          autoComplete="current-password"
        />

        <div className="mt-1.5 mb-4">
          <WzCheckbox checked={remember} onChange={setRemember}>
            Onthoud mij op dit apparaat
          </WzCheckbox>
        </div>

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
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Inloggen"}
        </button>
      </form>
    </WzAuthShell>
  );
}
