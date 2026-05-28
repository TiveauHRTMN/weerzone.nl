"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { PERSONA_ORDER, type PersonaTier } from "@/lib/personas";
import PersonaCard from "./PersonaCard";
import { detectLocale, type Locale } from "@/config/locales";

interface Props {
  open: boolean;
  onClose: () => void;
}

const COPY: Record<Locale, { close: string; badge: string; title: string; body: string; later: string }> = {
  nl: {
    close: "Sluiten",
    badge: "Nu nog gratis aanmelden",
    title: "Kies je weerbericht",
    body: "Elke ochtend een duidelijke update voor jouw postcode. Geen reclame, geen creditcard vooraf, opzeggen kan altijd.",
    later: "Later beslissen",
  },
  de: {
    close: "Schliessen",
    badge: "Noch kostenlos anmelden",
    title: "Waehle deinen Wetterbericht",
    body: "Jeden Morgen ein klarer Wetterbericht fuer deine Postleitzahl. Keine Werbung, keine Kreditkarte im Voraus, jederzeit kundbar.",
    later: "Spater entscheiden",
  },
  fr: {
    close: "Fermer",
    badge: "Inscription encore gratuite",
    title: "Choisissez votre bulletin météo",
    body: "Chaque matin, un bulletin météo clair pour votre code postal. Pas de publicité, pas de carte bancaire au départ, résiliation possible à tout moment.",
    later: "Decider plus tard",
  },
  es: {
    close: "Cerrar",
    badge: "Registrate gratis por ahora",
    title: "Elige tu parte del tiempo",
    body: "Cada manana, un correo claro del tiempo para tu codigo postal. Sin publicidad, sin tarjeta por adelantado y cancelable cuando quieras.",
    later: "Decidir mas tarde",
  },
};

export default function PersonaModal({ open, onClose }: Props) {
  const [selected, setSelected] = useState<PersonaTier | null>(null);
  const pathname = usePathname() ?? "/";
  const locale = useMemo(() => detectLocale(pathname), [pathname]);
  const copy = COPY[locale];

  if (!open) return null;

  const handleSelect = (tier: PersonaTier) => {
    setSelected(tier);
    const langQuery = locale === "nl" ? "" : `&lang=${locale}`;
    window.location.href = `/app/signup?tier=${tier}${langQuery}`;
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-5xl max-h-[95vh] overflow-y-auto bg-gradient-to-b from-slate-100 to-white rounded-t-3xl sm:rounded-3xl shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors z-10"
          aria-label={copy.close}
        >
          <X className="w-5 h-5 text-text-primary" />
        </button>

        <div className="p-6 sm:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-orange/15 mb-4">
              <span className="text-xs font-black text-accent-orange uppercase tracking-wider">{copy.badge}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-text-primary mb-3">{copy.title}</h2>
            <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto">{copy.body}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {PERSONA_ORDER.map((tier) => (
              <PersonaCard
                key={tier}
                tier={tier}
                onSelect={handleSelect}
                highlighted={selected === tier}
                locale={locale}
              />
            ))}
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-text-muted hover:text-text-primary underline underline-offset-4 transition-colors"
            >
              {copy.later}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
