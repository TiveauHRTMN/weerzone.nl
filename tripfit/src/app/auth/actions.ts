"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { serverEnvironment } from "@/config/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const emailSchema = z.object({
  email: z.email("Vul een geldig e-mailadres in.").trim(),
});

export type AuthActionState = { message?: string; error?: string } | undefined;

export async function signInWithMagicLink(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = emailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createSupabaseServerClient();
  if (!supabase || !serverEnvironment.supabase.url) {
    return { error: "Inloggen is lokaal nog niet geconfigureerd." };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: `${serverEnvironment.appUrl}/auth/callback` },
  });

  return error
    ? { error: "De inloglink kon niet worden verstuurd. Probeer het opnieuw." }
    : { message: "Check je inbox voor de veilige inloglink." };
}

export async function signInWithGoogle() {
  const supabase = await createSupabaseServerClient();
  if (!supabase || !serverEnvironment.supabase.url) redirect("/auth?error=config");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${serverEnvironment.appUrl}/auth/callback` },
  });

  if (error || !data.url) redirect("/auth?error=oauth");
  redirect(data.url);
}
