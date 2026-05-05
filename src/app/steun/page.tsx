import { Metadata } from "next";
import Link from "next/link";
import SupportForm from "@/components/SupportForm";

export const metadata: Metadata = {
  title: "Laat ons groeien - Steun Weerzone",
  description: "Draag bij aan de groei van Weerzone met een vrijwillige bijdrage.",
};

export default function SteunPage() {
  return (
    <main className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col">
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-blue-900 to-slate-50" />
      
      <div className="relative z-10 flex-1 max-w-2xl mx-auto w-full px-4 py-12 sm:py-20 flex flex-col items-center">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-8 text-white/70 hover:text-white font-bold text-sm tracking-widest uppercase transition-colors">
            ← Terug naar Weerzone
          </Link>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4 drop-shadow-md">
            Groei jij mee? ☕
          </h1>
          <p className="text-lg text-white/90 leading-relaxed max-w-lg mx-auto font-medium drop-shadow-md">
            Weerzone is onafhankelijk. Jouw bijdrage houdt de servers draaiend en maakt nieuwe tools mogelijk.
          </p>
        </div>

        <SupportForm />
      </div>
    </main>
  );
}
