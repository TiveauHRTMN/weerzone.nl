// Affiliate-tracking is verwijderd in v2 (agent-first relaunch).
export async function POST() {
  return new Response(null, { status: 410, statusText: "Gone" });
}
