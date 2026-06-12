"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckCircle2, Copy, Download, Loader2, LogOut, Mail, ScanLine, Share2, ShieldCheck } from "lucide-react";
import { sendWkMagicLinkAction } from "@/app/wkpoule/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type WkLoginClientProps = {
  signedInEmail?: string | null;
  signedInName?: string | null;
  inviteCode?: string | null;
  groupId?: string | null;
};

export default function WkLoginClient({ signedInEmail, signedInName, inviteCode, groupId }: WkLoginClientProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "copied" | "shared" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  const inviteQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (groupId) params.set("groupId", groupId);
    if (inviteCode) params.set("inviteCode", inviteCode);
    const query = params.toString();
    return query ? `?${query}` : "";
  }, [groupId, inviteCode]);
  const loginPath = `/wkpoule/inloggen${inviteQuery}`;
  const poulePath = `/wkpoule${inviteQuery}`;
  const loginUrl = useMemo(() => {
    const base = typeof window === "undefined" ? "https://weerzone.nl" : window.location.origin;
    return `${base}${loginPath}`;
  }, [loginPath]);
  const qrImage = `/api/wkpoule/qr?target=${encodeURIComponent(loginPath)}`;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const result = await sendWkMagicLinkAction({ fullName, email, inviteCode, groupId });
    if (!result.ok) {
      setError(result.error || "Inloggen mislukt.");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);
    try {
      await createSupabaseBrowserClient().auth.signOut();
    } finally {
      window.location.href = loginPath;
    }
  }

  async function handleShareInvite() {
    const inviteText = `Doe mee met Hartman WK 2026 via deze link: ${loginUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Hartman WK 2026",
          text: "Doe mee met Hartman WK 2026.",
          url: loginUrl,
        });
        setShareState("shared");
        return;
      }

      await navigator.clipboard.writeText(inviteText);
      setShareState("copied");
    } catch {
      setShareState("error");
    } finally {
      window.setTimeout(() => setShareState("idle"), 1800);
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(loginUrl);
      setShareState("copied");
    } catch {
      setShareState("error");
    } finally {
      window.setTimeout(() => setShareState("idle"), 1800);
    }
  }

  async function handleDownloadQr() {
    try {
      const response = await fetch(qrImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "hartman-wk-2026-qr.png";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setShareState("saved");
    } catch {
      setShareState("error");
    } finally {
      window.setTimeout(() => setShareState("idle"), 1800);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-12 text-slate-50">
      {signedInEmail && (
        <div className="mb-5 flex flex-col gap-3 rounded-[26px] border border-white/10 bg-white/5 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.22)] backdrop-blur-2xl md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" />
            <div>
              <p className="font-black">Je bent al ingelogd</p>
              <p className="mt-1 text-sm text-slate-300">
                {signedInName ? `${signedInName} - ` : ""}
                {signedInEmail}. Je poule-lidmaatschap is gecontroleerd.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={poulePath}
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-[linear-gradient(90deg,#ef4444_0%,#3b82f6_54%,#22c55e_100%)] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(59,130,246,0.20)] transition hover:shadow-[0_16px_34px_rgba(59,130,246,0.26)]"
            >
              Open poule
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10 disabled:opacity-60"
            >
              {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              Wissel account
            </button>
          </div>
        </div>
      )}

      <section className="relative overflow-hidden py-4 md:py-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.12),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_30%),radial-gradient(circle_at_bottom,rgba(34,197,94,0.10),transparent_36%)]" />
        <div className="relative grid gap-7 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-2xl md:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold uppercase text-slate-200">
              <ShieldCheck className="h-4 w-4 text-red-400" />
              Hartman WK 2026
            </div>
            <h1 className="mt-5 max-w-xl text-4xl font-black leading-[0.92] text-white md:text-6xl">
              Toegang in een rustige, donkere laag.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
              Vul je naam en e-mail in. Je ontvangt een toegangsmail en komt daarna direct terug in de poule.
            </p>
          </div>

          <form
            className="rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-2xl md:p-6"
            onSubmit={handleSubmit}
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ef4444_0%,#3b82f6_54%,#22c55e_100%)] text-white shadow-sm">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Toegang per mail</h2>
                <p className="text-sm text-slate-400">Naam voor de stand, e-mail voor je loginlink.</p>
              </div>
            </div>

            <div className="grid gap-4">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-300">Naam</span>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#0d1222] px-4 py-3 text-base font-semibold text-white outline-none placeholder:text-slate-500 focus:border-sky-300/30 focus:ring-4 focus:ring-sky-300/10"
                  placeholder="Bijv. Jan Hartman"
                  autoComplete="name"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-300">E-mail</span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#0d1222] px-4 py-3 text-base font-semibold text-white outline-none placeholder:text-slate-500 focus:border-sky-300/30 focus:ring-4 focus:ring-sky-300/10"
                  placeholder="je@familie.nl"
                  autoComplete="email"
                  inputMode="email"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#ef4444_0%,#3b82f6_54%,#22c55e_100%)] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(59,130,246,0.20)] transition hover:shadow-[0_16px_34px_rgba(59,130,246,0.26)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Versturen
                  </>
                ) : (
                  "Stuur toegang"
                )}
              </button>
            </div>

            <div className="mt-4 min-h-12">
              {error && (
                <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-200">
                  {error}
                </p>
              )}
              {sent && (
                <div className="flex items-start gap-3 rounded-2xl border border-sky-400/20 bg-sky-500/10 px-3 py-2 text-sm font-semibold text-sky-200">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Check je e-mail om toegang te activeren.</span>
                </div>
              )}
            </div>
          </form>
        </div>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <div
          id="qr"
          className="scroll-mt-24 rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-2xl"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ef4444_0%,#3b82f6_54%,#22c55e_100%)] text-white shadow-sm">
              <ScanLine className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">QR naar mobiel</h2>
              <p className="text-sm text-slate-400">Handig als je nu achter een laptop zit.</p>
            </div>
          </div>

          <div className="flex justify-center rounded-[24px] border border-white/10 bg-[#0d1222] p-5">
            <img
              src={qrImage}
              alt="QR-code voor de Hartman WK 2026 loginpagina"
              className="h-64 w-64 rounded-[20px] bg-white p-4 shadow-[0_14px_40px_rgba(0,0,0,0.18)]"
            />
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-white">Deel uitnodiging</h2>
              <p className="mt-2 text-sm text-slate-400">Stuur de QR of link door naar familie en vrienden.</p>
            </div>
            <button
              type="button"
              onClick={handleShareInvite}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-white transition hover:bg-white/10"
              title="Deel via telefoon of kopieer de link"
            >
              <Share2 className="h-4 w-4" />
              Deel
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Copy className="h-4 w-4" />
              Kopieer link
            </button>
            <button
              type="button"
              onClick={handleDownloadQr}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Download className="h-4 w-4" />
              Download QR
            </button>
          </div>

          <div className="mt-3 min-h-5 text-sm font-medium text-slate-400">
            {shareState === "copied" && "Link gekopieerd."}
            {shareState === "shared" && "Deelvenster geopend."}
            {shareState === "saved" && "QR opgeslagen."}
            {shareState === "error" && "Deelactie mislukt."}
          </div>

          <h3 className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Directe link</h3>
          <p className="mt-2 text-sm text-slate-400">Open dezelfde loginpagina op je telefoon.</p>
          <div className="mt-4 break-all rounded-2xl border border-white/10 bg-[#0d1222] px-4 py-3 font-mono text-sm text-slate-200">
            {loginUrl}
          </div>
        </div>
      </section>
    </div>
  );
}

