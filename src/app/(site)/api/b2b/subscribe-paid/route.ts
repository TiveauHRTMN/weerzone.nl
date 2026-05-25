// Beta: geen betaalde zakelijke subscriptions in de actieve flow.
export async function POST() {
  return new Response(null, { status: 410, statusText: "Gone" });
}
