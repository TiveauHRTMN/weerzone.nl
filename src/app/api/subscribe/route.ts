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
        const { data, error } = await resend.emails.send({
          from: "WeerZone <info@weerzone.nl>",
          to: email,
          subject: "Bevestigd: Je Toegang tot WeerZone.",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px 24px; max-width: 600px; margin: 0 auto; background: #4a9ee8; border-radius: 18px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <img src="https://weerzone.nl/logo-full.png" alt="WeerZone" style="height: 50px; width: auto;" />
              </div>
              <div style="background: #ffffff; border-radius: 18px; padding: 32px; box-shadow: 0 8px 32px rgba(0,0,0,0.04);">
                <h2 style="color: #1e293b; margin-top: 0; font-size: 24px;">Aanmelding Voltooid. Tijd Voor De Harde Feiten.</h2>
                <p style="font-size: 16px; line-height: 1.6; color: #475569;">Je alerts voor locatie <strong>${city || "jouw stad"}</strong> staan scherp.</p>
                <p style="font-size: 16px; line-height: 1.6; color: #475569;">Laten we eerlijk zijn: die standaard 14-daagse weersvoorspelling op je telefoon is complete kolder. Het is gewoon nattevingerwerk. Terwijl de rest van de straat argeloos zonder jas de deur uitloopt en wegrekent, krijg jij vanaf nu de ongezouten realiteit. Wij tappen de ruwe weermodellen af (KNMI HARMONIE, ICON en ICON-D2) en filteren het slappe geouwehoer eruit.</p>
                
                <div style="background: #f8fafc; padding: 20px; border-left: 4px solid #4a9ee8; border-radius: 4px; margin: 24px 0;">
                  <h3 style="margin-top: 0; color: #1e293b; font-size: 18px;">Wat wij jou op een serveerblaadje aanleveren:</h3>
                  <ul style="margin-bottom: 0; padding-left: 20px; color: #475569; line-height: 1.6; font-size: 15px;">
                    <li><strong>De 48-Uur Update:</strong> Elke ochtend om 08:00 de keiharde meteorologische realiteit voor jouw stad. Geen weerman-poespas, gewoon weten of het zeikweer wordt.</li>
                    <li><strong>Code Rood Alerts:</strong> Gaat het in jouw postcodegebied compleet los met wolkbreuken, storm of een wegprikkende zon? Dan trekken wij aan de bel met een live waarschuwing.</li>
                  </ul>
                </div>

                <p style="font-size: 16px; line-height: 1.6; color: #475569;">Genoeg gepraat. We zijn de radardata voor jouw locatie al aan het inschieten. Je krijgt morgenochtend stipt om 08:00 je eerste update.</p>
                
                <p style="font-size: 16px; line-height: 1.6; color: #1e293b; font-weight: 600; margin-top: 24px;">Hou het lekker lokaal, en laat de rest maar natregenen.</p>
                
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
                <p style="margin: 0; color: #475569; font-size: 14px;"><strong>WeerZone</strong><br>Geen slap geouwehoer, gewoon de feiten.</p>
              </div>
            </div>
          `,
        });

        if (error) {
          console.error("Resend API rejected the email:", error);
          return NextResponse.json({ error: "Email niet verzonden (Resend error)", details: error.message }, { status: 500 });
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
