import type { Metadata } from "next";
import WeatherDashboard from "@/components/WeatherDashboard";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://weerzone.nl",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "WeerZone",
  url: "https://weerzone.nl",
  description:
    "Nauwkeurig weer voor Nederland met KNMI HARMONIE en DWD ICON modellen. 48-uurs voorspelling, fietsweer, en eerlijk weeradvies.",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://weerzone.nl/weer/{city}",
    "query-input": "required name=city",
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        <WeatherDashboard />
      </main>
    </>
  );
}
