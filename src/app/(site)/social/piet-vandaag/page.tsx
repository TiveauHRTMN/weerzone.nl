export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ format?: string }>;
}

type Format = "ig" | "tiktok" | "x";

const FORMATS: Array<{ key: Format; label: string; dims: string }> = [
  { key: "ig", label: "Instagram", dims: "1080×1350" },
  { key: "tiktok", label: "TikTok", dims: "1080×1920" },
  { key: "x", label: "X (Twitter)", dims: "1600×900" },
];

export default async function PietSocialPreview({ searchParams }: PageProps) {
  const sp = await searchParams;
  const formatParam = (sp.format ?? "ig").toLowerCase();
  const format: Format = (FORMATS.find(f => f.key === formatParam)?.key as Format) || "ig";
  const bust = Date.now();

  const slide1 = `/api/social/piet?slide=1&format=${format}&t=${bust}`;
  const slide2 = `/api/social/piet?slide=2&format=${format}&t=${bust}`;

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-accent-orange/30">
      {/* Premium Header */}
      <div className="bg-[#1e293b] border-b border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                 <div className="bg-[#ffd60a] text-black text-[10px] font-black px-2 py-0.5 rounded tracking-widest uppercase">PRO SERIES</div>
                 <span className="text-white/40 text-[10px] font-bold tracking-[0.2em] uppercase">Social Media Dashboard</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter">
                Piet <span className="text-[#ffd60a]">·</span> Dagelijkse Slides
              </h1>
              <p className="text-white/60 text-lg mt-4 max-w-xl leading-relaxed">
                Landelijk weerbericht (KNMI de Bilt). De slides worden live gegenereerd op basis van de laatste polderdata.
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Selecteer Formaat</span>
              <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5">
                {FORMATS.map((f) => {
                  const active = f.key === format;
                  return (
                    <a
                      key={f.key}
                      href={`?format=${f.key}`}
                      className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        active
                          ? "bg-[#ffd60a] text-black shadow-lg shadow-[#ffd60a]/10"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {f.label}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-16 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Slide 1 */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
               <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    Slide 1: <span className="text-[#ffd60a]">Landelijk Weerbericht</span>
                  </h2>
                  <p className="text-xs text-white/40 mt-1 uppercase tracking-widest">Live weergave · {format}</p>
               </div>
               <a
                href={slide1}
                download={`weerzone-slide1-${format}.png`}
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-lg text-xs font-bold transition-all"
              >
                Download PNG
              </a>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#ffd60a]/20 to-sky-500/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide1}
                alt="Slide 1"
                className="relative w-full rounded-[1.5rem] shadow-2xl border border-white/5 bg-slate-900"
              />
            </div>
          </div>

          {/* Slide 2 */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
               <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    Slide 2: <span className="text-[#ffd60a]">Premium CTA</span>
                  </h2>
                  <p className="text-xs text-white/40 mt-1 uppercase tracking-widest">Merk & Conversie · {format}</p>
               </div>
               <a
                href={slide2}
                download={`weerzone-slide2-${format}.png`}
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-lg text-xs font-bold transition-all"
              >
                Download PNG
              </a>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#ffd60a]/20 to-sky-500/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide2}
                alt="Slide 2"
                className="relative w-full rounded-[1.5rem] shadow-2xl border border-white/5 bg-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.3em]">System Diagnostics</p>
            <p className="text-white/40 text-xs">
              Engine: <span className="text-sky-400">Vercel OG (Edge)</span> · Data: <span className="text-[#ffd60a]">KNMI HARMONIE</span> · Resolution: <span className="text-white/60">{format === 'x' ? '1600x900' : '1080xY'}</span>
            </p>
          </div>
          
          <div className="text-right">
             <p className="text-white/20 text-[10px] italic">"48 uur. De rest is ruis."</p>
          </div>
        </div>
      </div>
    </main>
  );
}
