import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import OnboardingClient from "./OnboardingClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Jouw instellingen",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <Suspense fallback={null}>
      <OnboardingClient email={user?.email ?? ""} />
    </Suspense>
  );
}
