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
  budgetLevel: z.enum(["BUDGET", "BALANCED", "PREMIUM"]),
  preferredPace: z.enum(["SLOW", "BALANCED", "ACTIVE"]),
  mobility: z.enum(["STANDARD", "LIMITED"]),
});

export async function updateTripSettings(formData: FormData) {
  const { user } = await requireAuthenticatedUser();
  const parsed = settingsSchema.safeParse({
    tripId: formData.get("tripId"),
    title: formData.get("title"),
    accommodationLabel: formData.get("accommodationLabel"),
    budgetLevel: formData.get("budgetLevel"),
    preferredPace: formData.get("preferredPace"),
    mobility: formData.get("mobility"),
  });
  if (!parsed.success) redirect("/dashboard");

  const prisma = requirePrismaClient();
  const ownedTrip = await prisma.trip.findFirst({
    where: { id: parsed.data.tripId, userId: user.id },
    include: {
      travelers: true,
      interests: { include: { interest: true } },
    },
  });
  if (!ownedTrip) redirect("/dashboard");

  const adults = ownedTrip.travelers.filter(({ kind }) => kind === "ADULT").length;
  const childAges = ownedTrip.travelers
    .filter(({ kind }) => kind === "CHILD")
    .map(({ ageAtDeparture }) => ageAtDeparture ?? 0);
  const travelPartyType = childAges.length > 0
    ? ("FAMILY" as const)
    : adults === 1
      ? ("SOLO" as const)
      : adults === 2
        ? ("COUPLE" as const)
        : ("FRIENDS" as const);
  const interests = ownedTrip.interests
    .sort((left, right) => left.priority - right.priority)
    .map(({ interest }) => interest.code);

  await prisma.$transaction(async (tx) => {
    const result = await tx.trip.updateMany({
      where: { id: parsed.data.tripId, userId: user.id },
      data: { title: parsed.data.title },
    });
    if (result.count !== 1) throw new Error("Trip ownership changed");

    await tx.tripStop.updateMany({
      where: { tripId: parsed.data.tripId, trip: { userId: user.id } },
      data: {
        accommodationLabel: parsed.data.accommodationLabel || null,
      },
    });
    const preferences = {
      travelPartyType,
      adults,
      childAges,
      budgetLevel: parsed.data.budgetLevel,
      interests,
      preferredPace: parsed.data.preferredPace,
      mobility: parsed.data.mobility,
      accommodationArea: parsed.data.accommodationLabel || null,
    };
    await tx.tripPreferenceSnapshot.upsert({
      where: { tripId: parsed.data.tripId },
      create: { tripId: parsed.data.tripId, ...preferences },
      update: preferences,
    });
    await tx.travelerProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        travelPartyType,
        adults,
        childAges,
        budgetLevel: parsed.data.budgetLevel,
        interests,
        preferredPace: parsed.data.preferredPace,
        mobility: parsed.data.mobility,
      },
      update: {
        travelPartyType,
        adults,
        childAges,
        budgetLevel: parsed.data.budgetLevel,
        interests,
        preferredPace: parsed.data.preferredPace,
        mobility: parsed.data.mobility,
      },
    });
  });

  revalidatePath(`/trips/${parsed.data.tripId}`);
  revalidatePath(`/live?trip=${parsed.data.tripId}`);
  redirect(`/trips/${parsed.data.tripId}?saved=settings`);
}
