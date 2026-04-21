import { Metadata } from "next";
import Link from "next/link";
import { Users, Bot, Zap, TrendingUp, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Portal | WEERZONE Founder",
};

export default function AdminPortal() {
  const tools = [
    {
      title: "Agent Cockpit",
      desc: "Beheer je AI-workforce en monitor de goudmijn.",
      href: "/admin/agents",
      icon: <Bot className="w-6 h-6 text-accent-cyan" />,
      color: "from-accent-cyan/20 to-transparent",
      borderColor: "border-accent-cyan/30"
    },
    {
      title: "B2B Ignite",
      desc: "Monitor lokale leads en zakelijke kansen.",
      href: "/admin/b2b",
      icon: <Zap className="w-6 h-6 text-emerald-400" />,
      color: "from-emerald-400/20 to-transparent",
      borderColor: "border-emerald-400/30"
    },
    {
      title: "Performance",
      desc: "Landelijke weertrends en affiliate strategie.",
      href: "/admin/performance",
      icon: <TrendingUp className="w-6 h-6 text-accent-orange" />,
      color: "from-accent-orange/20 to-transparent",
      borderColor: "border-accent-orange/30"
    }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2 italic text-white/90">Mission Control</h1>
          <p className="text-white/40 text-xs font-medium tracking-[0.3em] uppercase">Founder Administration Portal</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <Link 
              key={tool.title} 
              href={tool.href}
              className={`group relative block bg-white/5 border ${tool.borderColor} rounded-[32px] p-8 overflow-hidden hover:bg-white/[0.08] transition-all`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-50`} />
              
              <div className="relative z-10">
                <div className="mb-6 p-3 bg-white/5 rounded-2xl inline-block">
                  {tool.icon}
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight mb-2 flex items-center gap-2">
                  {tool.title}
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </h2>
                <p className="text-white/50 text-sm leading-relaxed mb-4">
                  {tool.desc}
                </p>
              </div>
            </Link>
          ))}

          {/* Home Link */}
          <Link 
            href="/"
            className="group relative block bg-white/5 border border-white/10 rounded-[32px] p-8 overflow-hidden hover:bg-white/[0.08] transition-all border-dashed"
          >
             <div className="relative z-10">
                <h2 className="text-xl font-black text-white/30 uppercase tracking-tight mt-12 mb-2 flex items-center gap-2">
                  Terug naar site
                </h2>
                <p className="text-white/20 text-xs uppercase tracking-widest">Ga naar de publieke omgeving</p>
              </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
