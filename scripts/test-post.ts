import { GET } from "../src/app/api/cron/social-post/route";

async function test() {
  console.log("🚀 Starten van de WeerZone Social Media Test...");
  
  // Merk op: we verwachten dat env-vars geladen zijn via de command line (--env-file)
  
  // Fake request object voor de Next.js route
  const req = new Request("http://localhost:3000/api/cron/social-post", {
    headers: {
      "authorization": `Bearer ${process.env.CRON_SECRET || ""}`
    }
  });

  try {
    const response = await GET(req);
    const data = await response.json();
    console.log("\n✅ Resultaat:");
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("\n❌ Fout bij het testen:", e);
  }
}

test();
