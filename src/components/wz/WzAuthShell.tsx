import Image from "next/image";
import type { ReactNode } from "react";

/**
 * Twee-koloms auth-shell conform handoff. Links blauw marketingpaneel
 * met logo-pill + hero + optionele quote; rechts formulierpaneel. Onder
 * 860px verdwijnt het linkerpaneel en vult het formulier de viewport.
 */
export default function WzAuthShell({
  title = "Het weer, zoals jij het wil.",
  subtitle = "Iedere ochtend een persoonlijk weerbericht in je inbox. Helder, betrouwbaar, zonder ruis.",
  quote,
  children,
  footer,
}: {
  title?: string;
  subtitle?: string;
  quote?: { text: string; author: string } | null;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div
      className="min-h-screen grid"
      style={{
        fontFamily: "var(--font-wz)",
        background: "var(--wz-bg)",
        gridTemplateColumns: "1fr 1fr",
      }}
    >
      <aside
        className="wz-auth-side relative p-10 text-white overflow-hidden hidden md:flex flex-col justify-between"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -10%, #6fa6ff 0%, transparent 55%), linear-gradient(180deg, var(--wz-blue) 0%, var(--wz-blue-deep) 100%)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px)",
            backgroundSize: "3px 3px",
          }}
        />
        <div
          className="relative inline-flex items-center self-start rounded-[10px]"
          style={{ background: "rgba(255,255,255,0.15)", padding: "8px 14px" }}
        >
          <Image
            src="/brand/weerzone-logo.png"
            alt="Weerzone"
            width={94}
            height={22}
            priority
            style={{ height: 22, width: "auto", display: "block" }}
          />
        </div>

        <div className="relative flex flex-col gap-5 max-w-[460px]">
          <h2
            className="text-[40px] leading-[1.1] font-extrabold m-0"
            style={{ letterSpacing: "-0.02em" }}
          >
            {title}
          </h2>
          <p className="text-base leading-[1.55] m-0" style={{ color: "rgba(255,255,255,0.85)" }}>
            {subtitle}
          </p>
          {quote && (
            <div
              className="mt-4 p-5 rounded-2xl border"
              style={{
                background: "rgba(255,255,255,0.08)",
                borderColor: "rgba(255,255,255,0.15)",
              }}
            >
              <p
                className="text-[15px] leading-[1.55] m-0"
                style={{ color: "rgba(255,255,255,0.92)" }}
              >
                “{quote.text}”
              </p>
              <div className="mt-3 text-[13px]" style={{ color: "rgba(255,255,255,0.7)" }}>
                — {quote.author}
              </div>
            </div>
          )}
        </div>

        <div className="relative text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
          © {new Date().getFullYear()} Weerzone · Dagelijks weer voor Nederland
        </div>
      </aside>

      <main className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-[420px]" style={{ color: "var(--wz-text)" }}>
          {children}
          {footer && (
            <div
              className="mt-5 text-center text-sm"
              style={{ color: "var(--wz-text-soft)" }}
            >
              {footer}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
