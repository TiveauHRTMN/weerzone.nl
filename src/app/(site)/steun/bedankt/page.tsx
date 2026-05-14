import { Metadata } from "next";
import Link from "next/link";
import { Cookie, Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "Bedankt! - Support voor een koekje",
};

export default function BedanktPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center p-4">
      <div className="card max-w-md w-full bg-white border-white shadow-2xl p-8 sm:p-12 rounded-3xl text-center text-slate-900">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center text-amber-500 mx-auto mb-6">
          <Cookie size={40} />
        </div>
        
        <h1 className="text-3xl font-black mb-4">Super bedankt! 🍪</h1>
        <p className="text-slate-600 mb-8 leading-relaxed font-medium">
          Je bijdrage is ontvangen. Dankzij jou kunnen we Weerzone blijven verbeteren en onafhankelijk houden.
        </p>
        
        <Link 
          href="/"
          className="inline-flex items-center justify-center w-full py-4 rounded-xl bg-slate-900 text-white font-black text-lg hover:bg-slate-800 transition-all shadow-lg"
        >
          Terug naar Weerzone
        </Link>
        
        <div className="mt-8 flex items-center justify-center gap-2 text-slate-300 font-bold text-xs uppercase tracking-widest">
          <Heart className="w-4 h-4 text-red-500 fill-red-500" /> Made by Weerzone
        </div>
      </div>
    </main>
  );
}
