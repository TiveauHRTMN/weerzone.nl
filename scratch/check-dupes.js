const fs = require('fs');
const path = require('path');

const placesPath = path.join(process.cwd(), 'src/lib/places.json');

function placeSlug(name) {
  return name.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "en")
    .replace(/[^a-z0-9\-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

try {
  const ALL_PLACES = JSON.parse(fs.readFileSync(placesPath, 'utf8'));
  console.log("Total entries in places.json:", ALL_PLACES.length);

  const seenKeys = new Map(); // key -> [names]
  const duplicates = [];

  for (const place of ALL_PLACES) {
    const slug = placeSlug(place.name);
    const key = `${place.province}/${slug}`;

    if (seenKeys.has(key)) {
      seenKeys.get(key).push(place.name);
      duplicates.push({ key, name: place.name });
    } else {
      seenKeys.set(key, [place.name]);
    }
  }

  if (duplicates.length > 0) {
    console.log(`❌ Found ${duplicates.length} slug collisions:`);
    duplicates.forEach(d => {
      console.log(`  - ${d.key} (from names: ${seenKeys.get(d.key).join(', ')})`);
    });
  } else {
    console.log("✅ No slug collisions found. URLs are unique.");
  }

} catch (error) {
  console.error("Error checking duplicates:", error);
}
