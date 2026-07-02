import { NextResponse } from "next/server";
import { isStudioSlot } from "@/lib/mariana/studio/slots";

/**
 * Proxy voor een Studio-slide PNG onder weerzone.nl i.p.v. de rauwe Supabase-
 * subdomain-URL. TikTok's PULL_FROM_URL media-transfer vereist een bron-domein
 * dat geverifieerd is bij Buffer's TikTok-app; weerzone.nl is dat (een oudere
 * Buffer-pipeline postte hiervandaan al succesvol), *.supabase.co niet.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? "";
  const slot = searchParams.get("slot") ?? "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "Ongeldige datum" }, { status: 400 });
  if (!isStudioSlot(slot)) return NextResponse.json({ error: "Onbekend slot" }, { status: 400 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return NextResponse.json({ error: "Supabase niet geconfigureerd" }, { status: 500 });

  const upstream = await fetch(`${supabaseUrl}/storage/v1/object/public/studio-posts/${date}/${slot}.png`, {
    cache: "no-store",
  });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Afbeelding niet gevonden" }, { status: 404 });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=300",
    },
  });
}
