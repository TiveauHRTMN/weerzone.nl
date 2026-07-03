"use client";

/**
 * Vangt weerdata-fouten in het /weer-segment (provincie-, plaats- en
 * themapagina's gooien bewust als de verwachting niet op te halen is — zie de
 * throw-comments daar). Rendert met een 5xx voor crawlers i.p.v. de oude
 * "niet beschikbaar"-div die als 200 gecachet en geïndexeerd werd.
 */
export default function WeerError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-[680px] px-4 py-16">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-950">Het weer is heel even niet beschikbaar</h1>
        <p className="mt-2 text-sm text-slate-600">
          We konden de verwachting nu niet ophalen. Meestal is dit binnen een paar minuten voorbij.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-80"
        >
          Probeer opnieuw
        </button>
      </div>
    </div>
  );
}
