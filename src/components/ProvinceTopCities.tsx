import Link from "next/link";
import { type Place, placeSlug, ALL_PLACES, PROVINCE_LABELS, type Province } from "@/lib/places-data";

interface Props {
  province: string;
  currentCity: string;
}

const TOP_CITIES_GLOBAL = [
  "Amsterdam", "Rotterdam", "Utrecht", "Den Haag", "Eindhoven", 
  "Groningen", "Tilburg", "Almere", "Breda", "Nijmegen", 
  "Apeldoorn", "Enschede", "Haarlem", "Arnhem", "Amersfoort", 
  "Zwolle", "Zoetermeer", "Leiden", "Dordrecht", "'s-Hertogenbosch"
];

export default function ProvinceTopCities({ province, currentCity }: Props) {
  // Vind de belangrijkste steden in DEZE provincie
  const provinceTop = ALL_PLACES
    .filter(p => p.province === province && p.name !== currentCity)
    // We geven prioriteit aan steden die in de TOP_CITIES_GLOBAL lijst staan
    .sort((a, b) => {
      const aIsTop = TOP_CITIES_GLOBAL.includes(a.name) ? 1 : 0;
      const bIsTop = TOP_CITIES_GLOBAL.includes(b.name) ? 1 : 0;
      return bIsTop - aIsTop;
    })
    .slice(0, 10);

  if (provinceTop.length === 0) return null;

  const provLabel = PROVINCE_LABELS[province as Province] || province;

  return (
    <nav className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pb-8" aria-label={`Belangrijke plaatsen in ${provLabel}`}>
      <h2 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] mb-4">
        Belangrijk in {provLabel}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {provinceTop.map((p) => (
          <Link
            key={p.name}
            href={`/weer/${p.province}/${placeSlug(p.name)}`}
            className="group flex flex-col p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all"
          >
            <span className="text-xs font-bold text-white/80 group-hover:text-white transition-colors">
              Weer {p.name}
            </span>
            <span className="text-[10px] text-white/30 uppercase tracking-tighter">
              48-uurs precisie
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
