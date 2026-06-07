import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { Resend } from "resend";
import { getWelcomeEmailHtml } from "@/lib/welcome-email";
import { logAgentAction } from "@/lib/agent-logger";

export async function POST(req: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY || "dummy");
    const { email, city, lat, lon, reed_on, koos_on } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Ongeldig e-mailadres" }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ ok: true, demo: true });

    const hasCoords = typeof lat === "number" && typeof lon === "number";
    const { data: row, error } = await supabase
      .from("subscribers")
      .upsert(
        {
          email: email.toLowerCase().trim(),
          city: city || "Amsterdam",
          lat, lon,
          active: true,
          ...(typeof reed_on === "boolean" ? { reed_on } : {}),
          ...(typeof koos_on === "boolean" ? { koos_on } : {}),
          ...(hasCoords ? { gps_updated_at: new Date().toISOString() } : {}),
        },
        { onConflict: "email" }
      )
      .select("manage_token")
      .single();

    if (error) return NextResponse.json({ error: "Opslaan mislukt" }, { status: 500 });

    // Paperclip logt de overwinning
    const emailDomain = email.split("@")[1];
    await logAgentAction(
      "Paperclip",
      "lead_found",
      `Nieuwe lead binnengehaald uit regio ${city || "NL"} (@${emailDomain}). De goudmijn groeit!`,
      { city, domain: emailDomain }
    );

    if (process.env.RESEND_API_KEY) {
      try {
        const fromAddress = "WEERZONE <info@weerzone.nl>";
        const html = getWelcomeEmailHtml(email, "piet", city);

        await resend.emails.send({
          from: fromAddress,
          to: email,
          subject: "BOEM! 🚀 Je bent nu officieel de baas over het weer bij WEERZONE!",
          html,
        });
      } catch (err: any) {
        console.error("Welcome email failed:", err);
      }
    }

    const res = NextResponse.json({ ok: true });
    if (row?.manage_token) {
      res.cookies.set("wz_sub", row.manage_token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: "Server error", details: e.message }, { status: 500 });
  }
}
