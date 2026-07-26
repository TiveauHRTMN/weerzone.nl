"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requirePrismaClient } from "@/db/client";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";

const settingsSchema = z.object({
  tripId: z.string().min(1),
  title: z.string().trim().min(1).max(120),
  accommodationLabel: z.string().trim().max(160),
});

export async function updateTripSettings(formData: FormData) {
  const { user } = await requireAuthenticatedUser();
  const parsed = settingsSchema.safeParse({
    tripId: formData.get("tripId"),
    title: formData.get("title"),
    accommodationLabel: formData.get("accommodationLabel"),
  });
  if (!parsed.success) redirect("/dashboard");

  const prisma = requirePrismaClient();
  const result = await prisma.trip.updateMany({
    where: { id: parsed.data.tripId, userId: user.id },
    data: { title: parsed.data.title },
  });
  if (result.count !== 1) redirect("/dashboard");

  await prisma.tripStop.updateMany({
    where: { tripId: parsed.data.tripId, trip: { userId: user.id } },
    data: {
      accommodationLabel: parsed.data.accommodationLabel || null,
    },
  });

  revalidatePath(`/trips/${parsed.data.tripId}`);
  revalidatePath(`/live?trip=${parsed.data.tripId}`);
  redirect(`/trips/${parsed.data.tripId}?saved=settings`);
}
