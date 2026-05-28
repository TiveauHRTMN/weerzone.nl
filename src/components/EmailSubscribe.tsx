"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { useSession } from "@/lib/session-context";
import type { City } from "@/lib/types";
import type { Locale } from "@/config/locales";

interface Props {
  city: City;
  locale?: Locale;
}

const COPY: Record<Locale, {
  badge: string;
  title: string;
  body: string;
  note: string;
  href: string;
  cta: string;
}> = {
  nl: {
    badge: "Nu gratis",
    title: "Elke ochtend je weerbericht in de mail",
    body: "Een korte, duidelijke update voor jouw plek. Zonder reclame. Meld je aan en ontvang morgen je eerste bericht.",
    note: "Elke ochtend vroeg in je inbox. Geen reclame.",
    href: "/app/signup",
    cta: "Maak mijn Weerzone ->",
  },
  de: {
    badge: "Jetzt gratis",
    title: "Jeden Morgen dein Wetterbericht per Mail",
    body: "Ein kurzer, klarer Wetterbericht fuer deinen Ort. Ohne Werbung. Melde dich an und erhalte morgen die erste Ausgabe.",
    note: "Jeden Morgen frueh im Posteingang. Ohne Werbung.",
    href: "/app/signup?lang=de",
    cta: "Mein Weerzone erstellen ->",
  },
  fr: {
    badge: "Gratuit maintenant",
    title: "Votre bulletin météo chaque matin",
    body: "Un point météo court et clair pour votre lieu. Sans publicité. Inscrivez-vous et recevez la première édition demain.",
    note: "Chaque matin dans votre boite mail. Sans publicite.",
    href: "/app/signup?lang=fr",
    cta: "Creer mon Weerzone ->",
  },
  es: {
    badge: "Gratis ahora",
    title: "Tu parte del tiempo cada manana",
    body: "Un resumen claro del tiempo para tu lugar. Sin publicidad. Apuntate y recibe manana la primera edicion.",
    note: "Cada manana en tu bandeja. Sin publicidad.",
    href: "/app/signup?lang=es",
    cta: "Crear mi Weerzone ->",
  },
};

export default function EmailSubscribe({ city: _city, locale = "nl" }: Props) {
  const { tier, loading } = useSession();
  const copy = COPY[locale];

  if (loading || tier) return null;

  return (
    <div className="card p-5 space-y-3 relative overflow-hidden">
      <div className="absolute top-0 right-0 bg-accent-orange text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl">
        {copy.badge}
      </div>

      <div className="flex items-center gap-2">
        <Mail className="w-4 h-4 text-accent-orange" />
        <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">
          {copy.title}
        </h3>
      </div>

      <p className="text-xs text-text-secondary leading-snug">{copy.body}</p>

      <div className="flex items-center gap-1.5 text-[11px] text-text-secondary pt-1 border-t border-black/5">
        <Mail className="w-3.5 h-3.5 text-accent-orange" />
        <span>{copy.note}</span>
      </div>

      <Link
        href={copy.href}
        className="inline-block w-full text-center px-4 py-2.5 rounded-xl bg-accent-orange text-white text-sm font-bold hover:brightness-90 transition-all active:scale-[0.98]"
      >
        {copy.cta}
      </Link>
    </div>
  );
}
