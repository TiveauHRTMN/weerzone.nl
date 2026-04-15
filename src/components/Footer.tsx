export default function Footer() {
  return (
    <footer className="w-full mt-auto py-8 px-4 text-center" style={{ color: "var(--text-muted)" }}>
      <div className="max-w-2xl mx-auto">
        <div className="gradient-line mb-6" />
        <p className="text-sm font-semibold">WeerZone.nl — 48 uur. De rest is ruis.</p>
        <p className="text-xs mt-2">KNMI HARMONIE · DWD ICON · Twee weermodellen, nul ruis.</p>
        <div className="mt-6 pt-6 border-t border-white/5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
            Een Tiveau-product
          </p>
        </div>
      </div>
    </footer>
  );
}
