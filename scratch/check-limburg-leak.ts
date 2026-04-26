import fs from 'fs';
import path from 'path';

const places = JSON.parse(fs.readFileSync('src/lib/places.json', 'utf8'));

const suspicious = places.filter((p: any) => {
  if (p.province === 'noord-brabant') {
    // Limburg places often have lon > 5.7 and are in the south-east
    // Midden-Limburg/Noord-Limburg overlap with NB on latitude but are east of it.
    // Let's check some known Limburg towns that might be misclassified.
    const limburgTowns = [
      'Buggenum', 'Haelen', 'Heythuysen', 'Roggel', 'Neer', 'Budschop', 
      'Ospel', 'Nederweert', 'Meijel', 'Kessel', 'Baexem', 'Grathem',
      'Heel', 'Beegden', 'Horn', 'Ittervoort', 'Neeritter', 'Hunsel',
      'Ell', 'Kelpen-Oler', 'Stramproy', 'Altweerterheide', 'Tungelroy',
      'Swartbroek', 'Leveroy'
    ];
    if (limburgTowns.includes(p.name)) return true;
  }
  return false;
});

console.log(JSON.stringify(suspicious, null, 2));
