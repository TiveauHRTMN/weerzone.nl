"use client";

import { Cookie, Heart } from "lucide-react";
import Link from "next/link";

export default function SupportCard() {
  return (
    <div className="card p-8 sm:p-10 bg-gradient-to-br from-white to-amber-50/50 relative group">
      <div className="absolute -right-6 -top-6 text-amber-500/10 rotate-12 transition-transform group-hover:scale-110 group-hover:rotate-6 duration-500">
        <Heart size={140} />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-500">
            <Cookie className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Laat ons groeien</span>
        </div>
        
        <h3 className="text-2xl sm:text-3xl font-black text-text-primary mb-3 tracking-tight">
          Support voor een koekje 🍪
        </h3>
        
        <p className="text-sm text-text-secondary leading-relaxed mb-6 max-w-lg">
          Weerzone wordt volledig onafhankelijk ontwikkeld. Jouw bijdrage helpt ons om de servers draaiende te houden,
          actuele gegevens te verwerken en de website beter te maken. Groei jij mee?
        </p>
        
        <Link 
          href="/steun"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/30"
        >
          <Cookie className="w-4 h-4 mr-2" />
          Trakteer op een koekje
        </Link>
      </div>
    </div>
  );
}
