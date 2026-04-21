import { ALL_PLACES } from './src/lib/places-data';

const names = ALL_PLACES.map(p => `${p.name}-${p.province}`);
const seen = new Set();
const duplicates = [];

for (const name of names) {
  if (seen.has(name)) {
    duplicates.push(name);
  } else {
    seen.add(name);
  }
}

console.log("Total places:", ALL_PLACES.length);
console.log("Duplicates:", duplicates);
