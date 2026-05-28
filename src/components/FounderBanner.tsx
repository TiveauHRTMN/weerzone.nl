"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, X } from "lucide-react";
import PersonaModal from "./PersonaModal";
import { useSession } from "@/lib/session-context";
import { detectLocale, type Locale } from "@/config/locales";

const STORAGE_KEY = "wz-founder-banner-dismissed";
const IDLE_MS = 10_000;

const COPY: Record<Locale, { title: string; body: string; close: string }> = {
  nl: {
    title: "Nu nog gratis aanmelden",
    body: "Elke ochtend een duidelijk weerbericht voor jouw plek. Zonder reclame. Tijdelijk gratis.",
    close: "Sluiten",
  },
  de: {
    title: "Noch kostenlos anmelden",
    body: "Jeden Morgen ein klarer Wetterbericht fuer deinen Ort. Ohne Werbung. Vorubergehend kostenlos.",
    close: "Schliessen",
  },
  fr: {
    title: "Inscription encore gratuite",
    body: "Chaque matin, un bulletin météo clair pour votre lieu. Sans publicité. Gratuit temporairement.",
    close: "Fermer",
  },
  es: {
    title: "Registrate gratis por ahora",
    body: "Cada manana, un correo claro del tiempo para tu lugar. Sin publicidad. Gratis temporalmente.",
    close: "Cerrar",
  },
};

export default function FounderBanner() {
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const { tier, loading } = useSession();
  const pathname = usePathname() ?? "/";
  const locale = detectLocale(pathname);
  const copy = COPY[locale];

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (tier) {
      setVisible(false);
      return;
    }
    if (loading) return;
    if (sessionStorage.getItem(STORAGE_KEY) === "1") return;

    const timer = setTimeout(() => {
      setVisible(true);
      window.dispatchEvent(new CustomEvent("wz:founder-visible", { detail: true }));
    }, IDLE_MS);
    return () => clearTimeout(timer);
  }, [tier, loading]);

  const dismiss = () => {
    setVisible(false);
    window.dispatchEvent(new CustomEvent("wz:founder-visible", { detail: false }));
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {}
  };

  const open = () => {
    setModalOpen(true);
    setVisible(false);
  };

  return (
    <>
      {visible && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-2xl animate-[slideup_0.4s_ease-out]"
          style={{ animation: "slideup 0.4s ease-out" }}
        >
          <div
            className="relative rounded-3xl p-5 sm:p-6 pr-14 shadow-2xl backdrop-blur-md border border-white/70 bg-white/97 cursor-pointer hover:bg-white transition-colors"
            onClick={open}
          >
            <div className="flex items-center gap-4">
              <div
                className="shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg"
                style={{ background: "linear-gradient(135deg, #22c55e 0%, #ef4444 50%, #3b82f6 100%)" }}
              >
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg sm:text-xl font-black text-text-primary leading-tight">{copy.title}</p>
                <p className="text-sm text-text-secondary mt-1">{copy.body}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                dismiss();
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors"
              aria-label={copy.close}
            >
              <X className="w-4 h-4 text-text-muted" />
            </button>
          </div>
        </div>
      )}

      <PersonaModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <style jsx>{`
        @keyframes slideup {
          from { transform: translate(-50%, 100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
