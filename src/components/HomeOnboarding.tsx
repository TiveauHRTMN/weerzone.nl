"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useSession } from "@/lib/session-context";

function BrandLogo() {
  return (
    <Image
      src="/logo-full.png"
      alt="Weerzone"
      width={486}
      height={129}
      priority
      className="h-auto w-[250px] sm:w-[340px]"
    />
  );
}

function AuthActions({ signedIn }: { signedIn: boolean }) {
  if (signedIn) {
    return (
      <div className="flex w-full max-w-md flex-col justify-center gap-3 sm:flex-row">
        <Link href="/vandaag" className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-black text-slate-950 shadow-lg shadow-slate-950/15 transition hover:bg-slate-50">
          Open Vandaag <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <Link href="/mijn-weerzone" className="inline-flex min-h-12 flex-1 items-center justify-center rounded-lg border border-white/35 bg-slate-950/35 px-6 py-3 text-sm font-black text-white backdrop-blur-md transition hover:bg-slate-950/50">
          Mijn Weerzone
        </Link>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col justify-center gap-3 sm:flex-row">
      <Link href="/app/login" className="inline-flex min-h-12 flex-1 items-center justify-center rounded-lg border border-white/25 bg-[var(--wz-blue-dark)] px-6 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-[var(--wz-blue-deep)]">
        Inloggen
      </Link>
      <Link href="/app/signup" className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-black text-slate-950 shadow-lg shadow-slate-950/15 transition hover:bg-slate-50">
        Aanmelden <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}

export default function HomeOnboarding({ teaser }: { teaser?: ReactNode }) {
  const { user, loading } = useSession();

  return (
    <main className="relative z-10 flex min-h-[calc(100svh-72px)] items-center justify-center px-5 py-12 sm:px-8 sm:py-16">
      <section className="flex w-full max-w-5xl flex-col items-center text-center">
        <BrandLogo />
        <h1
          className="mt-8 max-w-5xl pb-2 text-5xl font-black leading-[1.04] text-transparent sm:text-7xl lg:text-8xl"
          style={{
            backgroundImage: "linear-gradient(90deg, #ff6a00 0%, #ffd84d 50%, #ff7a00 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
          }}
        >
          Weer op jouw locatie.<br />Vandaag en morgen.
        </h1>
        <div className="mt-9 flex w-full justify-center">
          {loading ? (
            <div className="h-12 w-full max-w-md animate-pulse rounded-lg bg-white/15" aria-label="Account laden" />
          ) : (
            <AuthActions signedIn={Boolean(user)} />
          )}
        </div>
        {teaser ? <div className="mt-6 flex w-full justify-center">{teaser}</div> : null}
        <nav aria-label="Openbare Weerzone-pagina's" className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-bold text-white/80">
          <Link href="/vandaag" className="transition hover:text-white">Vandaag</Link>
          <Link href="/morgen" className="transition hover:text-white">Morgen</Link>
          <Link href="/over" className="inline-flex items-center gap-2 transition hover:text-white">
            Wat, hoe en waarom <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </nav>
      </section>
    </main>
  );
}
