import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { HARTMANWK_MEMBERS_TABLE, toPublicMember } from "@/lib/hartmanwk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Hartman WK 2026 Poule — de gedeelde deelnemerslijst.
 * Bewust zonder contactgegevens: alleen naam + foto + volgorde van aanmelden.
 */
export async function GET() {
  const admin = createSupabaseAdminClient();

  const { data: members, error } = await admin
    .from(HARTMANWK_MEMBERS_TABLE)
    .select("id, name, photo, joined_at")
    .order("joined_at", { ascending: true });

  if (error) {
    console.error("Hartman WK members read error:", error.message);
    return NextResponse.json({ error: "Kon de deelnemers niet laden." }, { status: 500 });
  }

  return NextResponse.json({ members: (members ?? []).map(toPublicMember) });
}
