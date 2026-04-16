import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { createCustomer, createFirstPayment } from "@/lib/mollie";
import type { B2BIndustry } from "@/lib/b2b-emails";

export const dynamic = "force-dynamic";

const PLANS = {
  starter: { amount_cents: 1900, label: "Starter €19/maand" },
} as const;

export async function POST(req: Request) {
  try {
    const { businessName, email, city, industry, phone, plan = "starter" } = await req.json();

    // Validatie
    if (!businessName || typeof businessName !== "string" || businessName.trim().length < 2) {
      return NextResponse.json({ error: "Vul een bedrijfsnaam in" }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Ongeldig e-mailadres" }, { status: 400 });
    }
    if (!industry) {
      return NextResponse.json({ error: "Kies een branche" }, { status: 400 });
    }

    const planConfig = PLANS[plan as keyof typeof PLANS];
    if (!planConfig) {
      return NextResponse.json({ error: "Ongeldig plan" }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Database niet beschikbaar" }, { status: 500 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://weerzone.nl";

    // 1. Maak Mollie customer aan
    const customer = await createCustomer(businessName.trim(), cleanEmail);

    // 2. Maak eerste betaling (mandate setup + eerste €19)
    const payment = await createFirstPayment({
      customerId: customer.id,
      amountCents: planConfig.amount_cents,
      description: `WeerZone Zakelijk — ${planConfig.label} voor ${businessName.trim()}`,
      redirectUrl: `${siteUrl}/zakelijk/bedankt?pid={id}`.replace("{id}", ""),
      webhookUrl: `${siteUrl}/api/webhooks/mollie`,
      metadata: {
        businessName: businessName.trim(),
        email: cleanEmail,
        industry,
        city: city ?? null,
        phone: phone ?? null,
        plan,
      },
    });

    // Gebruik exacte redirect met payment ID
    // (Mollie vervangt {id} niet automatisch — we zetten 'm direct)
    const checkoutUrl = payment._links?.checkout?.href;

    // 3. Sla subscription-record op (status pending)
    await supabase.from("b2b_subscriptions").insert({
      business_name: businessName.trim(),
      email: cleanEmail,
      city: city?.trim() || null,
      industry: industry as B2BIndustry,
      phone: phone?.trim() || null,
      plan,
      amount_cents: planConfig.amount_cents,
      interval: "1 month",
      mollie_customer_id: customer.id,
      mollie_payment_id: payment.id,
      status: "pending",
    });

    if (!checkoutUrl) {
      return NextResponse.json({ error: "Geen checkout-URL ontvangen van Mollie" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, checkoutUrl, paymentId: payment.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Onbekende fout";
    console.error("[b2b/subscribe-paid]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
