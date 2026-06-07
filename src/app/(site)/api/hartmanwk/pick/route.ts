import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { HARTMANWK_MEMBERS_TABLE, cleanPlayerName, isLocked } from "@/lib/hartmanwk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Sla de gekozen sterspeler (vrije tekst) van een deelnemer op. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Ongeldig verzoek." }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const memberId = String(b.memberId ?? "");
  const contact = String(b.contact ?? "").trim().toLowerCase();
  const player = cleanPlayerName(String(b.player ?? ""));

  if (isLocked()) {
    return NextResponse.json({ error: "De groepsfase is op slot." }, { status: 423 });
  }
  if (player.length < 2) {
    return NextResponse.json({ error: "Vul de naam van je sterspeler in." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from(HARTMANWK_MEMBERS_TABLE)
    .update({ player_pick: player, updated_at: new Date().toISOString() })
    .eq("id", memberId)
    .eq("contact", contact)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Hartman WK pick save error:", error.message);
    return NextResponse.json({ error: "Opslaan mislukt." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Niet herkend." }, { status: 403 });
  }

  return NextResponse.json({ ok: true, player });
}
