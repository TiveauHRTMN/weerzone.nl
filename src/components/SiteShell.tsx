"use client";

import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import GlobalNav from "@/components/wz/GlobalNav";
import Footer from "@/components/Footer";
import GlobalWeatherBackground from "@/components/GlobalWeatherBackground";

// Stand-alone routes draaien bovenop weerzone.nl maar zonder enige WEERZONE-chrome
// of overlays (navbar, footer, cookiebanner, persona-modal, toggles).
const STANDALONE_PATHS = ["/hartmanwk2026"];

const MobilePageSwipe = dynamic(() => import("@/components/MobilePageSwipe"), { ssr: false });
const CookieBanner = dynamic(() => import("@/components/CookieBanner"), { ssr: false });
const InstallPrompt = dynamic(() => import("@/components/InstallPrompt"), { ssr: false });
const FounderBanner = dynamic(() => import("@/components/FounderBanner"), { ssr: false });
const GlobalPersonaModal = dynamic(() => import("@/components/GlobalPersonaModal"), { ssr: false });
const WeatherScenarioToggle = dynamic(() => import("@/components/WeatherScenarioToggle"), { ssr: false });
const CalendarEventOverlay = dynamic(() => import("@/components/CalendarEventOverlay"), { ssr: false });
const CalendarEventToggle = dynamic(() => import("@/components/CalendarEventToggle"), { ssr: false });

type SiteShellProps = {
  globalSchemasLd: readonly unknown[];
  children: React.ReactNode;
};

export default function SiteShell({
  globalSchemasLd,
  children,
}: SiteShellProps) {
  const [showDeferredShell, setShowDeferredShell] = useState(false);
  const pathname = usePathname() ?? "/";
  const standalone = STANDALONE_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    const win = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const timeout = window.matchMedia("(max-width: 767px)").matches ? 1800 : 900;
    if (win.requestIdleCallback) {
      const id = win.requestIdleCallback(() => setShowDeferredShell(true), { timeout });
      return () => win.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(() => setShowDeferredShell(true), timeout);
    return () => window.clearTimeout(id);
  }, []);

  if (standalone) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Universele weer-lucht achter elke pagina (per locatie). De witte/lichte
          content-kaarten liggen er bovenop; weer/agent-pagina's tekenen hun eigen
          geanimeerde achtergrond op z-0 daar weer overheen. */}
      <GlobalWeatherBackground />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(globalSchemasLd) }}
      />

      <Suspense fallback={null}>
        <GlobalNav />
      </Suspense>
      <div className="min-h-[60vh]">{children}</div>
      <Footer />
      {showDeferredShell && (
        <>
          <MobilePageSwipe />
          <Suspense fallback={null}>
            <CalendarEventOverlay />
          </Suspense>
          <CookieBanner />
          <InstallPrompt />
          <FounderBanner />
          <GlobalPersonaModal />
          <Suspense fallback={null}>
            <WeatherScenarioToggle />
          </Suspense>
          <Suspense fallback={null}>
            <CalendarEventToggle />
          </Suspense>
        </>
      )}
    </>
  );
}
