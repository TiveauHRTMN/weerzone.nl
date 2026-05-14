import WkLoginClient from "./WkLoginClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureHartmanWkPouleMembership } from "@/lib/poule";

export default async function WkLoginPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    await ensureHartmanWkPouleMembership(user.id, {
      email: user.email,
      fullName: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null,
    });
  }

  return (
    <WkLoginClient
      signedInEmail={user?.email ?? null}
      signedInName={typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null}
    />
  );
}
