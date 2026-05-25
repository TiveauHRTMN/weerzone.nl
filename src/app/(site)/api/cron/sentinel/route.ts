// Oude sentinel-mailflow met productlinks is verwijderd in v2.
// Reed verzorgt waarschuwingen zonder affiliate- of advertentielaag.
export async function GET() {
  return new Response(null, { status: 410, statusText: "Gone" });
}
