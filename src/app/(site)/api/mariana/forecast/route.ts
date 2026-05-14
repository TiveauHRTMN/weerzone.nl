import { NextRequest, NextResponse } from "next/server";
import { badMarianaRequest, isMarianaAuthorized, marianaUnauthorized } from "@/lib/mariana/http";
import { logMarianaForecasts } from "@/lib/mariana/service";
import type { MarianaForecastInput } from "@/lib/mariana/types";

export const dynamic = "force-dynamic";

function isForecastInput(value: unknown): value is MarianaForecastInput {
  const row = value as MarianaForecastInput;
  return Boolean(
    row?.location?.locationId &&
    Number.isFinite(row.location.lat) &&
    Number.isFinite(row.location.lon) &&
    row.modelName &&
    row.forecastTimestamp &&
    row.validAt &&
    Number.isFinite(row.forecastHorizon) &&
    row.variables &&
    typeof row.variables === "object"
  );
}

export async function POST(request: NextRequest) {
  if (!isMarianaAuthorized(request)) return marianaUnauthorized();

  const body = await request.json().catch(() => null);
  const forecasts = Array.isArray(body?.forecasts) ? body.forecasts : [];
  if (!forecasts.length || !forecasts.every(isForecastInput)) {
    return badMarianaRequest("Expected { forecasts: MarianaForecastInput[] }");
  }

  const result = await logMarianaForecasts(forecasts);
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
