import { NextRequest, NextResponse } from "next/server";
import { isFounderEmail } from "@/lib/founders";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await createSupabaseServerClient();
  const {
    data: { user },
  } = await session.auth.getUser();

  if (!user || !isFounderEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const regionSlug = request.nextUrl.searchParams.get("region") ?? "zuidwest-nl";
  const admin = createSupabaseAdminClient();
  const [oracleResult, regionsResult, teslaResult] = await Promise.all([
    admin.from("mariana_oracle").select("*").order("run_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("mariana_regions").select("*").order("run_at", { ascending: false }).limit(30),
    admin.from("mariana_tesla").select("*").eq("region_slug", regionSlug).order("run_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const error = oracleResult.error ?? regionsResult.error ?? teslaResult.error;
  if (error) {
    console.error("Mariana cascade API read failed", error);
    return NextResponse.json({ error: "Cascade data unavailable" }, { status: 503 });
  }

  return NextResponse.json(
    {
      oracle: oracleResult.data,
      regions: regionsResult.data ?? [],
      tesla: teslaResult.data,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
