import "server-only";

/**
 * Server-side PostHog-capture (crons/routes) via het HTTP-endpoint — de
 * client-side trackEvent kan hier niet. Fire-and-forget met vangnet: analytics
 * mag nooit een push tegenhouden.
 */
export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";
  if (!key) return;
  try {
    await fetch(`${host.replace(/\/$/, "")}/capture/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ api_key: key, event, distinct_id: distinctId, properties: properties ?? {} }),
      // Trage PostHog mag de bezorg-lus van de cron niet ophouden.
      signal: AbortSignal.timeout(1500),
    });
  } catch {
    // stil: analytics is bijzaak
  }
}
