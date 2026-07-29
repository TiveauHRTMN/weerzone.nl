"use server";

import { redirect } from "next/navigation";

import { serverEnvironment } from "@/config/env";
import { getPrismaClient } from "@/db/client";
import { dominicanRepublicPack } from "@/domain/countries/packs/dominican-republic";
import type { TripPreviewRequest } from "@/domain/trips/model";
import { parseTripPreviewSearchParams } from "@/domain/trips/preview-request";
import {
  createPrismaTripWriter,
  loadInterestIdByCode,
  saveTripForUser,
} from "@/features/trip-save/save-trip";
import { trackAuthenticatedServerEvent } from "@/features/analytics/server-events";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SaveTripState = { error?: string } | undefined;

export async function saveTripFromPreview(
  _state: SaveTripState,
  formData: FormData,
): Promise<SaveTripState> {
  const rawQuery = formData.get("previewQuery");
  const previewQuery = typeof rawQuery === "string" ? rawQuery : "";

  let request: TripPreviewRequest;
  try {
    request = parseTripPreviewSearchParams(previewQuery);
  } catch {
    return { error: "Deze preview is niet compleet. Ga terug en vul je reis aan." };
  }

  const supabase = await createSupabaseServerClient();
  const user = supabase && serverEnvironment.supabase.url
    ? (await supabase.auth.getUser()).data.user
    : null;
  if (!user) {
    redirect(`/auth?next=${encodeURIComponent(`/preview?${previewQuery}`)}`);
  }

  const prisma = getPrismaClient();
  if (!prisma) {
    return { error: "Opslaan is in deze omgeving nog niet beschikbaar. Probeer het later opnieuw." };
  }

  let tripId: string;
  try {
    const interestIdByCode = await loadInterestIdByCode(prisma);
    const saved = await saveTripForUser(request, {
      pack: dominicanRepublicPack,
      userId: user.id,
      writer: createPrismaTripWriter(prisma),
      interestIdByCode,
    });
    tripId = saved.tripId;
    await trackAuthenticatedServerEvent({
      prisma,
      userId: user.id,
      name: "trip_saved",
      tripId,
      destinationId: request.countryId,
    });
  } catch {
    return { error: "Opslaan is niet gelukt. Probeer het opnieuw." };
  }

  redirect(`/trips/${tripId}`);
}
