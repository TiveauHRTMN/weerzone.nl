import fs from 'fs';

const filePath = 'src/lib/places.json';
const places = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const limburgTowns = [
  'Buggenum', 'Haelen', 'Heythuysen', 'Roggel', 'Neer', 'Budschop', 
  'Ospel', 'Nederweert', 'Meijel', 'Kessel', 'Baexem', 'Grathem',
  'Heel', 'Beegden', 'Horn', 'Ittervoort', 'Neeritter', 'Hunsel',
  'Ell', 'Kelpen-Oler', 'Stramproy', 'Altweerterheide', 'Tungelroy',
  'Swartbroek', 'Leveroy', 'Haelense Broek', 'Overhaelen', 'Roggelsedijk'
];

let fixedCount = 0;
const fixedPlaces = places.map((p: any) => {
  if (p.province === 'noord-brabant' && limburgTowns.includes(p.name)) {
    fixedCount++;
    return { ...p, province: 'limburg' };
  }
  return p;
});

fs.writeFileSync(filePath, JSON.stringify(fixedPlaces, null, 2));
console.log(`Fixed ${fixedCount} places in ${filePath}`);
