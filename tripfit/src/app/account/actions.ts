"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuthenticatedUser } from "@/lib/supabase/auth";

const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
});

export async function updateProfile(formData: FormData) {
  const { supabase } = await requireAuthenticatedUser();
  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName"),
  });
  if (!parsed.success) redirect("/account?error=profile");

  const { error } = await supabase.auth.updateUser({
    data: { display_name: parsed.data.displayName },
  });
  if (error) redirect("/account?error=profile");

  revalidatePath("/account");
  redirect("/account?saved=profile");
}
