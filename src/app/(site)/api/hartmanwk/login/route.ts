import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  HARTMANWK_MEMBERS_TABLE,
  classifyContact,
  toOwnMember,
  toPublicMember,
} from "@/lib/hartmanwk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MEMBER_COLUMNS = "id, contact, contact_type, name, photo, joined_at";

/**
 * Hartman WK 2026 Poule — opnieuw inloggen voor wie al meedoet.
 * Alleen een bekend e-mailadres/telefoonnummer geeft de bestaande deelnemer
 * terug (incl. naam + foto, zodat de browser de sessie volledig herstelt).
 * Maakt nooit een nieuw account aan — dat blijft de taak van /join.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Ongeldig verzoek." }, { status: 400 });
  }

  const classified = classifyContact(String((body as Record<string, unknown>).contact ?? ""));
  if (!classified) {
    return NextResponse.json(
      { error: "Gebruik een geldig e-mailadres of telefoonnummer." },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();

  const { data: member, error } = await admin
    .from(HARTMANWK_MEMBERS_TABLE)
    .select(MEMBER_COLUMNS)
    .eq("contact", classified.contact)
    .maybeSingle();

  if (error) {
    console.error("Hartman WK login error:", error.message);
    return NextResponse.json({ error: "Inloggen lukte even niet. Probeer het opnieuw." }, { status: 500 });
  }

  if (!member) {
    return NextResponse.json(
      { error: "We kennen dit e-mailadres of telefoonnummer nog niet." },
      { status: 404 },
    );
  }

  const { data: members, error: membersError } = await admin
    .from(HARTMANWK_MEMBERS_TABLE)
    .select(MEMBER_COLUMNS)
    .order("joined_at", { ascending: true });

  if (membersError) {
    console.error("Hartman WK members read error:", membersError.message);
  }

  return NextResponse.json({
    member: toOwnMember(member),
    members: (members ?? []).map(toPublicMember),
  });
}
