import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return new NextResponse("Geen e-mailadres opgegeven.", { status: 400 });
  }

  const supabase = getSupabase();
  if (supabase) {
    await supabase
      .from("subscribers")
      .update({ active: false })
      .eq("email", decodeURIComponent(email));
  }

  return new NextResponse(
    `<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8"><title>Uitgeschreven</title></head>
    <body style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui;background:#4a9ee8;color:white;text-align:center;">
      <div><h1>✅ Uitgeschreven</h1><p>Je ontvangt geen WEERZONE e-mails meer.</p><a href="https://weerzone.nl" style="color:#f59e0b;">Terug naar WEERZONE</a></div>
    </body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
