const fs = require('fs');
const content = fs.readFileSync('src/lib/places-data.ts', 'utf8');
const regex = /{ name: "(.*?)", province: "(.*?)"/g;
const matches = [];
let match;
while ((match = regex.exec(content)) !== null) {
  matches.push(`${match[1]}-${match[2]}`);
}

const seen = new Set();
const duplicates = [];
for (const m of matches) {
  if (seen.has(m)) duplicates.push(m);
  else seen.add(m);
}

console.log("Total entries found:", matches.length);
console.log("Duplicates:", duplicates);
