"use client";

import { usePathname } from "next/navigation";
import CookieBanner from "@/components/CookieBanner";
import InstallPrompt from "@/components/InstallPrompt";
import FounderBanner from "@/components/FounderBanner";
import GlobalPersonaModal from "@/components/GlobalPersonaModal";
import AffiliateBanner from "@/components/AffiliateBanner";
import GlobalNav from "@/components/wz/GlobalNav";
import Footer from "@/components/Footer";
import MobilePageSwipe from "@/components/MobilePageSwipe";
import WeatherScenarioToggle from "@/components/WeatherScenarioToggle";
import CalendarEventOverlay from "@/components/CalendarEventOverlay";
import CalendarEventToggle from "@/components/CalendarEventToggle";
import Script from "next/script";
import { detectLocale, type Locale } from "@/config/locales";

type SiteShellProps = {
  activeDeal: any;
  globalSchemasLd: unknown[];
  children: React.ReactNode;
};

export default function SiteShell({
  activeDeal,
  globalSchemasLd,
  children,
}: SiteShellProps) {
  const pathname = usePathname() ?? "/";
  const locale: Locale = detectLocale(pathname);
  const isDE = locale === "de";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(globalSchemasLd) }}
      />
      <Script
        id="adsense-loader"
        strategy="lazyOnload"
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6187487207780127"
        crossOrigin="anonymous"
      />

      {activeDeal && (
        <AffiliateBanner
          message={activeDeal.flash_deal_message}
          link={activeDeal.flash_deal_link}
          cta={isDE ? "Jetzt sichern" : "Profiteer nu"}
          type={activeDeal.flash_deal_type as any}
        />
      )}

      <GlobalNav />
      <MobilePageSwipe />
      <div className="min-h-[60vh]">{children}</div>
      <Footer />
      <CalendarEventOverlay />
      <CookieBanner />
      <InstallPrompt />
      <FounderBanner />
      <GlobalPersonaModal />
      <WeatherScenarioToggle />
      <CalendarEventToggle />
    </>
  );
}
