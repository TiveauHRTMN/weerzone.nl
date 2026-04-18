import { NextResponse } from "next/server";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const to = searchParams.get("to");

  // Diagnostiek: toon ALLE relevante env vars (gemaskeerd)
  const envCheck = {
    RESEND_API_KEY: process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.slice(0, 8)}...${process.env.RESEND_API_KEY.slice(-4)}` : "NIET GEVONDEN",
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? "✅ ingesteld" : "❌ niet gevonden",
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ ingesteld" : "❌ niet gevonden",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ ingesteld" : "❌ niet gevonden",
    CRON_SECRET: process.env.CRON_SECRET ? "✅ ingesteld" : "❌ niet gevonden",
    NODE_ENV: process.env.NODE_ENV,
    // Check veelvoorkomende typos
    Resend_Api_Key: process.env.Resend_Api_Key ? "⚠️ FOUT: hoofdletters kloppen niet!" : undefined,
    resend_api_key: process.env.resend_api_key ? "⚠️ FOUT: moet RESEND_API_KEY zijn" : undefined,
    RESEND_KEY: process.env.RESEND_KEY ? "⚠️ FOUT: moet RESEND_API_KEY zijn" : undefined,
  };

  // Filter undefined values
  const cleanEnv = Object.fromEntries(Object.entries(envCheck).filter(([, v]) => v !== undefined));

  if (!to) {
    return NextResponse.json({
      usage: "/api/test-email?to=je@email.nl",
      env_status: cleanEnv,
    });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      error: "RESEND_API_KEY niet gevonden",
      env_status: cleanEnv,
      fix: "Vercel → Settings → Environment Variables → maak RESEND_API_KEY aan (exact deze naam, alles hoofdletters)",
    }, { status: 500 });
  }

  const resend = new Resend(apiKey);

  // Stap 1: probeer met eigen domein
  try {
    const { data, error } = await resend.emails.send({
      from: "WEERZONE <info@weerzone.nl>",
      to,
      subject: "WEERZONE Test — Resend werkt! ✅",
      html: `<div style="font-family:system-ui;padding:40px;max-width:480px;margin:0 auto;background:#4a9ee8;border-radius:18px;">
        <div style="background:white;border-radius:18px;padding:32px;text-align:center;">
          <h1 style="color:#1e293b;margin:0 0 16px;">✅ Resend werkt!</h1>
          <p style="color:#475569;">Verstuurd via <strong>info@weerzone.nl</strong></p>
          <p style="color:#94a3b8;font-size:12px;">${new Date().toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam" })}</p>
        </div>
      </div>`,
    });

    if (error) {
      // Domein niet verified — fallback
      if (error.message?.includes("not verified") || error.message?.includes("domain") || error.message?.includes("not found")) {
        const fallback = await resend.emails.send({
          from: "WEERZONE <onboarding@resend.dev>",
          to,
          subject: "WEERZONE Test (via resend.dev) ⚠️",
          html: `<div style="font-family:system-ui;padding:40px;max-width:480px;margin:0 auto;background:#4a9ee8;border-radius:18px;">
            <div style="background:white;border-radius:18px;padding:32px;text-align:center;">
              <h2 style="color:#f59e0b;">⚠️ Domein niet geverifieerd</h2>
              <p>Email verstuurd via <code>resend.dev</code> omdat <code>weerzone.nl</code> niet geverifieerd is.</p>
              <p><strong>Fix:</strong></p>
              <ol style="text-align:left;color:#475569;">
                <li>Ga naar <a href="https://resend.com/domains">resend.com/domains</a></li>
                <li>Klik "Add Domain" → voer <code>weerzone.nl</code> in</li>
                <li>Voeg de DNS records toe (DKIM, SPF)</li>
                <li>Wacht 5-30 min op verificatie</li>
              </ol>
            </div>
          </div>`,
        });

        return NextResponse.json({
          warning: "weerzone.nl niet geverifieerd — email via resend.dev verstuurd",
          fallback_sent: !fallback.error,
          fallback_id: fallback.data?.id,
          fallback_error: fallback.error?.message,
          original_error: error.message,
        });
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Email verstuurd naar ${to}`, id: data?.id });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
