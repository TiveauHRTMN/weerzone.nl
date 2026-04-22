import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createCustomer, createFirstPayment } from "@/lib/mollie";
import { PERSONAS, type PersonaTier } from "@/lib/personas";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { name, postcode, tier } = await req.json();

    if (!tier || !PERSONAS[tier as PersonaTier]) {
      return NextResponse.json({ error: "Ongeldig plan" }, { status: 400 });
    }

    const persona = PERSONAS[tier as PersonaTier];
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    // Update profiel met naam/postcode
    await supabase.from("user_profile").upsert({
      id: user.id,
      email: user.email!,
      full_name: name,
      postcode: postcode,
      updated_at: new Date().toISOString(),
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://weerzone.nl";

    // 1. Maak Mollie customer aan
    const customer = await createCustomer(name, user.email!);

    // 2. Maak eerste betaling aan
    const payment = await createFirstPayment({
      customerId: customer.id,
      amountCents: persona.founderPriceCents,
      description: `WEERZONE ${persona.name} — Abonnement voor ${name}`,
      redirectUrl: `${siteUrl}/app?checkout=success`,
      webhookUrl: `${siteUrl}/api/webhooks/mollie`,
      metadata: {
        userId: user.id,
        tier: persona.tier,
      },
    });

    // 3. Zet subscription op 'pending' status door trial tijdelijk te updaten (of een nieuwe rij te maken)
    await supabase.from("subscriptions").upsert({
      user_id: user.id,
      tier: persona.tier,
      status: "trialing", // Zodra betaald, wordt dit 'active'
      mollie_customer_id: customer.id,
      founder_price_cents: persona.founderPriceCents,
      is_founder: true,
      updated_at: new Date().toISOString(),
    });

    const checkoutUrl = payment._links?.checkout?.href;
    if (!checkoutUrl) {
      return NextResponse.json({ error: "Geen checkout-URL ontvangen" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, checkoutUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Onbekende fout";
    console.error("[checkout-persona]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
