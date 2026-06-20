"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import WzLogo from "./WzLogo";
import { audienceHomeHref, resolveAuthAudience } from "@/lib/auth-i18n";

/**
 * Auth-chrome voor login/signup. Eén grote Hollandse lucht: diep nachtblauw
 * bovenin dat door blauw naar een warme zonnegloed op de horizon zakt (de
 * merk-geel als échte laagstaande zon, niet als losse kleurvlek). Daarop een
 * precisie-glaskaart. Boldness zit in de lucht; de rest blijft rustig.
 */

const GLASS_CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.97)",
  borderRadius: 28,
  border: "1px solid rgba(255,255,255,0.85)",
  boxShadow:
    "0 32px 80px rgba(8,18,40,0.45), 0 10px 28px rgba(8,18,40,0.28), inset 0 1px 0 rgba(255,255,255,0.9)",
};

export default function WzAuthShell({
  title = "48 uur vooruit.\nDe rest is ruis.",
  subtitle = "Per GPS, op jouw locatie. Elke ochtend een persoonlijk weerbericht — geen reclame, geen gokwerk.",
  eyebrow = "48 uur vooruit · op jouw locatie",
  children,
  footer,
}: {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
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
    <div className="relative min-h-screen min-h-[100svh] overflow-hidden flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Lucht: navy -> blauw -> warme horizon */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20"
        style={{
          background:
            "linear-gradient(180deg, #07101f 0%, #0e2247 28%, #1b427a 52%, #2f63a8 72%, #5183bd 88%, #7ba4cf 100%)",
        }}
      />
      {/* Zonnegloed op de horizon (merk-geel als laagstaande zon) */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 motion-safe:animate-[wzGlow_9s_ease-in-out_infinite]"
        style={{
          background:
            "radial-gradient(150% 60% at 50% 104%, rgba(255,209,32,0.85) 0%, rgba(255,180,52,0.45) 16%, rgba(255,176,46,0.18) 32%, rgba(255,176,46,0.05) 46%, transparent 60%)",
        }}
      />
      {/* Dunne horizonlijn waar de zon de lucht raakt */}
      <div
        aria-hidden
        className="absolute inset-x-0 -z-10"
        style={{
          bottom: "9%",
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(255,224,140,0.55) 30%, rgba(255,224,140,0.55) 70%, transparent)",
        }}
      />
      {/* Zachte wolkenslierten — CSS, geen clipart */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(40% 14% at 22% 26%, rgba(255,255,255,0.16), transparent 70%)," +
            "radial-gradient(52% 16% at 78% 18%, rgba(255,255,255,0.12), transparent 72%)," +
            "radial-gradient(60% 18% at 60% 70%, rgba(255,255,255,0.10), transparent 72%)",
          filter: "blur(2px)",
        }}
      />

      <div className="relative w-full" style={{ maxWidth: 430 }}>
        {/* Logo */}
        <div className="flex justify-center mb-7">
          <Link href={homeHref} aria-label={homeAriaLabel}>
            <WzLogo href={null} height={22} />
          </Link>
        </div>

        {/* Eyebrow + titel + subtitel */}
        <div className="text-center mb-7">
          {eyebrow && (
            <div
              className="mb-3 inline-flex items-center gap-2"
              style={{
                font: "700 11px/1 var(--font-wz-mono)",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.72)",
              }}
            >
              <span
                aria-hidden
                style={{ width: 6, height: 6, borderRadius: 99, background: "var(--wz-sun)", boxShadow: "0 0 10px rgba(255,210,26,0.9)" }}
              />
              {eyebrow}
            </div>
          )}
          <h1
            className="text-white font-extrabold whitespace-pre-line mb-2.5"
            style={{
              fontSize: "clamp(28px,4.4vw,36px)",
              letterSpacing: "-0.03em",
              lineHeight: 1.06,
              textShadow: "0 2px 30px rgba(8,18,40,0.55)",
            }}
          >
            {title}
          </h1>
          <p
            className="text-sm leading-relaxed mx-auto"
            style={{
              color: "rgba(255,255,255,0.82)",
              maxWidth: 350,
              textShadow: "0 1px 16px rgba(8,18,40,0.6)",
            }}
          >
            {subtitle}
          </p>
        </div>

        {/* Glaskaart */}
        <div style={{ ...GLASS_CARD, padding: "clamp(26px,4vw,36px)" }}>
          {children}
          {footer && (
            <div
              className="mt-6 pt-5 text-center text-sm"
              style={{ borderTop: "1px solid rgba(15,26,44,0.08)", color: "var(--wz-text-mute)" }}
            >
              {footer}
            </div>
          )}
        </div>

        {/* Merkregel onder de kaart */}
        <p
          className="text-center mt-6"
          style={{
            font: "700 10px/1 var(--font-wz-mono)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          Weerzone · weer voor heel Nederland
        </p>
      </div>
    </div>
  );
}
