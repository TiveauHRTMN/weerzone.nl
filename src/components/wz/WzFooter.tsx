import Link from "next/link";
import { LogoFull } from "../Logo";

export default function WzFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-white/5 pt-16 pb-12 bg-black/5 px-6 sm:px-12">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2">
            <LogoFull height={32} className="mb-6 opacity-40 grayscale" />
            <p className="text-white/30 text-xs max-w-xs leading-relaxed font-medium uppercase tracking-wider">
              HET EERLIJKE WEERBERICHT.<br/>
              48 UUR VOORUIT. DE REST IS RUIS.
            </p>
          </div>
          
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-6">Product</h4>
            <ul className="space-y-4">
              <li><Link href="/prijzen" className="text-sm text-white/30 hover:text-white transition-colors">Prijzen</Link></li>
              <li><Link href="/mijnweer" className="text-sm text-white/30 hover:text-white transition-colors">Mijn Weer</Link></li>
              <li><Link href="/waarschuwingen" className="text-sm text-white/30 hover:text-white transition-colors">Waarschuwingen</Link></li>
              <li><Link href="/zakelijk" className="text-sm text-white/30 hover:text-white transition-colors">Zakelijk</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-6">Support</h4>
            <ul className="space-y-4">
              <li><Link href="/privacy" className="text-sm text-white/30 hover:text-white transition-colors">Privacy</Link></li>
              <li><Link href="/contact" className="text-sm text-white/30 hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/" className="text-sm text-white/30 hover:text-white transition-colors">Homepage</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
             <span className="text-[10px] font-black uppercase tracking-widest text-white/10">
               © {currentYear} WEERZONE.nl — POWERED BY TIVEAU
             </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
