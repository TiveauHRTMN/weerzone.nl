"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";

import { serverEnvironment } from "@/config/env";
import { sanitizeNextPath } from "@/lib/supabase/next-path";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  anonymizeRateLimitKey,
  checkRateLimit,
  clientAddress,
} from "@/lib/security/rate-limit";

const emailSchema = z.object({
  email: z.email("Vul een geldig e-mailadres in.").trim(),
});

export type AuthActionState = { message?: string; error?: string } | undefined;
const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1_000;

function callbackUrl(next: string): string {
  return `${serverEnvironment.appUrl}/auth/callback?next=${encodeURIComponent(next)}`;
}

export async function signInWithMagicLink(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = emailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const requestHeaders = await headers();
  const rateLimit = checkRateLimit({
    bucket: "auth:magic-link",
    key: anonymizeRateLimitKey(
      `${clientAddress(requestHeaders)}:${parsed.data.email.toLowerCase()}`,
    ),
    limit: 5,
    windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  });
  if (!rateLimit.allowed) {
    return {
      error: "Er zijn te veel inlogpogingen. Probeer het over een kwartier opnieuw.",
    };
  }

  const next = sanitizeNextPath(formData.get("next"));
  const supabase = await createSupabaseServerClient();
  if (!supabase || !serverEnvironment.supabase.url) {
    return { error: "Inloggen is lokaal nog niet geconfigureerd." };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: callbackUrl(next) },
  });

  return error
    ? { error: "De inloglink kon niet worden verstuurd. Probeer het opnieuw." }
    : { message: "Check je inbox voor de veilige inloglink." };
}

export async function signInWithGoogle(formData: FormData) {
  const requestHeaders = await headers();
  const rateLimit = checkRateLimit({
    bucket: "auth:oauth",
    key: anonymizeRateLimitKey(clientAddress(requestHeaders)),
    limit: 20,
    windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  });
  if (!rateLimit.allowed) redirect("/auth?error=rate-limit");

  const next = sanitizeNextPath(formData.get("next"));
  const supabase = await createSupabaseServerClient();
  if (!supabase || !serverEnvironment.supabase.url) redirect("/auth?error=config");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl(next) },
  });

  if (error || !data.url) redirect("/auth?error=oauth");
  redirect(data.url);
}
