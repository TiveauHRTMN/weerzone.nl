import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { serverEnvironment } from "@/config/env";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, anonymousKey } = serverEnvironment.supabase;

  if (!url || !anonymousKey) return null;

  return createServerClient(url, anonymousKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components can read cookies but cannot mutate them. The
          // proxy refreshes the session for requests that need it.
        }
      },
    },
  });
}

