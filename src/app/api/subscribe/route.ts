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
    if (!supabase) return NextResponse.json({ ok: true, demo: true });

    const { error } = await supabase
      .from("subscribers")
      .upsert(
        { email: email.toLowerCase().trim(), city: city || "Amsterdam", lat, lon, active: true },
        { onConflict: "email" }
      );

    if (error) return NextResponse.json({ error: "Opslaan mislukt" }, { status: 500 });

    if (process.env.RESEND_API_KEY) {
      try {
        const fromAddress = "WeerZone <info@weerzone.nl>";
        const welcomeHtml = `
<!DOCTYPE html>
<html lang="nl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:32px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.1);margin-top:40px;margin-bottom:40px;">
    
    <!-- HEADER HERO -->
    <div style="background:linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);padding:60px 40px;text-align:center;position:relative;">
      <div style="background:rgba(255,255,255,0.2);padding:10px 20px;border-radius:100px;display:inline-block;margin-bottom:24px;border:1px solid rgba(255,255,255,0.3);">
        <p style="color:white;font-size:12px;margin:0;font-weight:900;text-transform:uppercase;letter-spacing:2px;">Gefeliciteerd met je Upgrade! 🏆</p>
      </div>
      <h1 style="color:#ffffff;font-size:48px;font-weight:900;margin:0 0 16px;line-height:1;text-transform:uppercase;letter-spacing:-1px;">BOEM! 🚀<br>JE BENT BINNEN!</h1>
      <p style="color:rgba(255,255,255,0.8);font-size:20px;margin:0;font-weight:600;">Welkom bij de revolutie van de weermacht.</p>
    </div>

    <!-- MAIN CONTENT -->
    <div style="padding:50px 40px;text-align:center;">
      <h2 style="font-size:24px;color:#1e293b;margin:0 0 20px;font-weight:800;">JIJ BENT NU DE BAAS OVER HET WEER!</h2>
      <p style="font-size:16px;color:#475569;line-height:1.7;margin:0 0 40px;">
        Vanaf nu weet jij alles eerder, beter en nauwkeuriger dan de rest van Nederland. Geen vage voorspellingen meer, maar keiharde data direct in je inbox. Je staat nu officieel 48 uur voorop.
      </p>

      <!-- THE TEAM -->
      <div style="text-align:left;margin-bottom:40px;">
        <p style="font-size:12px;color:#94a3b8;font-weight:800;text-transform:uppercase;letter-spacing:2px;margin-bottom:20px;text-align:center;">Maak kennis met je nieuwe droomteam:</p>
        
        <div style="background:#eff6ff;border-radius:24px;padding:30px;margin-bottom:20px;border:2px solid #dbeafe;">
          <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
            <tr>
              <td style="font-size:48px;width:60px;">🌤️</td>
              <td style="padding-left:20px;">
                <h3 style="margin:0;font-size:18px;color:#1e40af;font-weight:900;">PIET — Jouw Dagelijkse Gids</h3>
                <p style="margin:8px 0 0;font-size:14px;color:#3b82f6;line-height:1.6;font-weight:500;">Elke ochtend om 08:30 analyseert Piet de data voor ${city || "jouw stad"}. Hij vertelt je precies wat de dag brengt, inclusief een uniek feitje over je buurt. Rustig, slim en altijd raak.</p>
              </td>
            </tr>
          </table>
        </div>

        <div style="background:#fef2f2;border-radius:24px;padding:30px;border:2px solid #fee2e2;">
          <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
            <tr>
              <td style="font-size:48px;width:60px;">🚨</td>
              <td style="padding-left:20px;">
                <h3 style="margin:0;font-size:18px;color:#991b1b;font-weight:900;">REED — De Interceptor</h3>
                <p style="margin:8px 0 0;font-size:14px;color:#ef4444;line-height:1.6;font-weight:500;">Reed slaapt nooit. Zodra er onweer, storm, hitte of ijzel op je coördinaten afkomt, grijpt hij in. Hij waarschuwt je vóór de bliksem inslaat.</p>
              </td>
            </tr>
          </table>
        </div>
      </div>

      <!-- CALL TO ACTION -->
      <div style="margin-top:40px;">
        <p style="font-size:16px;color:#1e293b;font-weight:800;margin-bottom:24px;">WE GAAN KNALLEN! ZIE JE DE DATA AL?</p>
        <a href="https://weerzone.nl" style="display:inline-block;padding:22px 60px;background:#f59e0b;color:#1e293b;font-weight:900;font-size:18px;border-radius:100px;text-decoration:none;text-transform:uppercase;box-shadow:0 10px 40px rgba(245,158,11,0.4);">
          GA NAAR DE WEBSITE →
        </a>
      </div>
    </div>

    <!-- SHARE / VIRAL -->
    <div style="background:#fffbeb;padding:32px;text-align:center;border-top:1px solid #fef3c7;">
      <p style="margin:0 0 16px;font-size:15px;color:#92400e;font-weight:800;">NIET DE ENIGE ZIJN MET DEZE DATA? 🚀</p>
      <p style="margin:0 0 24px;font-size:13px;color:#b45309;line-height:1.5;">Deel WEERZONE met je vrienden, familie of collega's zodat zij ook nooit meer in de kou staan.</p>
      <a href="https://api.whatsapp.com/send?text=Check%20WEERZONE.nl%20%E2%80%94%20eindelijk%20weer-data%20die%20wel%20klopt.%20Piet%20en%20Reed%20houden%20je%20scherp.%20%F0%9F%8C%A4%EF%B8%8F%F0%9F%9A%80" style="display:inline-block;padding:14px 30px;background:#25d366;color:white;font-weight:800;font-size:13px;border-radius:12px;text-decoration:none;text-transform:uppercase;box-shadow:0 4px 15px rgba(37,211,102,0.3);">
        DEEL VIA WHATSAPP →
      </a>
    </div>

    <div style="padding:40px;background:#f8fafc;text-align:center;border-top:1px solid #f1f5f9;">
      <p style="margin:0;font-size:14px;color:#1e293b;font-weight:900;text-transform:uppercase;letter-spacing:1px;">48 uur vooruit. De rest is ruis.</p>
      <p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">Houd je inbox in de gaten. Vanaf nu ben jij de insider.</p>
    </div>
  </div>
</body>
</html>`;

        await resend.emails.send({
          from: fromAddress,
          to: email,
          subject: "BOEM! 🚀 Je bent nu officieel de baas over het weer bij WEERZONE!",
          html: welcomeHtml,
        });
      } catch (err: any) {
        console.error("Welcome email failed:", err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: "Server error", details: e.message }, { status: 500 });
  }
}
