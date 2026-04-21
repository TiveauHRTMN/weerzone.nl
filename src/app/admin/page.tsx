"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function AdminPortal() {
  useEffect(() => {
    console.log("Admin Portal Loaded 🚀");
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-white p-20 font-sans flex flex-col items-center justify-center text-center">
      <div className="w-20 h-1 bg-accent-cyan mb-8 rounded-full" />
      <h1 className="text-4xl font-black uppercase mb-4 tracking-tighter">Mission Control</h1>
      <p className="text-white/40 mb-10 text-sm uppercase tracking-[0.3em]">Founder Administration Portal</p>
      
      <div className="flex flex-wrap gap-4 justify-center">
        <Link href="/admin/agents" className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-[32px] font-black uppercase transition-all">
          Agent Cockpit
        </Link>
        <Link href="/" className="px-8 py-4 border border-white/5 rounded-[32px] font-black uppercase text-white/30 hover:text-white transition-all">
          Terug naar site
        </Link>
      </div>
    </div>
  );
}
