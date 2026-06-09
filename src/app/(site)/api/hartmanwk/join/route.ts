import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  HARTMANWK_MEMBERS_TABLE,
  MAX_PHOTO_LENGTH,
  classifyContact,
  cleanName,
  isFullName,
  toOwnMember,
  toPublicMember,
} from "@/lib/hartmanwk";
import { notifyHartmanWkOwner } from "@/lib/hartmanwk-notify";

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MEMBER_COLUMNS = "id, contact, contact_type, name, photo, joined_at";

/**
 * Hartman WK 2026 Poule — aanmelden / lid worden.
 * Upsert op genormaliseerd contact, dus opnieuw inloggen = dezelfde deelnemer
 * (nooit dubbel). Geeft de eigen deelnemer + de volledige gedeelde lijst terug.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Ongeldig verzoek." }, { status: 400 });
  }

  const name = cleanName(String((body as Record<string, unknown>).name ?? ""));
  const rawContact = String((body as Record<string, unknown>).contact ?? "");
  const rawPhoto = (body as Record<string, unknown>).photo;
  const photo = typeof rawPhoto === "string" && rawPhoto.length > 0 ? rawPhoto : null;

  if (!isFullName(name)) {
    return NextResponse.json({ error: "Vul je voor- en achternaam in." }, { status: 400 });
  }

  const classified = classifyContact(rawContact);
  if (!classified) {
    return NextResponse.json(
      { error: "Gebruik een geldig e-mailadres of telefoonnummer." },
      { status: 400 },
    );
  }

  if (photo && photo.length > MAX_PHOTO_LENGTH) {
    return NextResponse.json({ error: "De profielfoto is te groot." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Was dit contact al bekend? Zo niet, dan is dit een nieuwe deelnemer.
  const { data: existing } = await admin
    .from(HARTMANWK_MEMBERS_TABLE)
    .select("id")
    .eq("contact", classified.contact)
    .maybeSingle();

  const payload: Record<string, string> = {
    contact: classified.contact,
    contact_type: classified.type,
    name,
    updated_at: new Date().toISOString(),
  };
  // Alleen overschrijven als er een nieuwe foto is meegestuurd.
  if (photo) payload.photo = photo;

  const { data: member, error } = await admin
    .from(HARTMANWK_MEMBERS_TABLE)
    .upsert(payload, { onConflict: "contact" })
    .select(MEMBER_COLUMNS)
    .single();

  if (error || !member) {
    console.error("Hartman WK join error:", error?.message);
    return NextResponse.json({ error: "Kon je niet aanmelden. Probeer het opnieuw." }, { status: 500 });
  }

  const { data: members, error: membersError } = await admin
    .from(HARTMANWK_MEMBERS_TABLE)
    .select(MEMBER_COLUMNS)
    .order("joined_at", { ascending: true });

  if (membersError) {
    console.error("Hartman WK members read error:", membersError.message);
  }

  // Eigenaar een seintje bij een nieuwe deelnemer (niet bij opnieuw inloggen).
  if (!existing) {
    await notifyHartmanWkOwner(
      `Nieuwe deelnemer: ${name}`,
      `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
        <p><strong>${escapeHtml(name)}</strong> heeft zich zojuist aangemeld voor de Hartman WK 2026 poule.</p>
        <p style="color:#475569">Contact: ${escapeHtml(classified.contact)}</p>
        <p>Totaal deelnemers: ${(members ?? []).length}</p>
        <p><a href="https://weerzone.nl/hartmanwk2026">Bekijk de poule</a></p>
      </div>`,
    );
  }

  return NextResponse.json({
    member: toOwnMember(member),
    members: (members ?? []).map(toPublicMember),
  });
}
