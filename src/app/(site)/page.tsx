import type { Metadata } from "next";
import HomeOnboarding from "@/components/HomeOnboarding";
import { schemaWebSite, schemaLd } from "@/lib/schema";
import { hreflangLanguages } from "@/lib/hreflang";

export const metadata: Metadata = {
  title: {
    absolute: "WEERZONE - Weersverwachting per locatie, vandaag en morgen",
  },
  description:
    "WEERZONE geeft je een helder 48-uurs weerbericht voor jouw locatie. Reclamevrij en gericht op keuzes voor vandaag en morgen.",
  alternates: {
    canonical: "https://weerzone.nl",
    languages: hreflangLanguages("/"),
  },
  openGraph: {
    title: "WEERZONE - Weer voor vandaag en morgen",
    description:
      "Een helder 48-uurs weerbericht voor jouw locatie. Geen ruis, geen reclame, wel bruikbare keuzes.",
    type: "website",
    locale: "nl_NL",
    url: "https://weerzone.nl",
    siteName: "WEERZONE",
  },
  twitter: {
    card: "summary_large_image",
    title: "WEERZONE - Weer voor vandaag en morgen",
    description:
      "Bekijk wat het weer vandaag en morgen betekent voor jouw locatie.",
  },
};

export default function Home() {
  return (
    <>
      <script
        {...schemaLd(schemaWebSite())}
      />
      <HomeOnboarding />
    </>
  );
}
