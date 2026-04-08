export default function Footer() {
  return (
    <footer className="w-full mt-auto py-8 px-4 text-center" style={{ color: "var(--text-muted)" }}>
      <div className="max-w-2xl mx-auto">
        <div className="gradient-line mb-6" />
        <p className="text-sm">WeerZone.nl — Het weer, maar dan eerlijk.</p>
        <p className="text-xs mt-2">Data via Open-Meteo. Geen cookies, geen onzin.</p>
      </div>
    </footer>
  );
}
