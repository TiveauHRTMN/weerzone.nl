import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#4a9ee8] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full">
        <div className="text-9xl mb-6">🌪️</div>
        <h1 className="text-5xl font-black text-white mb-4 tracking-tighter">404. Weggewaaid.</h1>
        <p className="text-xl text-white/80 mb-8 font-medium italic">
          "Deze pagina bestaat niet. Net als een 14-daagse weersvoorspelling."
        </p>
        <Link 
          href="/" 
          className="inline-block bg-[#ffd60a] text-black font-black px-8 py-4 rounded-full shadow-xl hover:scale-105 transition-transform"
        >
          TERUG NAAR DE REALITEIT
        </Link>
        <p className="mt-8 text-white/40 text-xs uppercase tracking-widest font-bold">
          WEERZONE.NL — 48 UUR. DE REST IS RUIS.
        </p>
      </div>
    </main>
  );
}
