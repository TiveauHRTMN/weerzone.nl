import Link from "next/link";
import { LogoFull } from "./Logo";

export default function Footer() {
  const sections = [
    {
      title: "Het Weer",
      links: [
        { label: "BBQ Index", href: "/weer/themas/bbq-weer" },
        { label: "Strandweer", href: "/weer/themas/strandweer" },
        { label: "Hooikoorts", href: "/weer/themas/hooikoorts" },
        { label: "Hardlopen", href: "/weer/themas/hardloopweer" },
      ]
    },
    {
      title: "Platform",
      links: [
        { label: "Over WeerZone", href: "/over-ons" },
        { label: "Prijzen", href: "/prijzen" },
        { label: "Partner worden", href: "/zakelijk" },
        { label: "Onboarding", href: "/app/onboarding" },
      ]
    },
    {
      title: "Juridisch",
      links: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Cookie Instellingen", href: "#" }, // Placeholder for cookie manager
        { label: "Contact", href: "/contact" },
      ]
    }
  ];

  return (
    <footer className="mt-20 border-t border-white/10 pt-20 pb-12 bg-black/40 backdrop-blur-xl px-6 sm:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
          <div className="md:col-span-5">
            <Link href="/" className="inline-block mb-6">
              <LogoFull height={32} className="opacity-100" />
            </Link>
            <p className="text-white/60 text-sm max-w-sm leading-relaxed font-medium">
              De nauwkeurigste weersvoorspelling van Nederland. <br />
              Op 1 bij 1 kilometer, tot 48 uur vooruit — precies voor uw locatie.
            </p>
          </div>
          
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {sections.map((section) => (
              <div key={section.title}>
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white mb-6">
                  {section.title}
                </h4>
                <ul className="space-y-4">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link 
                        href={link.href} 
                        className="text-[13px] text-white/40 hover:text-white transition-all duration-300 font-medium"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
             <span>WEERZONE</span>
             <span className="w-1 h-1 bg-white/10 rounded-full" />
             <span>Powered by Google & Tiveau</span>
           </div>
           
           <div className="flex gap-8">
             <a href="https://x.com/weerzone" target="_blank" className="text-white/20 hover:text-white transition-colors text-[10px] uppercase font-black tracking-widest">X</a>
             <a href="https://www.instagram.com/weerzonenl" target="_blank" className="text-white/20 hover:text-white transition-colors text-[10px] uppercase font-black tracking-widest">Instagram</a>
             <a href="https://youtube.com/@weerzone" target="_blank" className="text-white/20 hover:text-white transition-colors text-[10px] uppercase font-black tracking-widest">YouTube</a>
             <a href="https://linkedin.com/company/weerzone" target="_blank" className="text-white/20 hover:text-white transition-colors text-[10px] uppercase font-black tracking-widest">LinkedIn</a>
           </div>
        </div>
      </div>
    </footer>
  );
}
