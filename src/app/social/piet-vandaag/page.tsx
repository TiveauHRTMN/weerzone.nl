export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ format?: string }>;
}

type Format = "ig" | "tiktok" | "x";

const FORMATS: Array<{ key: Format; label: string; dims: string }> = [
  { key: "ig", label: "Instagram (4:5)", dims: "1080×1350" },
  { key: "tiktok", label: "TikTok (9:16)", dims: "1080×1920" },
  { key: "x", label: "X (16:9)", dims: "1600×900" },
];

/**
 * Preview-pagina voor Piets dagelijkse weer-slide.
 * Landelijk weerbericht (De Bilt / KNMI-referentie), 3 formaten.
 * Logo/CTA-slide maakt Ruwan zelf in Photoshop.
 */
export default async function PietSocialPreview({ searchParams }: PageProps) {
  const sp = await searchParams;
  const formatParam = (sp.format ?? "ig").toLowerCase();
  const format: Format =
    formatParam === "tiktok" ? "tiktok" : formatParam === "x" ? "x" : "ig";
  const bust = Date.now();

  const slide1 = `/api/social/piet?slide=1&format=${format}&t=${bust}`;

  return (
    <main className="min-h-screen bg-[#0f172a] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
          Piet · dagelijkse weer-slide
        </h1>
        <p className="text-white/70 text-sm mb-6">
          Landelijk weerbericht (KNMI-referentie De Bilt). Rechts-klik →
          &ldquo;Afbeelding opslaan als…&rdquo;, of download-knop.
        </p>

        {/* Formaat-kiezer */}
        <div className="mb-8">
          <p className="text-white/60 text-xs uppercase tracking-widest font-bold mb-2">
            Formaat
          </p>
          <div className="flex flex-wrap gap-2">
            {FORMATS.map((f) => {
              const active = f.key === format;
              return (
                <a
                  key={f.key}
                  href={`?format=${f.key}`}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                    active
                      ? "bg-[#FFB400] text-slate-900"
                      : "bg-white/10 text-white/80 hover:bg-white/20"
                  }`}
                >
                  {f.label}{" "}
                  <span className="opacity-60 font-normal">{f.dims}</span>
                </a>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-white/60 text-xs uppercase tracking-widest font-bold">
            Weer-slide · {format}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide1}
            alt="Piet weer-slide"
            className="w-full rounded-2xl shadow-2xl bg-black/40"
          />
          <a
            href={slide1}
            download={`weerzone-piet-nl-${format}.png`}
            className="text-center py-3 rounded-xl bg-[#FFB400] text-slate-900 text-sm font-black hover:bg-[#ffc533]"
          >
            Download ({format})
          </a>
        </div>

        <p className="text-white/50 text-xs mt-8">
          API: <code>/api/social/piet?format=ig|tiktok|x</code>. Weer-data via
          Open-Meteo (KNMI HARMONIE), live gegenereerd per request. Logo/CTA-slide
          maak je zelf in Photoshop.
        </p>
      </div>
    </main>
  );
}
