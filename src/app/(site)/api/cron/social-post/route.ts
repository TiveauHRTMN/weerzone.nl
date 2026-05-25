// Social affiliate posting is verwijderd in v2 (agent-first relaunch).
export async function GET() {
  return new Response(null, { status: 410, statusText: "Gone" });
}
