import WkLoginClient from "./WkLoginClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensurePouleMembershipForInvite, WK_POULE_INVITE_CODE, type PouleInviteTarget } from "@/lib/poule";

type PageProps = {
  searchParams?: Promise<{
    inviteCode?: string;
    code?: string;
    groupId?: string;
    poolId?: string;
  }>;
};

export default async function WkLoginPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const inviteTarget: PouleInviteTarget = {
    inviteCode: (sp.inviteCode || sp.code || WK_POULE_INVITE_CODE).trim(),
    groupId: (sp.groupId || sp.poolId || "").trim() || null,
  };
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    await ensurePouleMembershipForInvite(user.id, inviteTarget, {
      email: user.email,
      fullName: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null,
    });
  }

  return (
    <WkLoginClient
      signedInEmail={user?.email ?? null}
      signedInName={typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null}
      inviteCode={inviteTarget.inviteCode}
      groupId={inviteTarget.groupId}
    />
  );
}
