import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isFounderEmail } from "@/lib/founders";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!isFounderEmail(user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from('agent_activity')
      .select('*')
      .eq('metadata->>source', 'magnolia_crypto_syndicate')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
