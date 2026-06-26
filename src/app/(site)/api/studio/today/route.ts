import { NextResponse } from "next/server";
import { loadLatestStudioDay } from "@/lib/mariana/studio/storage";
import { studioAccessOk } from "@/lib/mariana/studio/gate";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await studioAccessOk(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const day = await loadLatestStudioDay();
  return NextResponse.json({ ok: Boolean(day), day });
}
