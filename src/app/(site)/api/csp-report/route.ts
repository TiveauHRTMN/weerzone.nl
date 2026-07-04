import { NextResponse } from "next/server";

// Vangt CSP-violation reports op zolang de policy in next.config.ts op
// Report-Only staat. Zonder deze endpoint verdwijnen violations spoorloos
// (geen report-uri/report-to elders in de codebase) — dan is er nooit data
// om op te enforcen. Logt naar Vercel function logs, geen eigen opslag.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const reports = Array.isArray(body) ? body : [body];
  for (const report of reports) {
    const detail =
      report && typeof report === "object" && "csp-report" in report
        ? (report as { "csp-report": unknown })["csp-report"]
        : report;
    console.warn("[csp-report]", JSON.stringify(detail));
  }

  return new NextResponse(null, { status: 204 });
}
