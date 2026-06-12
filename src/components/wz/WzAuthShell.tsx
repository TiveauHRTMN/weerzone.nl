"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import WzLogo from "./WzLogo";
import { audienceHomeHref, resolveAuthAudience } from "@/lib/auth-i18n";

const GLASS_CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.95)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  borderRadius: 28,
  border: "1px solid rgba(255,255,255,0.7)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.9)",
};

export default function WzAuthShell({
  title = "48 uur vooruit.\nDe rest is ruis.",
  subtitle = "Per GPS, op jouw locatie. Elke ochtend een persoonlijk weerbericht — geen reclame, geen gokwerk.",
  children,
  footer,
}: {
  title?: string;
  subtitle?: string;
  quote?: { text: string; author: string } | null;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const audience = resolveAuthAudience(searchParams?.get("lang"), pathname);
  const homeHref = audienceHomeHref(audience);
  const homeAriaLabel =
    audience === "de" ? "WEERZONE Startseite"
      : audience === "fr" || audience === "lu" ? "Accueil Weerzone"
      : audience === "es" ? "Inicio Weerzone"
      : "Weerzone home";

  return (
    <div className="min-h-screen min-h-[100svh] flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="relative w-full" style={{ maxWidth: 440 }}>
        {/* Logo boven de kaart */}
        <div className="flex justify-center mb-8">
          <Link href={homeHref} aria-label={homeAriaLabel}>
            <WzLogo href={null} height={22} />
          </Link>
        </div>

        {/* Title + subtitle */}
        <div className="text-center mb-8">
          <h1
            className="text-white font-black whitespace-pre-line mb-3"
            style={{
              fontSize: "clamp(26px,4vw,34px)",
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
              textShadow: "0 2px 18px rgba(15,26,44,0.4)",
            }}
          >
            {title}
          </h1>
          <p
            className="text-sm leading-relaxed"
            style={{
              color: "rgba(255,255,255,0.84)",
              maxWidth: 360,
              margin: "0 auto",
              textShadow: "0 1px 12px rgba(15,26,44,0.5)",
            }}
          >
            {subtitle}
          </p>
        </div>

        {/* Form card */}
        <div style={{ ...GLASS_CARD, padding: "clamp(28px,4vw,40px)" }}>
          {children}
          {footer && (
            <div className="mt-6 pt-5 text-center text-sm text-slate-400" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
