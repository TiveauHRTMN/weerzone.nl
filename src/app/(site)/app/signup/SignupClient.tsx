"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { registerUser } from "@/app/actions";
import { PERSONA_ORDER, type PersonaTier } from "@/lib/personas";
import WzAuthShell from "@/components/wz/WzAuthShell";
import { detectLocale } from "@/config/locales";
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
  const preTier = queryTier && PERSONA_ORDER.includes(queryTier) ? queryTier : null;
  const locale = searchParams?.get("lang") === "de" ? "de" : detectLocale("/");
  const isDE = locale === "de";

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
    const tierPart = preTier ? `?tier=${preTier}` : "";
    const langPart = isDE ? (tierPart ? "&lang=de" : "?lang=de") : "";
    return `/app/onboarding${tierPart}${langPart}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!fullName.trim()) errs.name = isDE ? "Gib deinen Namen ein" : "Vul je naam in";
    if (!email.trim() || !/.+@.+\..+/.test(email)) errs.email = isDE ? "Gib eine gültige E-Mail-Adresse ein" : "Vul een geldig e-mailadres in";
    if (!password || password.length < 8) errs.pw = isDE ? "Mindestens 8 Zeichen" : "Minimaal 8 tekens";
    if (!agree) errs.agree = isDE ? "Du musst den Bedingungen zustimmen" : "Je moet akkoord gaan met de voorwaarden";
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
      setSubmitError(`${isDE ? "Anmelden fehlgeschlagen" : "Inloggen mislukt"}: ${signInErr.message}`);
      setLoading(false);
      return;
    }

    router.replace(nextAfterSignup());
  }

  async function handleOAuth(provider: "google" | "apple") {
    setSubmitError(null);
    setLoading(true);
    const tierParam = preTier ? `&tier=${preTier}` : "";
    const langParam = isDE ? "&lang=de" : "";
    const redirectTo = `${window.location.origin}/auth/callback?next=/app/onboarding${tierParam}${langParam}`;
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
      title={isDE ? "Werde Teil von WEERZONE." : "Word onderdeel van Weerzone."}
      subtitle={
        isDE
          ? "Erstelle ein kostenloses Konto und erhalte jeden Morgen deinen persönlichen Wetterbericht - geschrieben von Karl."
          : "Maak een gratis account en ontvang elke ochtend je persoonlijke weerbericht - geschreven door Piet."
      }
      quote={{
        text: isDE
          ? "Seit WEERZONE weiß ich genau, wann ich meine Terrasse reinholen muss. Sehr praktisch."
          : "Sinds Weerzone weet ik precies wanneer ik mijn terras moet opruimen. Gewoon fijn.",
        author: "Marieke, Utrecht",
      }}
      footer={
        <>
          {isDE ? "Hast du schon ein Konto? " : "Heb je al een account? "}
          <Link href={isDE ? "/app/login?lang=de" : "/app/login"} className="btn btn-link">
            {isDE ? "Anmelden" : "Inloggen"}
          </Link>
        </>
      }
    >
      {/* TODO: Supabase Pro Custom Domain benodigd voor clean OAuth
      <WzSocialButtons onGoogle={() => handleOAuth("google")} onApple={() => handleOAuth("apple")} loading={loading} />
      <WzDivider />
      */}

      <form onSubmit={handleSubmit} noValidate>
        <WzTextField
          label={isDE ? "Name" : "Naam"}
          value={fullName}
          onChange={setFullName}
          placeholder={isDE ? "Dein Name" : "Jouw naam"}
          error={errors.name}
          autoFocus
          autoComplete="name"
        />
        <WzTextField
          label={isDE ? "E-Mail-Adresse" : "E-mailadres"}
          type="email"
          value={email}
          onChange={setEmail}
          placeholder={isDE ? "du@beispiel.de" : "je@voorbeeld.nl"}
          error={errors.email}
          autoComplete="email"
        />
        <WzPasswordField
          label={isDE ? "Passwort" : "Wachtwoord"}
          value={password}
          onChange={setPassword}
          placeholder={isDE ? "Mindestens 8 Zeichen" : "Minimaal 8 tekens"}
          error={errors.pw}
          showStrength
          autoComplete="new-password"
        />

        <div className="mt-1.5 mb-4">
          <WzCheckbox checked={agree} onChange={setAgree}>
            {isDE ? (
              <>
                Ich stimme den{" "}
                <Link href="/voorwaarden" className="kbd-link">Nutzungsbedingungen</Link>{" "}
                und der{" "}
                <Link href="/privacy" className="kbd-link">Datenschutzerklärung</Link>{" "}
                zu.
              </>
            ) : (
              <>
                Ik ga akkoord met de{" "}
                <Link href="/voorwaarden" className="kbd-link">voorwaarden</Link>{" "}
                en het{" "}
                <Link href="/privacy" className="kbd-link">privacybeleid</Link>.
              </>
            )}
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
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isDE ? "Konto erstellen" : "Account aanmaken"}
        </button>
      </form>
    </WzAuthShell>
  );
}
