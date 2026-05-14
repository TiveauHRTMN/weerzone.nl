import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PERSONAS, PERSONA_ORDER, type PersonaTier } from "@/lib/personas";
import CheckoutClient from "./CheckoutClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Bevestig je aanmelding",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ plan: string }>;
}) {
  const { plan } = await params;
  if (!PERSONA_ORDER.includes(plan as PersonaTier)) notFound();
  const tier = plan as PersonaTier;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/app/signup?tier=${tier}`);

  const { data: profile } = await supabase
    .from("user_profile")
    .select("full_name, postcode")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <Suspense fallback={null}>
      <CheckoutClient
        persona={PERSONAS[tier]}
        email={user.email ?? ""}
        initialName={(user.user_metadata?.full_name as string) ?? profile?.full_name ?? ""}
        initialPostcode={profile?.postcode ?? ""}
      />
    </Suspense>
  );
}
