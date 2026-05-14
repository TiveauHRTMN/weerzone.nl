import Link from "next/link";
import { PROVINCE_LABELS, placeSlug } from "@/lib/places-data";

export default function NotFound() {
  const topCities = [
    { name: "Amsterdam", prov: "noord-holland" },
    { name: "Rotterdam", prov: "zuid-holland" },
    { name: "Utrecht", prov: "utrecht" },
    { name: "Den Haag", prov: "zuid-holland" },
    { name: "Eindhoven", prov: "noord-brabant" },
    { name: "Groningen", prov: "groningen" },
  ];

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
      <div className="max-w-2xl w-full">
        <div className="text-8xl mb-6">🌪️</div>
        <h1 className="text-5xl font-black text-white mb-4 tracking-tighter uppercase">404. Weggewaaid.</h1>
        <p className="text-xl text-white/60 mb-12 font-medium italic">
          "Deze pagina bestaat niet. Net als een 14-daagse weersvoorspelling."
        </p>
        
        <div className="grid sm:grid-cols-2 gap-8 text-left mb-12">
          <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
            <h2 className="text-xs font-black uppercase tracking-widest text-accent-orange mb-4">Populaire locaties</h2>
            <div className="grid grid-cols-1 gap-2">
              {topCities.map(city => (
                <Link 
                  key={city.name} 
                  href={`/weer/${city.prov}/${placeSlug(city.name)}`}
                  className="text-sm font-bold text-white/80 hover:text-white transition-colors"
                >
                  Weer {city.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
            <h2 className="text-xs font-black uppercase tracking-widest text-accent-cyan mb-4">Provincies</h2>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PROVINCE_LABELS).map(([id, label]) => (
                <Link 
                  key={id} 
                  href={`/weer/${id}`}
                  className="text-sm font-bold text-white/80 hover:text-white transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <Link 
          href="/" 
          className="inline-block bg-accent-orange text-slate-950 font-black px-10 py-4 rounded-2xl shadow-xl hover:scale-105 transition-transform uppercase tracking-widest text-sm"
        >
          Naar de homepage
        </Link>

        <p className="mt-12 text-white/20 text-[10px] uppercase tracking-[0.3em] font-bold">
          WEERZONE.NL — 48 UUR. DE REST IS RUIS.
        </p>
      </div>
    </main>
  );
}
