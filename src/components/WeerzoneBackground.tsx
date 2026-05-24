/**
 * Universele Weerzone-achtergrond voor pagina's zonder eigen weerdata
 * (/mijn-weerzone, /koos, /steve, ...). Dezelfde clear-sky gradient die
 * WeatherDashboard onder een sereen weerbeeld toont, zodat het merk
 * herkenbaar blijft buiten de weer-flows.
 *
 * Server-renderbaar (geen "use client") — pure styling, geen hooks.
 */
export default function WeerzoneBackground() {
  return (
    <div
      className="fixed inset-0 z-0"
      style={{
        background: "linear-gradient(170deg, #3a9ae8 0%, #7ec4f6 100%)",
      }}
      aria-hidden
    />
  );
}
