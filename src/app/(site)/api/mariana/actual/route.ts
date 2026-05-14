import { NextRequest, NextResponse } from "next/server";
import { badMarianaRequest, isMarianaAuthorized, marianaUnauthorized } from "@/lib/mariana/http";
import { logMarianaActual } from "@/lib/mariana/service";
import type { MarianaActualInput } from "@/lib/mariana/types";

export const dynamic = "force-dynamic";

function isActualInput(value: unknown): value is MarianaActualInput {
  const row = value as MarianaActualInput;
  return Boolean(
    row?.location?.locationId &&
    Number.isFinite(row.location.lat) &&
    Number.isFinite(row.location.lon) &&
    row.observedAt &&
    row.variables &&
    typeof row.variables === "object"
  );
}

export async function POST(request: NextRequest) {
  if (!isMarianaAuthorized(request)) return marianaUnauthorized();

  const body = await request.json().catch(() => null);
  if (!isActualInput(body?.actual)) {
    return badMarianaRequest("Expected { actual: MarianaActualInput }");
  }

  const result = await logMarianaActual(body.actual);
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
