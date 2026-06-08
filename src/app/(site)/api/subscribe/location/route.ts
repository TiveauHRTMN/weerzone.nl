import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const token = (await cookies()).get("wz_sub")?.value;
  if (!token) return NextResponse.json({ ok: false, reason: "no-cookie" });
  const { lat, lon } = await req.json().catch(() => ({}));
  if (typeof lat !== "number" || typeof lon !== "number") {
    return NextResponse.json({ ok: false, reason: "bad-coords" }, { status: 400 });
  }
  const supabase = createSupabaseAdminClient();
  const { count } = await supabase
    .from("subscribers")
    .update({ lat, lon, gps_updated_at: new Date().toISOString() }, { count: "exact" })
    .eq("manage_token", token);
  return NextResponse.json({ ok: (count ?? 0) > 0 });
}
