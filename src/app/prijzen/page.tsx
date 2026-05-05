import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isFounderEmail, FOUNDER_TIER } from "@/lib/founders";
import type { PersonaTier } from "@/lib/personas";
import { PERSONAS, TRIAL_END } from "@/lib/personas";
import PrijzenClient from "./PrijzenClient";

export const dynamic = "force-dynamic";

function buildOffer(tier: "piet" | "reed") {
  const p = PERSONAS[tier];
  const isBeta = Date.now() < TRIAL_END.getTime();
  const regularPrice = (p.priceCents! / 100).toFixed(2);
  const trialEndDate = TRIAL_END.toISOString().split("T")[0];

  return {
    "@type": "Offer",
    priceCurrency: "EUR",
    price: isBeta ? "0.00" : regularPrice,
    ...(isBeta ? { priceValidUntil: trialEndDate } : {}),
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: regularPrice,
      priceCurrency: "EUR",
      referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" },
    },
    availability: "https://schema.org/InStock",
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
        name: `WEERZONE ${PERSONAS.piet.name} — ${PERSONAS.piet.label}`,
        description: PERSONAS.piet.description,
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
        name: `WEERZONE ${PERSONAS.reed.name} — ${PERSONAS.reed.label}`,
        description: PERSONAS.reed.description,
        url: "https://weerzone.nl/app/signup?tier=reed",
        brand: { "@type": "Brand", name: "WEERZONE" },
        offers: buildOffer("reed"),
      },
    },
  ],
};

export default async function PrijzenPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userTier: PersonaTier | null = null;
  let isFounder = false;

  if (user) {
    isFounder = isFounderEmail(user.email);

    if (!isFounder) {
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("tier, status")
        .eq("user_id", user.id)
        .in("status", ["trialing", "active"]);

      const ranking: Record<string, number> = { steve: 3, reed: 2, piet: 1 };
      const best = (subs ?? []).sort(
        (a, b) => (ranking[b.tier] ?? 0) - (ranking[a.tier] ?? 0)
      )[0];
      userTier = (best?.tier ?? null) as PersonaTier | null;
    } else {
      userTier = FOUNDER_TIER;
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchemaLd) }}
      />
      <PrijzenClient userTier={userTier} isFounder={isFounder} />
    </>
  );
}
