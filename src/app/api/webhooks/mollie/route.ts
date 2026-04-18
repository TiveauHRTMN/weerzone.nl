import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getPayment, createSubscription } from "@/lib/mollie";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

// Mollie stuurt POST met `id=tr_xxx` als form-encoded body
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    let paymentId: string | null = null;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      paymentId = params.get("id");
    } else {
      const body = await req.json().catch(() => ({}));
      paymentId = body.id ?? null;
    }

    if (!paymentId) {
      return NextResponse.json({ error: "no payment id" }, { status: 400 });
    }

    // Haal betaling op bij Mollie voor verificatie
    const payment = await getPayment(paymentId);
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase niet beschikbaar" }, { status: 500 });
    }

    // Zoek de subscription-record
    const { data: sub } = await supabase
      .from("b2b_subscriptions")
      .select("*")
      .eq("mollie_payment_id", paymentId)
      .maybeSingle();

    if (!sub) {
      // Soms komt webhook voor een recurring payment — dan updaten we gewoon last_payment_at
      const customerId = payment.customerId;
      if (customerId && payment.status === "paid") {
        await supabase
          .from("b2b_subscriptions")
          .update({ last_payment_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq("mollie_customer_id", customerId)
          .eq("status", "active");
      }
      return NextResponse.json({ ok: true, note: "recurring payment logged" });
    }

    // Status afhandelen
    if (payment.status === "paid") {
      // Eerste betaling gelukt — start recurring subscription
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://weerzone.nl";

      try {
        const subscription = await createSubscription({
          customerId: sub.mollie_customer_id,
          amountCents: sub.amount_cents,
          interval: "1 month",
          description: `WEERZONE Zakelijk — ${sub.business_name}`,
          webhookUrl: `${siteUrl}/api/webhooks/mollie`,
        });

        await supabase
          .from("b2b_subscriptions")
          .update({
            status: "active",
            activated_at: new Date().toISOString(),
            mollie_subscription_id: subscription.id,
            last_payment_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", sub.id);

        // Stuur welkomstmail
        if (process.env.RESEND_API_KEY) {
          try {
            const resend = new Resend(process.env.RESEND_API_KEY);
            await resend.emails.send({
              from: "WEERZONE Zakelijk <info@weerzone.nl>",
              to: sub.email,
              subject: "Welkom bij WEERZONE Zakelijk — je account is actief",
              html: `<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,sans-serif;">
  <div style="max-width:480px;margin:0 auto;">
    <div style="background:linear-gradient(135deg,#1e293b,#0f172a);padding:32px 24px;text-align:center;">
      <img src="https://weerzone.nl/logo-full.png" alt="WEERZONE" style="height:32px;opacity:0.9;" />
      <p style="color:rgba(255,255,255,0.5);font-size:9px;margin:8px 0 24px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Zakelijk · Abonnement actief</p>
      <div style="font-size:48px;margin-bottom:8px;">✅</div>
      <h1 style="color:#fff;font-size:24px;font-weight:900;margin:0;line-height:1.3;">Je bent live.</h1>
    </div>
    <div style="background:#f59e0b;padding:12px 24px;text-align:center;">
      <p style="margin:0;font-size:13px;color:#1e293b;font-weight:700;">€${(sub.amount_cents / 100).toFixed(2)} per maand · ${sub.plan}</p>
    </div>
    <div style="background:#fff;padding:28px 24px;">
      <p style="margin:0 0 16px;font-size:15px;color:#1e293b;font-weight:700;">Beste ${sub.business_name},</p>
      <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;">Je betaling is gelukt. Vanaf morgenochtend 08:00 krijg je elke dag je 48-uurs weerrapport voor <strong>${sub.city || "jouw locatie"}</strong> in je inbox.</p>
      <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;">Het abonnement loopt automatisch door. Opzeggen kan maandelijks via een reply op deze mail.</p>
      <a href="https://weerzone.nl" style="display:block;margin-top:20px;padding:14px;background:#f59e0b;color:#1e293b;font-weight:800;border-radius:12px;text-decoration:none;text-align:center;">Bekijk dashboard →</a>
    </div>
    <div style="padding:20px 24px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#94a3b8;">WEERZONE — 48 uur. De rest is ruis.</p>
    </div>
  </div>
</body></html>`,
            });
          } catch (emailErr) {
            console.error("[webhook] welcome email failed", emailErr);
          }
        }
      } catch (subErr) {
        console.error("[webhook] subscription creation failed", subErr);
        await supabase
          .from("b2b_subscriptions")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("id", sub.id);
      }
    } else if (payment.status === "failed" || payment.status === "canceled" || payment.status === "expired") {
      await supabase
        .from("b2b_subscriptions")
        .update({ status: payment.status === "failed" ? "failed" : "cancelled", updated_at: new Date().toISOString() })
        .eq("id", sub.id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown";
    console.error("[webhook/mollie]", msg);
    // Mollie retry's gaan door — altijd 200 teruggeven bij onze eigen fouten
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Mollie doet een GET-check bij het valideren van de webhook URL
export async function GET() {
  return NextResponse.json({ ok: true });
}
