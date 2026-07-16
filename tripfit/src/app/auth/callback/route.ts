import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const destination = next?.startsWith("/") ? next : "/dashboard";
  const supabase = await createSupabaseServerClient();

  if (supabase && code) await supabase.auth.exchangeCodeForSession(code);

  return NextResponse.redirect(new URL(destination, requestUrl.origin));
}
