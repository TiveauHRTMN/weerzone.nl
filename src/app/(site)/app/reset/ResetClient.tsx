"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import WzAuthShell from "@/components/wz/WzAuthShell";
import { WzTextField } from "@/components/wz/WzForm";
import { appendLang, audienceCopy, resolveAuthAudience } from "@/lib/auth-i18n";

export default function ResetClient() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const audience = resolveAuthAudience(searchParams?.get("lang"), pathname);
  const t = audienceCopy(audience);

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !/.+@.+\..+/.test(email)) {
      setError(t.invalidEmail);
      return;
    }
    setError(null);
    setLoading(true);
    const next = appendLang("/app/reset/confirm", audience);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
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
    <WzAuthShell title={t.resetSideTitle} subtitle={t.resetSideSubtitle}>
      {!sent ? (
        <>
          <form onSubmit={handleSubmit} noValidate>
            <WzTextField
              label={t.email}
              type="email"
              value={email}
              onChange={setEmail}
              placeholder={t.emailPlaceholder}
              error={error ?? undefined}
              autoFocus
              autoComplete="email"
            />
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-block btn-lg disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t.resetSubmit}
            </button>
          </form>

          <p className="text-sm text-center mt-5" style={{ color: "var(--wz-text-mute)" }}>
            <Link
              href={appendLang("/app/login", audience)}
              className="font-bold no-underline hover:underline"
              style={{ color: "var(--wz-brand)" }}
            >
              {t.resetBackToLogin}
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
          <h1 className="h-2 mb-2">{t.resetSentTitle}</h1>
          <p className="t-body mb-6">{t.resetSentBody(email)}</p>
          <Link
            href={appendLang("/app/login", audience)}
            className="btn btn-ghost btn-block"
          >
            {t.resetBackToLogin.replace(/^← ?/, "")}
          </Link>
          <p className="text-sm mt-5" style={{ color: "var(--wz-text-mute)" }}>
            {t.resetNotReceived}{" "}
            <button
              type="button"
              onClick={() => setSent(false)}
              className="font-bold bg-transparent border-0 cursor-pointer p-0"
              style={{ color: "var(--wz-brand)" }}
            >
              {t.resetTryAgain}
            </button>
          </p>
        </div>
      )}
    </WzAuthShell>
  );
}
