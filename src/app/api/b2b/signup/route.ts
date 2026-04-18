import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { Resend } from "resend";
import type { B2BIndustry } from "@/lib/b2b-emails";

const VALID_INDUSTRIES: B2BIndustry[] = [
  "glazenwasser", "bouw", "horeca", "evenementen", "agrarisch",
  "transport", "sport", "schoonmaak", "schildersbedrijf",
  "dakdekker", "tuinonderhoud", "bezorging",
];

export async function POST(req: Request) {
  try {
    const { businessName, email, city, industry, phone } = await req.json();

    // Validatie
    if (!businessName || typeof businessName !== "string" || businessName.trim().length < 2) {
      return NextResponse.json({ error: "Vul een bedrijfsnaam in" }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Ongeldig e-mailadres" }, { status: 400 });
    }
    if (!industry || !VALID_INDUSTRIES.includes(industry as B2BIndustry)) {
      return NextResponse.json({ error: "Kies een branche" }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Database niet beschikbaar" }, { status: 500 });
    }

    // Upsert in b2b_leads
    const { error } = await supabase
      .from("b2b_leads")
      .upsert(
        {
          business_name: businessName.trim(),
          email: email.toLowerCase().trim(),
          city: city?.trim() || null,
          industry,
          phone: phone?.trim() || null,
          source: "website",
          status: "new",
        },
        { onConflict: "email" }
      );

    if (error) {
      console.error("B2B signup error:", error);
      return NextResponse.json({ error: "Opslaan mislukt" }, { status: 500 });
    }

    // Bevestigingsmail sturen
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "WEERZONE Zakelijk <info@weerzone.nl>",
          to: email.toLowerCase().trim(),
          subject: "Welkom bij WEERZONE Zakelijk — we nemen contact op",
          html: `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:0 auto;">
    <div style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:32px 24px 28px;text-align:center;">
      <img src="https://weerzone.nl/logo-full.png" alt="WEERZONE" style="height:32px;width:auto;margin-bottom:6px;opacity:0.9;" />
      <p style="color:rgba(255,255,255,0.5);font-size:9px;margin:0 0 24px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Zakelijk · 48-uurs weerdata</p>
      <div style="font-size:48px;line-height:1;margin-bottom:12px;">🏢</div>
      <h1 style="color:#ffffff;font-size:24px;font-weight:900;margin:0;line-height:1.3;">Aanmelding ontvangen</h1>
    </div>
    <div style="background:#f59e0b;padding:12px 24px;text-align:center;">
      <p style="margin:0;font-size:13px;color:#1e293b;font-weight:700;">We nemen binnen 24 uur contact op.</p>
    </div>
    <div style="background:#ffffff;padding:28px 24px;">
      <p style="margin:0 0 16px;font-size:15px;color:#1e293b;font-weight:700;">Beste ${businessName.trim()},</p>
      <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;">Bedankt voor je aanmelding bij WEERZONE Zakelijk. We hebben je gegevens ontvangen en nemen binnen 24 uur contact met je op om je account in te richten.</p>
      <div style="background:#f8fafc;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #e2e8f0;">
        <p style="margin:0 0 12px;font-size:12px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Jouw gegevens</p>
        <p style="margin:0 0 6px;font-size:14px;color:#1e293b;"><strong>Bedrijf:</strong> ${businessName.trim()}</p>
        <p style="margin:0 0 6px;font-size:14px;color:#1e293b;"><strong>Branche:</strong> ${industry}</p>
        ${city ? `<p style="margin:0 0 6px;font-size:14px;color:#1e293b;"><strong>Stad:</strong> ${city.trim()}</p>` : ""}
        ${phone ? `<p style="margin:0;font-size:14px;color:#1e293b;"><strong>Telefoon:</strong> ${phone.trim()}</p>` : ""}
      </div>
      <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;">In de tussentijd kun je alvast een kijkje nemen op ons dashboard:</p>
      <a href="https://weerzone.nl" style="display:block;padding:14px;background:#f59e0b;color:#1e293b;font-weight:800;font-size:14px;border-radius:12px;text-decoration:none;text-align:center;box-shadow:0 4px 16px rgba(245,158,11,0.3);">
        Bekijk WEERZONE →
      </a>
    </div>
    <div style="padding:20px 24px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#94a3b8;">WEERZONE.nl — 48 uur. De rest is ruis.</p>
    </div>
  </div>
</body>
</html>`,
        });
      } catch (emailErr) {
        console.error("B2B confirmation email failed:", emailErr);
        // Niet fataal — lead is opgeslagen
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
