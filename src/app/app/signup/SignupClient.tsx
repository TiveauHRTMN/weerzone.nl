"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { registerUser } from "@/app/actions";
import { PERSONA_ORDER, type PersonaTier } from "@/lib/personas";
import WzAuthShell from "@/components/wz/WzAuthShell";
import {
  WzTextField,
  WzPasswordField,
  WzCheckbox,
  WzDivider,
  WzSocialButtons,
} from "@/components/wz/WzForm";

/**
 * Signup conform design handoff: naam, e-mail, wachtwoord, akkoord.
 */
export default function SignupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const queryTier = searchParams?.get("tier") as PersonaTier | null;
  const preTier =
    queryTier && PERSONA_ORDER.includes(queryTier) ? queryTier : null;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(searchParams?.get("email") || "");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    pw?: string;
    agree?: string;
  }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function nextAfterSignup(): string {
    const next = searchParams?.get("next");
    if (next) return next;
    return preTier ? `/app/onboarding?tier=${preTier}` : "/app/onboarding";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!fullName.trim()) errs.name = "Vul je naam in";
    if (!email.trim() || !/.+@.+\..+/.test(email)) errs.email = "Vul een geldig e-mailadres in";
    if (!password || password.length < 8) errs.pw = "Minimaal 8 tekens";
    if (!agree) errs.agree = "Je moet akkoord gaan met de voorwaarden";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitError(null);
    setLoading(true);
    const result = await registerUser({
      email: email.trim(),
      password,
      tier: preTier,
      fullName: fullName.trim(),
    });
    if (!result.ok) {
      setSubmitError(result.error);
      setLoading(false);
      return;
    }

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInErr) {
      setSubmitError(`Inloggen mislukt: ${signInErr.message}`);
      setLoading(false);
      return;
    }

    router.replace(nextAfterSignup());
  }

  async function handleOAuth(provider: "google" | "apple") {
    setSubmitError(null);
    setLoading(true);
    const tierParam = preTier ? `&tier=${preTier}` : "";
    const redirectTo = `${window.location.origin}/auth/callback?next=/app/onboarding${tierParam}`;
    const { error: oauthErr } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (oauthErr) {
      setSubmitError(oauthErr.message);
      setLoading(false);
    }
  }

  return (
    <WzAuthShell
      title="Word onderdeel van Weerzone."
      subtitle="Maak een gratis account en ontvang elke ochtend je persoonlijke weerbericht — geschreven door Piet."
      quote={{
        text: "Sinds Weerzone weet ik precies wanneer ik mijn terras moet opruimen. Gewoon fijn.",
        author: "Marieke, Utrecht",
      }}
      footer={
        <>
          Heb je al een account?{" "}
          <Link
            href="/app/login"
            className="btn btn-link"
          >
            Inloggen
          </Link>
        </>
      }
    >
      <h1 className="h-1 mb-2">Maak een account</h1>
      <p className="t-body mb-6">Gratis proberen — geen creditcard nodig.</p>

      <WzSocialButtons onGoogle={() => handleOAuth("google")} onApple={() => handleOAuth("apple")} loading={loading} />
      <WzDivider />

      <form onSubmit={handleSubmit} noValidate>
        <WzTextField
          label="Naam"
          value={fullName}
          onChange={setFullName}
          placeholder="Jouw naam"
          error={errors.name}
          autoFocus
          autoComplete="name"
        />
        <WzTextField
          label="E-mailadres"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="je@voorbeeld.nl"
          error={errors.email}
          autoComplete="email"
        />
        <WzPasswordField
          label="Wachtwoord"
          value={password}
          onChange={setPassword}
          placeholder="Minimaal 8 tekens"
          error={errors.pw}
          showStrength
          autoComplete="new-password"
        />

        <div className="mt-1.5 mb-4">
          <WzCheckbox checked={agree} onChange={setAgree}>
            Ik ga akkoord met de{" "}
            <Link href="/voorwaarden" className="kbd-link">voorwaarden</Link>{" "}
            en het{" "}
            <Link href="/privacy" className="kbd-link">privacybeleid</Link>.
          </WzCheckbox>
          {errors.agree && (
            <div className="err mt-1.5">
              {errors.agree}
            </div>
          )}
        </div>

        {submitError && (
          <div className="mb-4 p-3 rounded-lg bg-[var(--wz-danger-bg)] text-[var(--wz-danger)] text-sm">
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-block btn-lg disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Account aanmaken"}
        </button>
      </form>
    </WzAuthShell>
  );
}
