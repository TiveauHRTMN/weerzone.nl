import { NextResponse } from "next/server";
import { trackEvent } from "@/lib/affiliate-orchestrator";
import { ConditionTag } from "@/lib/affiliate-orchestrator";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventType, tag, weatherContext, platform, sessionId } = body as {
      eventType: "IMPRESSION" | "CLICK";
      tag: ConditionTag;
      weatherContext: object;
      platform: "SITE" | "MAIL";
      sessionId?: string;
    };

    await trackEvent(eventType, tag, weatherContext ?? {}, platform ?? "SITE", sessionId);
  } catch {
    // Silently swallow — analytics must never crash
  }

  return NextResponse.json({ ok: true });
}
