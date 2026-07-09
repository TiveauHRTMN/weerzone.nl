import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { AGENT_SUBSCRIPTIONS_TABLE } from "@/lib/agents/subscriptions";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function page(title: string, body: string): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:#f1f5f9;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="max-width:480px;margin:64px auto;background:#fff;border:1px solid #e2e8f0;border-radius:24px;padding:40px 32px;text-align:center;">
<h1 style="margin:0 0 12px;font-size:22px;color:#1e293b;">${title}</h1>
<p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">${body}</p>
<a href="https://weerzone.nl/vandaag" style="display:inline-block;background:#3b7ff0;color:#fff;padding:14px 32px;border-radius:100px;text-decoration:none;font-weight:800;font-size:14px;">Naar het weer van vandaag</a>
</div></body></html>`,
    { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

/**
 * Eén-klik uitschrijven per abonnement, rechtstreeks uit de mail. Het
 * abonnement-id (uuid) fungeert als capability-token — zelfde patroon als
 * manage_token op de oude subscribers-tabel. Idempotent.
 */
export async function GET(request: NextRequest) {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!UUID_RE.test(id)) {
    return page("Deze link klopt niet helemaal", "Gebruik de uitschrijflink onderaan de mail van Piet, of pas je voorkeuren aan via Mijn Weerzone.");
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from(AGENT_SUBSCRIPTIONS_TABLE)
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("id", id)
    .select("place_slug")
    .maybeSingle();

  if (error) {
    console.error("[agents/unsubscribe] mislukt:", error.message);
    return page("Dat lukte even niet", "Probeer het later nog eens, of pas je voorkeuren aan via Mijn Weerzone.");
  }
  if (!data) {
    return page("Al geregeld", "Dit abonnement bestaat niet meer. Je ontvangt deze berichten niet meer.");
  }

  return page("Je bent uitgeschreven", "Piets ochtendbericht voor deze plaats komt niet meer in je mail. Aanzetten kan altijd weer via de plaatspagina.");
}
