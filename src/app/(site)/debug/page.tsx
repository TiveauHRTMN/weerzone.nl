import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DebugPage() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 10) + "..." }));
  
  let user = null;
  let error = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error: err } = await supabase.auth.getUser();
    user = data.user;
    error = err;
  } catch (e: any) {
    error = e.message;
  }

  return (
    <div style={{ padding: 20, fontFamily: 'monospace', background: '#eee' }}>
      <h1>Debug Auth</h1>
      <pre>User: {JSON.stringify(user?.email || "null", null, 2)}</pre>
      <pre>Error: {JSON.stringify(error, null, 2)}</pre>
      <h2>Cookies</h2>
      <pre>{JSON.stringify(allCookies, null, 2)}</pre>
    </div>
  );
}
