"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import WzAuthShell from "@/components/wz/WzAuthShell";
import { detectLocale } from "@/config/locales";
import {
  WzTextField,
  WzPasswordField,
  WzCheckbox,
  WzDivider,
  WzSocialButtons,
} from "@/components/wz/WzForm";

import { sendBrandedMagicLink, checkUserExists } from "@/app/actions";

type LoginStep = "email" | "password" | "magic_link_sent";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const locale = searchParams?.get("lang") === "de" ? "de" : detectLocale("/");
  const isDE = locale === "de";

  const [step, setStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState(searchParams?.get("email") || "");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; pw?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEmailNext(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !/.+@.+\..+/.test(email)) {
      setErrors({ email: isDE ? "Gib eine gültige E-Mail-Adresse ein" : "Vul een geldig e-mailadres in" });
      return;
    }

    setErrors({});
    setSubmitError(null);
    setLoading(true);

    try {
      const exists = await checkUserExists(email.trim());
      if (exists) {
        setStep("password");
      } else {
        router.push(`/app/signup?email=${encodeURIComponent(email.trim())}${isDE ? "&lang=de" : ""}`);
      }
    } catch {
      setSubmitError(isDE ? "Beim Prüfen deines Kontos ist etwas schiefgelaufen." : "Er ging iets mis bij het controleren van je account.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!password) {
      setErrors({ pw: isDE ? "Gib dein Passwort ein" : "Vul je wachtwoord in" });
      return;
    }

    setSubmitError(null);
    setLoading(true);

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInErr) {
      setSubmitError(isDE ? "Das Passwort ist falsch. Versuche es erneut oder nutze den Login-Link." : "Wachtwoord is onjuist. Probeer het opnieuw of gebruik de inloglink.");
      setLoading(false);
      return;
    }

    const next = searchParams?.get("next") || "/app";
    router.replace(next);
  }

  async function handleMagicLink() {
    setSubmitError(null);
    setLoading(true);

    try {
      await sendBrandedMagicLink(email.trim(), isDE ? "karl" : "piet", "");
      setStep("magic_link_sent");
    } catch (err: any) {
      setSubmitError(err.message || (isDE ? "Konnte keinen Login-Link senden." : "Kon geen inloglink sturen."));
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider: "google" | "apple") {
    setSubmitError(null);
    setLoading(true);
    const redirectTo = `${window.location.origin}/auth/callback?next=/app${isDE ? "&lang=de" : ""}`;
    const { error: oauthErr } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (oauthErr) {
      setSubmitError(isDE ? "Anmeldung via soziale Anbieter ist derzeit nicht verfügbar. Nutze E-Mail." : "Inloggen via sociale provider is tijdelijk niet beschikbaar. Gebruik e-mail.");
      setLoading(false);
    }
  }

  const renderEmailStep = () => (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      {/* TODO: Supabase Pro Custom Domain benodigd voor clean OAuth
      <WzSocialButtons onGoogle={() => handleOAuth("google")} onApple={() => handleOAuth("apple")} loading={loading} />
      <WzDivider>oder mit E-Mail fortfahren</WzDivider>
      */}

      <form onSubmit={handleEmailNext} noValidate>
        <WzTextField
          label={isDE ? "E-Mail-Adresse" : "E-mailadres"}
          type="email"
          value={email}
          onChange={setEmail}
          placeholder={isDE ? "du@beispiel.de" : "je@voorbeeld.nl"}
          error={errors.email}
          autoComplete="email"
          autoFocus
        />

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-block btn-lg mt-2 disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : isDE ? "Weiter" : "Doorgaan"}
        </button>
      </form>
    </div>
  );

  const renderPasswordStep = () => (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <button
        onClick={() => setStep("email")}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-3 h-3" /> {isDE ? "E-Mail ändern" : "E-mail wijzigen"}
      </button>

      <div className="flex items-center gap-3 mb-6 p-3 bg-[var(--ink-050)] rounded-2xl border border-[var(--border)]">
        <div className="w-10 h-10 rounded-full bg-white border border-[var(--border)] flex items-center justify-center text-[var(--ink-400)]">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="t-micro">{isDE ? "Konto gefunden" : "Account gevonden"}</p>
          <p className="t-body font-bold truncate text-[var(--ink-900)]">{email}</p>
        </div>
      </div>

      <form onSubmit={handleLogin} noValidate>
        <div className="flex justify-between items-baseline mb-1.5">
          <label className="text-[13px] font-bold" style={{ color: "var(--wz-text)" }}>
            {isDE ? "Passwort" : "Wachtwoord"}
          </label>
          <Link href={isDE ? "/app/reset?lang=de" : "/app/reset"} className="btn btn-link">
            {isDE ? "Vergessen?" : "Vergeten?"}
          </Link>
        </div>
        <WzPasswordField
          value={password}
          onChange={setPassword}
          placeholder={isDE ? "Dein Passwort" : "Je wachtwoord"}
          error={errors.pw}
          autoComplete="current-password"
          autoFocus
        />

        <div className="mt-1.5 mb-6">
          <WzCheckbox checked={remember} onChange={setRemember}>
            {isDE ? "Auf diesem Gerät merken" : "Onthoud mij op dit apparaat"}
          </WzCheckbox>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-block btn-lg disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : isDE ? "Anmelden" : "Inloggen"}
          </button>

          <button
            type="button"
            onClick={handleMagicLink}
            disabled={loading}
            className="btn btn-ghost btn-block btn-lg flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Mail className="w-4 h-4" />
            {loading ? (isDE ? "Bitte warten..." : "Even geduld...") : isDE ? "Ohne Passwort anmelden" : "Inloggen zonder wachtwoord"}
          </button>
        </div>
      </form>
    </div>
  );

  const renderMagicLinkSent = () => (
    <div className="animate-in fade-in slide-in-from-top-4 duration-500 text-center py-4">
      <div className="w-16 h-16 bg-[var(--success-bg)] text-[var(--success)] rounded-full flex items-center justify-center mx-auto mb-6">
        <Mail className="w-8 h-8" />
      </div>
      <h2 className="h-2 mb-2">{isDE ? "Posteingang prüfen!" : "Check je inbox!"}</h2>
      <p className="t-body mb-8">
        {isDE ? "Wir haben dir einen Login-Link gesendet an" : "We hebben een magische inloglink gestuurd naar"} <br />
        <strong className="text-[var(--ink-900)]">{email}</strong>.
      </p>

      <div className="bg-[var(--ink-050)] border border-[var(--border)] rounded-2xl p-4 t-small mb-8">
        {isDE ? "Keine Mail erhalten? Prüfe deinen Spam-Ordner oder versuche es unten erneut." : "Geen mail ontvangen? Check je spam-folder of klik hieronder om het opnieuw te proberen."}
      </div>

      <button
        onClick={() => setStep("password")}
        className="btn btn-ghost btn-block"
      >
        {isDE ? "Doch mit Passwort anmelden" : "Toch met wachtwoord inloggen"}
      </button>
    </div>
  );

  return (
    <WzAuthShell
      title={step === "email" ? (isDE ? "Willkommen zurück." : "Welkom terug.") : (isDE ? "Sicherer Zugang." : "Beveiligde toegang.")}
      subtitle={
        step === "email"
          ? (isDE ? "Melde dich an, um deine persönlichen Wetterdaten und Einstellungen zu verwalten." : "Log in om je persoonlijke weerbericht en voorkeuren te beheren.")
          : (isDE ? "Bestätige deine Identität, um zu deinem Dashboard zu gelangen." : "Bevestig je identiteit om door te gaan naar je dashboard.")
      }
      footer={
        step === "email" ? (
          <>
            {isDE ? "Noch kein Konto? " : "Nog geen account? "}
            <Link href={isDE ? "/app/signup?lang=de" : "/app/signup"} className="btn btn-link">
              {isDE ? "Konto erstellen" : "Maak er één"}
            </Link>
          </>
        ) : null
      }
    >
      {submitError && (
        <div className="mb-6 p-4 rounded-2xl bg-[var(--wz-danger-bg)] text-[var(--wz-danger)] t-body border border-[var(--wz-danger)] animate-in shake-1">
          {submitError}
        </div>
      )}

      {step === "email" && renderEmailStep()}
      {step === "password" && renderPasswordStep()}
      {step === "magic_link_sent" && renderMagicLinkSent()}
    </WzAuthShell>
  );
}
