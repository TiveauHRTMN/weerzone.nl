import { createClient } from "@supabase/supabase-js";

async function setHomeLocation() {
  const url = "https://bhguergqkyiejyxsiwdu.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZ3Vlcmdxa3lpZWp5eHNpd2R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk4OTk4NywiZXhwIjoyMDkxNTY1OTg3fQ.tpPoBfdMvTqnoFNbSn4zju5393kmKtpnqyIX-dCAT0U"; // service_role
  
  const supabase = createClient(url, key);
  
  const userId = "73d0fe64-3c94-477d-b950-87c901a69152"; // info@weerzone.nl
  
  // Coördinaten voor Winkel, NH
  const homeLoc = {
    label: "Winkel",
    lat: 52.7542,
    lon: 4.8917
  };

  console.log(`Setting home location to ${homeLoc.label} for user...`);

  // Update profile fallback
  await supabase
    .from("user_profile")
    .update({
      primary_lat: homeLoc.lat,
      primary_lon: homeLoc.lon
    })
    .eq("id", userId);

  // Upsert primary location in user_locations
  await supabase
    .from("user_locations")
    .upsert({
      user_id: userId,
      label: homeLoc.label,
      lat: homeLoc.lat,
      lon: homeLoc.lon,
      is_primary: true
    }, { onConflict: 'user_id, is_primary' });

  console.log(`✅ Success! Jouw vaste locatie is nu ingesteld op ${homeLoc.label}.`);
}

setHomeLocation();
