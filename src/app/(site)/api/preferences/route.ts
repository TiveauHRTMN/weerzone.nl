import { NextResponse } from "next/server";
import { getSubscriberByToken, updateSubscriberByToken, sanitizePrefPatch } from "@/lib/subscriber-prefs";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "missing token" }, { status: 400 });
  const sub = await getSubscriberByToken(token);
  if (!sub) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(sub);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token : "";
  if (!token) return NextResponse.json({ error: "missing token" }, { status: 400 });
  const patch = sanitizePrefPatch(body);
  const ok = await updateSubscriberByToken(token, patch);
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true, patch });
}
