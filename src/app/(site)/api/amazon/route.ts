// Amazon-zoekendpoint is verwijderd in v2 (agent-first relaunch). Weerzone
// heeft geen affiliate/marketplace integraties meer in de actieve front-end.
export async function GET() {
  return new Response(null, { status: 410, statusText: "Gone" });
}

export async function POST() {
  return new Response(null, { status: 410, statusText: "Gone" });
}
