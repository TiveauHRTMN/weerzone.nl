import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { activePushDevices, pushConfigured, sendPushToDevice } from "@/lib/push";

export const dynamic = "force-dynamic";

/**
 * Testnotificatie naar de eigen apparaten (spec 2026-07-10 §3F): bewijs dat
 * de keten werkt zonder op noodweer te wachten. Ingelogd = zelf; met Bearer
 * CRON_SECRET + userId in de body kan de keten ook zonder sessie geverifieerd
 * worden (e2e-pad).
 */
export async function POST(req: Request) {
  if (!pushConfigured()) {
    return NextResponse.json({ error: "Push is niet geconfigureerd" }, { status: 500 });
  }

  let userId: string | null = null;

  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    const body = await req.json().catch(() => ({}));
    if (typeof body.userId === "string") userId = body.userId;
  }
  if (!userId) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Log eerst in" }, { status: 401 });
    userId = user.id;
  }

  const admin = createSupabaseAdminClient();
  const devices = (await activePushDevices(admin, [userId])).get(userId) ?? [];
  if (!devices.length) {
    return NextResponse.json({ sent: 0, devices: 0, reason: "Geen apparaten met meldingen aan" });
  }

  let sent = 0;
  for (const device of devices) {
    const result = await sendPushToDevice(admin, device, {
      title: "Test van je meteo-team",
      body: "Werkt. Zo melden Piet, Reed en Koos zich als het erop aankomt.",
      url: "https://weerzone.nl/vandaag",
      tag: "weerzone-test",
    });
    if (result.ok) sent += 1;
  }
  return NextResponse.json({ sent, devices: devices.length });
}
