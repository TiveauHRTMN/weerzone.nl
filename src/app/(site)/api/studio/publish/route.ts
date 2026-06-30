import { NextResponse } from "next/server";
import { studioAccessOk } from "@/lib/mariana/studio/gate";
import { loadLatestStudioDay } from "@/lib/mariana/studio/storage";
import { getPostedSlots, recordPost, uploadSlidePng } from "@/lib/mariana/studio/posts";
import { postToTikTok } from "@/lib/mariana/studio/buffer";
import { isStudioSlot } from "@/lib/mariana/studio/slots";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!(await studioAccessOk(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const day = await loadLatestStudioDay();
  const forecastDate = day?.forecastDate ?? null;
  const posted = forecastDate ? await getPostedSlots(forecastDate) : {};
  return NextResponse.json({ forecastDate, posted });
}

export async function POST(req: Request) {
  if (!(await studioAccessOk(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { slot?: string; pngDataUrl?: string; caption?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige body" }, { status: 400 });
  }
  const { slot, pngDataUrl, caption } = body;
  if (!slot || !isStudioSlot(slot)) return NextResponse.json({ error: "Onbekend slot" }, { status: 400 });
  if (!pngDataUrl || !pngDataUrl.startsWith("data:image/png;base64,")) return NextResponse.json({ error: "Geen PNG" }, { status: 400 });
  if (!caption || !caption.trim()) return NextResponse.json({ error: "Geen caption" }, { status: 400 });

  const day = await loadLatestStudioDay();
  if (!day) return NextResponse.json({ error: "Geen Studio-dag opgeslagen" }, { status: 409 });
  const forecastDate = day.forecastDate;

  // Lock: al geplaatst vandaag?
  const posted = await getPostedSlots(forecastDate);
  if (posted[slot]) return NextResponse.json({ error: "Al geplaatst", postedAt: posted[slot]!.posted_at }, { status: 409 });

  // Upload PNG → publieke URL
  const imageUrl = await uploadSlidePng(forecastDate, slot, pngDataUrl);
  if (!imageUrl) return NextResponse.json({ error: "Upload mislukt (service-role/bucket?)" }, { status: 500 });

  // Publiceer via Buffer
  const result = await postToTikTok({ imageUrl, caption });
  if (!result.ok) {
    await recordPost({ forecastDate, slot, status: "failed", bufferId: null, imageUrl, caption });
    return NextResponse.json({ error: `Buffer: ${result.error}` }, { status: 502 });
  }

  const rec = await recordPost({ forecastDate, slot, status: "posted", bufferId: result.bufferId, imageUrl, caption });
  if (!rec.ok) {
    // Post is geplaatst maar lock niet geschreven — meld het zodat de UI niet stilletjes dubbelpost.
    return NextResponse.json({ ok: true, postedAt: new Date().toISOString(), warning: "Geplaatst, maar log niet opgeslagen" });
  }
  return NextResponse.json({ ok: true, postedAt: new Date().toISOString() });
}
