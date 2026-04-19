"use client";

import Link from "next/link";
import { Mail, Users } from "lucide-react";
import { useSession } from "@/lib/session-context";
import { displaySubCount, displayFoundersLeft } from "@/lib/social-proof";
import { FOUNDER_SLOTS } from "@/lib/personas";
import type { City } from "@/lib/types";

interface Props {
  city: City;
}

/**
 * Promo-card bovenaan het dashboard. CTA naar /prijzen met social-proof +
 * scarcity (fake-until-real: zie src/lib/social-proof.ts).
 *
 * Abonnees zien deze card niet.
 */
export default function EmailSubscribe({ city: _city }: Props) {
  const { tier, loading } = useSession();

  if (loading || tier) return null;

  const subCount = displaySubCount(0);
  const foundersLeft = displayFoundersLeft(0);

  return (
    <div className="card p-5 space-y-3 relative overflow-hidden">
      <div className="absolute top-0 right-0 bg-accent-orange text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl">
        Nu gratis
      </div>

      <div className="flex items-center gap-2">
        <Mail className="w-4 h-4 text-accent-orange" />
        <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">
          Elke ochtend je weerbericht in de mail
        </h3>
      </div>

      <p className="text-xs text-text-secondary leading-snug">
        Piet schrijft, Reed waarschuwt, Steve beslist. Op jouw postcode,
        zonder reclame. Geen creditcard vooraf. Opzeggen kan altijd.
      </p>

      <div className="flex items-center gap-3 text-[11px] text-text-secondary pt-1 border-t border-black/5">
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-accent-orange" />
          <strong className="text-text-primary">{subCount.toLocaleString("nl-NL")}</strong> Nederlanders
        </span>
        <span className="text-black/20">·</span>
        <span>
          Nog <strong className="text-accent-orange">{foundersLeft}</strong> van {FOUNDER_SLOTS} founder-plekken
        </span>
      </div>

      <Link
        href="/prijzen"
        className="inline-block w-full text-center px-4 py-2.5 rounded-xl bg-accent-orange text-white text-sm font-bold hover:brightness-90 transition-all active:scale-[0.98]"
      >
        Bekijk de drie abonnementen →
      </Link>
    </div>
  );
}
