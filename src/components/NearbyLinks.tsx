import Link from "next/link";
import type { City } from "@/lib/types";

interface NearbyLinksProps {
  currentCity: string;
  cities: City[];
}

export default function NearbyLinks({ currentCity, cities }: NearbyLinksProps) {
  return (
    <nav className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pb-12" aria-label="Weer in de buurt">
      <h2 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">
        Weer in de buurt van {currentCity}
      </h2>
      <div className="flex flex-wrap gap-2">
        {cities.map((c) => {
          const slug = c.name.toLowerCase().replace(/\s+/g, "-");
          return (
            <Link
              key={c.name}
              href={`/weer/${slug}`}
              className="px-3 py-1.5 text-xs font-semibold text-white/60 bg-white/8 border border-white/15 rounded-full hover:bg-white/15 hover:text-white/90 transition-colors"
            >
              Weer {c.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
