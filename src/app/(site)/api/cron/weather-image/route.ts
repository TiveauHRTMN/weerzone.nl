// Oude weather-image email met productlinks is verwijderd in v2.
export async function GET() {
  return new Response(null, { status: 410, statusText: "Gone" });
}
