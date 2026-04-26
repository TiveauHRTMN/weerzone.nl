import { createClient } from "@supabase/supabase-js";

async function setTestLocation() {
  const url = "https://bhguergqkyiejyxsiwdu.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZ3Vlcmdxa3lpZWp5eHNpd2R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk4OTk4NywiZXhwIjoyMDkxNTY1OTg3fQ.tpPoBfdMvTqnoFNbSn4zju5393kmKtpnqyIX-dCAT0U"; // service_role
  
  const supabase = createClient(url, key);
  
  const userId = "73d0fe64-3c94-477d-b950-87c901a69152"; // info@weerzone.nl
  const email = "info@weerzone.nl";
  
  // We zetten de locatie op Vlissingen (boulevard) voor een mooie test met wind/zee context
  const testLoc = {
    label: "Vlissingen (Boulevard)",
    lat: 51.4422,
    lon: 3.5736
  };

  console.log(`Setting test location for ${email}...`);

  // 1. Update user_locations (upsert primary)
  const { error: locError } = await supabase
    .from("user_locations")
    .upsert({
      user_id: userId,
      label: testLoc.label,
      lat: testLoc.lat,
      lon: testLoc.lon,
      is_primary: true
    }, { onConflict: 'user_id, is_primary' });

  if (locError) {
    // Probeer gewone insert als upsert faalt op constraints
    await supabase.from("user_locations").insert({
        user_id: userId,
        label: testLoc.label,
        lat: testLoc.lat,
        lon: testLoc.lon,
        is_primary: true
    });
  }

  // 2. Update profile fallback
  await supabase
    .from("user_profile")
    .update({
      primary_lat: testLoc.lat,
      primary_lon: testLoc.lon
    })
    .eq("id", userId);

  console.log(`✅ Success! info@weerzone.nl is nu gekoppeld aan ${testLoc.label}.`);
  console.log(`Als je nu inlogt op localhost:3000/piet, zou je direct data voor Vlissingen moeten zien.`);
}

setTestLocation();
