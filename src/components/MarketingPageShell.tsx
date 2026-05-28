import type { ReactNode } from "react";
import WeatherDashboard from "@/components/WeatherDashboard";
import type { Locale } from "@/config/locales";

type MarketingPageShellProps = {
  locale?: Locale;
  children: ReactNode;
};

export default function MarketingPageShell({
  locale = "nl",
  children,
}: MarketingPageShellProps) {
  return (
    <WeatherDashboard
      hideWeatherInfo
      locale={locale}
      topContent={<div className="space-y-8 py-8 sm:py-12">{children}</div>}
    />
  );
}
