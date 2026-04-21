import Link from "next/link";
import { LogoFull } from "./Logo";

export default function Footer() {
  const currentYear = new Date().getFullYear();

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
        { label: "Prijzen & Founder-deals", href: "/prijzen" },
        { label: "Partner worden", href: "/zakelijk" },
        { label: "Onboarding", href: "/app/onboarding" },
      ]
    },
    {
      title: "Juridisch",
      links: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Cookie Instellingen", href: "#cookies" },
        { label: "Contact", href: "/contact" },
      ]
    }
  ];

  return (
    <footer className="mt-20 border-t border-white/10 pt-16 pb-12 bg-black/20 backdrop-blur-3xl rounded-t-[40px] px-6 sm:px-10">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2">
            <LogoFull height={40} className="mb-6 opacity-90" />
            <p className="text-white/50 text-sm max-w-xs leading-relaxed font-medium">
              Geen reclame. Geen 14-daagse gokwerk. 
              Puur KNMI HARMONIE data op de vierkante meter. 
              <br/><br/>
              48 uur vooruit. De rest is ruis.
            </p>
          </div>
          
          {sections.map((section) => (
            <div key={section.title}>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-orange mb-6">
                {section.title}
              </h4>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link 
                      href={link.href} 
                      className="text-sm text-white/50 hover:text-white transition-colors font-medium"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
             <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
               © {currentYear} WEERZONE.nl — EEN TIVEAU PRODUCTION
             </span>
          </div>
          <div className="flex items-center gap-6">
             <span className="text-[9px] font-bold text-white/20 uppercase">
               Data: KNMI & Open-Meteo
             </span>
             <span className="text-[9px] font-bold text-white/20 uppercase">
               Uptime: 99.9%
             </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
