import "server-only";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "./server";

export async function requireAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/auth");

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/auth");

  return { supabase, user: data.user };
}

