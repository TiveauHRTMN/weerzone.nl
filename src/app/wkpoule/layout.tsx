import type { Metadata } from "next";
import WkNav from "@/components/wkpoule/WkNav";

export const metadata: Metadata = {
  title: "Hartman WK 2026",
  description: "Privé Hartman WK 2026 voor genodigden.",
  robots: { index: false, follow: false },
};

export default function WkPouleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="wk-ios min-h-screen bg-[#07101d] text-slate-50 selection:bg-sky-500/35">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#0b1628_0%,#07101d_44%,#050914_100%)]" />
        <div className="absolute inset-x-0 top-0 h-[260px] bg-[linear-gradient(90deg,rgba(239,68,68,0.16)_0%,rgba(59,130,246,0.16)_48%,rgba(34,197,94,0.14)_100%)] opacity-55 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:44px_44px] opacity-40" />
      </div>

      <WkNav />
      <main className="relative z-10">{children}</main>
    </div>
  );
}
