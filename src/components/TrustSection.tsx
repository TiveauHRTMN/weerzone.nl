export default function TrustSection() {
  return (
    <section className="px-4 py-20 bg-black/5">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-6">
            Waarom stopt WEERZONE bij <span className="text-accent-orange">48 uur?</span>
          </h2>
          <p className="text-white/70 text-lg mb-8 leading-relaxed">
            De meeste weer-apps verkopen je een 14-daagse voorspelling alsof het de waarheid was. 
            Maar vraag het een weerman en die vertelt je de waarheid: na drie dagen is het een muntje opgooien.
          </p>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xl shrink-0">🎯</div>
              <div>
                <p className="font-bold text-white">0–48 uur: Precisie</p>
                <p className="text-white/50 text-sm">KNMI HARMONIE rekent met een 2,5 km raster. Hierop kun je beslissingen baseren.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xl shrink-0">🎲</div>
              <div>
                <p className="font-bold text-white">3–7 dagen: Statistische ruis</p>
                <p className="text-white/50 text-sm">Modellen wijken af. Het verschil tussen een BBQ en een waterballet is dan één windvlaag.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xl shrink-0">🔮</div>
              <div>
                <p className="font-bold text-white">10+ dagen: Puur gokwerk</p>
                <p className="text-white/50 text-sm">Perfect voor clickbait, onbruikbaar voor echte mensen die buiten werken.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative aspect-square bg-white/5 rounded-3xl border border-white/10 p-8 flex flex-col justify-center overflow-hidden">
          {/* Visual Decay Chart */}
          <p className="text-[10px] font-black uppercase tracking-[.2em] text-accent-orange mb-4">Accuracy Decay Model</p>
          <div className="flex-1 flex flex-col justify-end gap-2">
            {[98, 92, 75, 45, 20, 10, 5].map((val, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-white/40 w-12 text-right">Dag {i + 1}</span>
                <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden">
                  <div 
                    className="h-full transition-all duration-1000" 
                    style={{ 
                      width: `${val}%`, 
                      background: i < 2 ? 'var(--accent-orange)' : 'rgba(255,255,255,0.1)' 
                    }} 
                  />
                </div>
                <span className={`text-[10px] font-bold w-10 ${i < 2 ? 'text-accent-orange' : 'text-white/20'}`}>{val}%</span>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-8 border-t border-white/5">
            <p className="text-sm font-black text-white italic">"Wij beloven je geen 14 dagen zon. Wij beloven je de waarheid over de komende 48 uur."</p>
          </div>
        </div>
      </div>
    </section>
  );
}
