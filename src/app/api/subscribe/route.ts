import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { Resend } from "resend";


export async function POST(req: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY || "dummy");
    const { email, city, lat, lon } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Ongeldig e-mailadres" }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      // Geen Supabase — sla op als JSON-bestand (development fallback)
      return NextResponse.json({ ok: true, demo: true });
    }

    // Upsert in subscribers tabel
    const { error } = await supabase
      .from("subscribers")
      .upsert(
        { email: email.toLowerCase().trim(), city: city || "Amsterdam", lat, lon, active: true },
        { onConflict: "email" }
      );

    if (error) {
      console.error("Subscribe error:", error);
      return NextResponse.json({ error: "Opslaan mislukt" }, { status: 500 });
    }

    // Welkomstmail sturen via Resend
    if (process.env.RESEND_API_KEY) {
      try {
        // Probeer eigen domein, fallback naar resend.dev
        const fromAddress = "WeerZone <info@weerzone.nl>";
        const fallbackFrom = "WeerZone <onboarding@resend.dev>";
        let { data, error } = await resend.emails.send({
          from: fromAddress,
          to: email,
          subject: "Bevestigd: Je Toegang tot WeerZone.",
          html: `
<!DOCTYPE html>
<html lang="nl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:0 auto;">

    <!-- HERO -->
    <div style="background:linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #60a5fa 100%);padding:40px 24px 36px;text-align:center;">
      <img src="https://weerzone.nl/logo-full.png" alt="WeerZone" style="height:40px;width:auto;margin-bottom:8px;opacity:0.9;" />
      <p style="color:rgba(255,255,255,0.7);font-size:10px;margin:0 0 28px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">48 uur. De rest is ruis.</p>
      <div style="font-size:64px;line-height:1;margin-bottom:12px;">✅</div>
      <h1 style="color:#ffffff;font-size:28px;font-weight:900;margin:0 0 8px;line-height:1.2;">Je bent binnen.</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:15px;margin:0;">Locatie: <strong>${city || "Amsterdam"}</strong></p>
    </div>

    <!-- QUOTE -->
    <div style="background:#1e293b;padding:16px 24px;text-align:center;">
      <p style="margin:0;font-size:13px;color:#f59e0b;font-weight:600;font-style:italic;">"Terwijl de rest de 14-daagse gelooft, weet jij wat er echt aankomt."</p>
    </div>

    <!-- WAT JE KRIJGT -->
    <div style="background:#ffffff;padding:28px 24px;border-bottom:1px solid #e2e8f0;">
      <p style="margin:0 0 20px;font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">Wat je krijgt</p>

      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
        <tr>
          <td style="width:48%;background:#f8fafc;border-radius:12px;padding:20px;vertical-align:top;">
            <p style="margin:0;font-size:28px;line-height:1;">📡</p>
            <p style="margin:8px 0 4px;font-size:14px;font-weight:800;color:#1e293b;">48-Uur Briefing</p>
            <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">Elke ochtend om 08:00. Temperatuur, regen, wind, UV — per uur uitgesplitst. Geen gelul.</p>
          </td>
          <td style="width:4%;"></td>
          <td style="width:48%;background:#f8fafc;border-radius:12px;padding:20px;vertical-align:top;">
            <p style="margin:0;font-size:28px;line-height:1;">🚨</p>
            <p style="margin:8px 0 4px;font-size:14px;font-weight:800;color:#1e293b;">Extreme Alerts</p>
            <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">Wolkbreuk? Storm? Hittegolf? Je weet het eerder dan het KNMI het meldt.</p>
          </td>
        </tr>
      </table>

      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-top:12px;">
        <tr>
          <td style="width:48%;background:#f8fafc;border-radius:12px;padding:20px;vertical-align:top;">
            <p style="margin:0;font-size:28px;line-height:1;">🎯</p>
            <p style="margin:8px 0 4px;font-size:14px;font-weight:800;color:#1e293b;">Jouw Locatie</p>
            <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">Niet "ergens in Nederland". Exacte data voor ${city || "jouw stad"}. Op de vierkante meter.</p>
          </td>
          <td style="width:4%;"></td>
          <td style="width:48%;background:#f8fafc;border-radius:12px;padding:20px;vertical-align:top;">
            <p style="margin:0;font-size:28px;line-height:1;">🧠</p>
            <p style="margin:8px 0 4px;font-size:14px;font-weight:800;color:#1e293b;">KNMI HARMONIE</p>
            <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">Direct van het KNMI supercomputer. 2.5km resolutie. Zo nauwkeurig als het kan.</p>
          </td>
        </tr>
      </table>
    </div>

    <!-- TIMELINE -->
    <div style="background:#ffffff;padding:24px;border-bottom:1px solid #e2e8f0;">
      <p style="margin:0 0 16px;font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">Wat er nu gebeurt</p>
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
        <tr>
          <td style="width:40px;vertical-align:top;padding-top:2px;">
            <div style="width:24px;height:24px;border-radius:50%;background:#22c55e;text-align:center;line-height:24px;color:white;font-size:12px;font-weight:700;">✓</div>
          </td>
          <td style="padding-bottom:16px;">
            <p style="margin:0;font-size:14px;font-weight:700;color:#1e293b;">Aangemeld</p>
            <p style="margin:2px 0 0;font-size:12px;color:#64748b;">Zojuist — je staat in het systeem</p>
          </td>
        </tr>
        <tr>
          <td style="width:40px;vertical-align:top;padding-top:2px;">
            <div style="width:24px;height:24px;border-radius:50%;background:#3b82f6;text-align:center;line-height:24px;color:white;font-size:12px;">⟳</div>
          </td>
          <td style="padding-bottom:16px;">
            <p style="margin:0;font-size:14px;font-weight:700;color:#1e293b;">Radar kalibreren</p>
            <p style="margin:2px 0 0;font-size:12px;color:#64748b;">We laden de weermodellen voor ${city || "jouw locatie"}</p>
          </td>
        </tr>
        <tr>
          <td style="width:40px;vertical-align:top;padding-top:2px;">
            <div style="width:24px;height:24px;border-radius:50%;background:#f1f5f9;text-align:center;line-height:24px;color:#94a3b8;font-size:12px;">◦</div>
          </td>
          <td>
            <p style="margin:0;font-size:14px;font-weight:700;color:#1e293b;">Eerste briefing</p>
            <p style="margin:2px 0 0;font-size:12px;color:#64748b;">Morgenochtend 08:00 in je inbox</p>
          </td>
        </tr>
      </table>
    </div>

    <!-- CTA -->
    <div style="background:#ffffff;padding:28px 24px;text-align:center;">
      <p style="margin:0 0 16px;font-size:14px;color:#475569;">Wil je nu al zien wat er aankomt?</p>
      <a href="https://weerzone.nl/weer/${(city || "amsterdam").toLowerCase().replace(/\\s+/g, '-')}" style="display:inline-block;padding:14px 40px;background:#f59e0b;color:#1e293b;font-weight:800;font-size:14px;border-radius:999px;text-decoration:none;text-transform:uppercase;box-shadow:0 4px 12px rgba(245,158,11,0.3);">
        Bekijk Live Dashboard →
      </a>
    </div>

    <!-- FOOTER -->
    <div style="padding:24px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#94a3b8;">
        WeerZone.nl — KNMI HARMONIE data<br>
        <span style="font-size:10px;">48 uur. De rest is ruis.</span>
      </p>
      <p style="margin:12px 0 0;font-size:11px;">
        <a href="https://weerzone.nl/api/unsubscribe?email=${encodeURIComponent(email)}" style="color:#94a3b8;text-decoration:underline;">Uitschrijven</a>
      </p>
    </div>

  </div>
</body>
</html>`,
        });

        // Als domein niet geverifieerd is, fallback naar resend.dev
        if (error && (error.message?.includes("not verified") || error.message?.includes("domain"))) {
          console.warn("Domain not verified, falling back to resend.dev");
          const retry = await resend.emails.send({
            from: fallbackFrom,
            to: email,
            subject: "Bevestigd: Je Toegang tot WeerZone.",
            html: `<div style="font-family:system-ui;padding:40px;max-width:480px;margin:0 auto;background:linear-gradient(135deg,#2563eb,#3b82f6);border-radius:18px;text-align:center;">
              <div style="font-size:48px;margin-bottom:12px;">✅</div>
              <h2 style="color:#ffffff;margin:0 0 8px;">Je bent binnen.</h2>
              <p style="color:rgba(255,255,255,0.85);margin:0 0 24px;">Locatie: <strong>${city || "Amsterdam"}</strong></p>
              <div style="background:white;border-radius:18px;padding:24px;text-align:left;">
                <p style="color:#475569;margin:0 0 12px;font-size:14px;">Morgenochtend om 08:00 krijg je je eerste 48-uurs briefing. Temperatuur, regen, wind, UV — per uur uitgesplitst.</p>
                <p style="color:#1e293b;font-weight:700;margin:0;font-size:14px;">48 uur. De rest is ruis.</p>
              </div>
            </div>`,
          });
          data = retry.data;
          error = retry.error;
        }
        if (error) {
          console.error("Resend API rejected the email:", error);
          // Subscriber is opgeslagen, email mislukt — geen 500 teruggeven
          console.error("Email failed but subscriber saved:", error.message);
        } else {
          console.log("Welcome email sent successfully:", data);
        }
      } catch (err: any) {
        console.error("Welcome email exception:", err);
        return NextResponse.json({ error: "Email niet verzonden (Server error)", details: err.message }, { status: 500 });
      }
    } else {
       console.error("NO RESEND_API_KEY FOUND IN ENV");
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
