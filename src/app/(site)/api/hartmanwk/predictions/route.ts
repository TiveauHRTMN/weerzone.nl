import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  HARTMANWK_MEMBERS_TABLE,
  HARTMANWK_PREDICTIONS_TABLE,
  isGroupMatchId,
  isLocked,
} from "@/lib/hartmanwk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lichte identiteitscheck zonder wachtwoorden: memberId moet bij het opgeslagen
 * contact horen. Contact wordt nooit naar andere browsers gestuurd, dus het
 * tegelijk kennen van id + contact geldt hier als bewijs (familiepoule).
 */
async function verifyMember(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  memberId: string,
  contact: string,
): Promise<boolean> {
  if (!memberId || !contact) return false;
  const { data } = await admin
    .from(HARTMANWK_MEMBERS_TABLE)
    .select("id")
    .eq("id", memberId)
    .eq("contact", contact.trim().toLowerCase())
    .maybeSingle();
  return Boolean(data);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("memberId") ?? "";
  const contact = searchParams.get("contact") ?? "";

  const admin = createSupabaseAdminClient();
  if (!(await verifyMember(admin, memberId, contact))) {
    return NextResponse.json({ error: "Niet herkend." }, { status: 403 });
  }

  const [{ data: predictions }, { data: member }] = await Promise.all([
    admin
      .from(HARTMANWK_PREDICTIONS_TABLE)
      .select("match_id, home, away")
      .eq("member_id", memberId),
    admin.from(HARTMANWK_MEMBERS_TABLE).select("player_pick").eq("id", memberId).maybeSingle(),
  ]);

  return NextResponse.json({
    predictions: predictions ?? [],
    playerPick: member?.player_pick ?? null,
    locked: isLocked(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Ongeldig verzoek." }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const memberId = String(b.memberId ?? "");
  const contact = String(b.contact ?? "");
  const matchId = String(b.matchId ?? "");
  const home = Number(b.home);
  const away = Number(b.away);

  if (isLocked()) {
    return NextResponse.json({ error: "De groepsfase is op slot." }, { status: 423 });
  }
  if (!isGroupMatchId(matchId)) {
    return NextResponse.json({ error: "Geen geldige groepswedstrijd." }, { status: 400 });
  }
  if (![home, away].every((v) => Number.isInteger(v) && v >= 0 && v <= 30)) {
    return NextResponse.json({ error: "Gebruik hele scores van 0 t/m 30." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  if (!(await verifyMember(admin, memberId, contact))) {
    return NextResponse.json({ error: "Niet herkend." }, { status: 403 });
  }

  const { error } = await admin
    .from(HARTMANWK_PREDICTIONS_TABLE)
    .upsert(
      { member_id: memberId, match_id: matchId, home, away, updated_at: new Date().toISOString() },
      { onConflict: "member_id,match_id" },
    );

  if (error) {
    console.error("Hartman WK prediction save error:", error.message);
    return NextResponse.json({ error: "Opslaan mislukt." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
