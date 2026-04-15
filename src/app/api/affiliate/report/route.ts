import { NextResponse } from "next/server";
import { getWeeklyReport } from "@/lib/affiliate-orchestrator";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const report = await getWeeklyReport();
  return NextResponse.json({ report, generatedAt: new Date().toISOString() });
}
