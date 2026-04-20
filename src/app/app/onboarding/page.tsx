import { redirect } from "next/navigation";

export const metadata = {
  title: "Aanmelden",
  robots: { index: false, follow: false },
};

/**
 * Oude magic-link onboarding is vervangen door /app/signup (wachtwoord + Google).
 * We forwarden eventuele ?tier= zodat oude links blijven werken.
 */
export default async function OnboardingRedirect({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string }>;
}) {
  const params = await searchParams;
  const tier = params?.tier;
  redirect(tier ? `/app/signup?tier=${encodeURIComponent(tier)}` : "/app/signup");
}
