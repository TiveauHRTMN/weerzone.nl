import { NextResponse } from "next/server";

import { sanitizeNextPath } from "@/lib/supabase/next-path";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const destination = sanitizeNextPath(requestUrl.searchParams.get("next"));
  const supabase = await createSupabaseServerClient();

  if (supabase && code) await supabase.auth.exchangeCodeForSession(code);

  return NextResponse.redirect(new URL(destination, requestUrl.origin));
}
