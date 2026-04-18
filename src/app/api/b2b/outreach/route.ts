import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { Resend } from "resend";
import { getB2BSubject, getB2BEmailHtml, type OutreachStage } from "@/lib/b2b-emails";
import type { B2BIndustry } from "@/lib/b2b-emails";
import { fetchWeatherData } from "@/lib/weather";
import { buildSnippet, geocodeCity, shouldSendStage1, type WeatherSnippet } from "@/lib/b2b-relevance";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_PER_RUN = 10; // Rate limit: max 10 emails per cron-call
const FROM_ADDRESS = "Steve | WEERZONE Zakelijk <info@weerzone.nl>";

async function buildContext(city: string | null, industry: B2BIndustry): Promise<WeatherSnippet | null> {
  if (!city) return null;
  const coords = await geocodeCity(city);
  if (!coords) return null;
  try {
    const w = await fetchWeatherData(coords.lat, coords.lon);
    return buildSnippet(w, city, industry);
  } catch {
    return null;
  }
}

function stageFromCount(count: number): OutreachStage {
  if (count >= 2) return 3;
  if (count >= 1) return 2;
  return 1;
}

export async function GET(req: Request) {
  // Auth check — alleen via cron of handmatig met secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "RESEND_API_KEY niet geconfigureerd" }, { status: 500 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase niet geconfigureerd" }, { status: 500 });
  }

  const resend = new Resend(resendKey);

  // Haal leads op die nog niet ge-e-maild zijn of langer dan 7 dagen geleden
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: leads, error } = await supabase
    .from("b2b_leads")
    .select("*")
    .in("status", ["new", "emailed"])
    .or(`last_outreach_at.is.null,last_outreach_at.lt.${sevenDaysAgo}`)
    .lt("outreach_count", 3) // Max 3 outreach pogingen
    .order("created_at", { ascending: true })
    .limit(MAX_PER_RUN);

  if (error) {
    console.error("B2B outreach fetch error:", error);
    return NextResponse.json({ error: "Database fout", details: error.message }, { status: 500 });
  }

  if (!leads?.length) {
    return NextResponse.json({ sent: 0, message: "Geen leads om te e-mailen" });
  }

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const lead of leads) {
    try {
      const industry = lead.industry as B2BIndustry;
      const stage = stageFromCount(lead.outreach_count || 0);
      const snippet = await buildContext(lead.city, industry);

      // Stage 1: alleen sturen als weer relevant is OF lead al 14d oud
      if (stage === 1) {
        const ageDays = lead.created_at
          ? Math.floor((Date.now() - new Date(lead.created_at).getTime()) / 86_400_000)
          : 0;
        if (snippet && !shouldSendStage1(snippet, ageDays)) {
          skipped++;
          continue;
        }
      }

      const subject = getB2BSubject(industry, lead.city, stage, snippet);
      const html = getB2BEmailHtml(industry, lead.business_name, lead.city, snippet, stage);

      const result = await resend.emails.send({
        from: FROM_ADDRESS,
        to: lead.email,
        subject,
        html,
        tags: [
          { name: "industry", value: industry },
          { name: "stage", value: String(stage) },
          { name: "event", value: snippet?.event?.kind || "none" },
        ],
      });

      if (result.error) {
        errors.push(`${lead.email}: ${result.error.message}`);
        continue;
      }

      await supabase
        .from("b2b_leads")
        .update({
          status: "emailed",
          outreach_count: (lead.outreach_count || 0) + 1,
          last_outreach_at: new Date().toISOString(),
        })
        .eq("id", lead.id);

      sent++;
    } catch (e) {
      errors.push(`${lead.email}: ${e}`);
    }
  }

  return NextResponse.json({
    sent,
    skipped,
    total: leads.length,
    errors: errors.slice(0, 5),
  });
}

// POST: handmatig een lead toevoegen en direct e-mailen
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { businessName, email, city, industry } = await req.json();

    if (!businessName || !email || !industry) {
      return NextResponse.json({ error: "businessName, email en industry zijn verplicht" }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Database niet beschikbaar" }, { status: 500 });
    }

    // Lead opslaan
    const { error: insertError } = await supabase
      .from("b2b_leads")
      .upsert(
        {
          business_name: businessName,
          email: email.toLowerCase().trim(),
          city: city || null,
          industry,
          source: "manual",
          status: "new",
        },
        { onConflict: "email" }
      );

    if (insertError) {
      return NextResponse.json({ error: "Lead opslaan mislukt", details: insertError.message }, { status: 500 });
    }

    // Direct e-mailen
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const resend = new Resend(resendKey);
      const typedIndustry = industry as B2BIndustry;
      const snippet = await buildContext(city || null, typedIndustry);
      const subject = getB2BSubject(typedIndustry, city, 1, snippet);
      const html = getB2BEmailHtml(typedIndustry, businessName, city, snippet, 1);

      const result = await resend.emails.send({
        from: FROM_ADDRESS,
        to: email.toLowerCase().trim(),
        subject,
        html,
        tags: [
          { name: "industry", value: typedIndustry },
          { name: "stage", value: "1" },
          { name: "event", value: snippet?.event?.kind || "none" },
          { name: "source", value: "manual" },
        ],
      });

      if (result.error) {
        return NextResponse.json({ ok: true, emailSent: false, reason: result.error.message });
      }

      // Update status
      await supabase
        .from("b2b_leads")
        .update({
          status: "emailed",
          outreach_count: 1,
          last_outreach_at: new Date().toISOString(),
        })
        .eq("email", email.toLowerCase().trim());

      return NextResponse.json({ ok: true, emailSent: true });
    }

    return NextResponse.json({ ok: true, emailSent: false, reason: "Geen RESEND_API_KEY" });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
