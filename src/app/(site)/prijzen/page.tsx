import type { Metadata } from "next";
import { PERSONAS, TRIAL_END } from "@/lib/personas";
import PrijzenClient from "./PrijzenClient";

export const metadata: Metadata = {
  title: "Abonnementen - Piet, Reed en Steve",
  description:
    "Kies je WEERZONE-abonnement. Piet voor dagelijks weer, Reed voor waarschuwingen bij extreem weer, Steve voor bedrijven. Nu tijdelijk gratis te proberen - geen creditcard nodig.",
  keywords: [
    "weerzone abonnement",
    "weer abonnement nederland",
    "persoonlijk weerbericht",
    "weerzone prijzen",
    "weerwaarschuwingen",
  ],
  alternates: { canonical: "https://weerzone.nl/prijzen" },
  openGraph: {
    title: "Abonnementen - Piet, Reed en Steve | WEERZONE",
    description:
      "Piet voor dagelijks weer, Reed voor waarschuwingen, Steve voor bedrijven. Nu gratis te proberen.",
    type: "website",
    locale: "nl_NL",
    url: "https://weerzone.nl/prijzen",
    siteName: "WEERZONE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Abonnementen | WEERZONE",
    description:
      "Piet, Reed of Steve. Hyperlokale weerberichten op maat. Nu gratis te proberen - geen creditcard nodig.",
  },
};

function buildOffer(tier: "piet" | "reed") {
  const p = PERSONAS[tier];
  const isBeta = Date.now() < TRIAL_END.getTime();
  const regularPrice = (p.priceCents! / 100).toFixed(2);
  const trialEndDate = TRIAL_END.toISOString().split("T")[0];

  return {
    "@type": "Offer",
    priceCurrency: "EUR",
    price: isBeta ? "0.00" : regularPrice,
    ...(isBeta
      ? { priceValidUntil: trialEndDate }
      : {
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: regularPrice,
            priceCurrency: "EUR",
            referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" },
          },
        }),
    availability: "https://schema.org/InStock",
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "NL",
      returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
    },
    shippingDetails: {
      "@type": "OfferShippingDetails",
      shippingRate: { "@type": "MonetaryAmount", value: "0.00", currency: "EUR" },
      shippingDestination: { "@type": "DefinedRegion", addressCountry: "NL" },
      deliveryTime: {
        "@type": "ShippingDeliveryTime",
        handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 0, unitCode: "DAY" },
        transitTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 0, unitCode: "DAY" },
      },
    },
    url: `https://weerzone.nl/app/signup?tier=${tier}`,
  };
}

const productSchemaLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "WEERZONE Abonnementen",
  url: "https://weerzone.nl/prijzen",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      item: {
        "@context": "https://schema.org",
        "@type": "Product",
        name: `WEERZONE ${PERSONAS.piet.name} - ${PERSONAS.piet.label}`,
        description: PERSONAS.piet.description,
        image: "https://weerzone.nl/og-image.png",
        url: "https://weerzone.nl/app/signup?tier=piet",
        brand: { "@type": "Brand", name: "WEERZONE" },
        offers: buildOffer("piet"),
      },
    },
    {
      "@type": "ListItem",
      position: 2,
      item: {
        "@context": "https://schema.org",
        "@type": "Product",
        name: `WEERZONE ${PERSONAS.reed.name} - ${PERSONAS.reed.label}`,
        description: PERSONAS.reed.description,
        image: "https://weerzone.nl/og-image.png",
        url: "https://weerzone.nl/app/signup?tier=reed",
        brand: { "@type": "Brand", name: "WEERZONE" },
        offers: buildOffer("reed"),
      },
    },
  ],
};

export default function PrijzenPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchemaLd) }}
      />
      <PrijzenClient userTier={null} isFounder={false} />
    </>
  );
}
