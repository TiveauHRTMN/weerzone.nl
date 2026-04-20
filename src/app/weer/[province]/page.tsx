import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ALL_PLACES, PROVINCE_LABELS, placeSlug, type Province } from "@/lib/places-data";

interface PageProps {
  params: Promise<{ province: string }>;
}

const VALID_PROVINCES = Object.keys(PROVINCE_LABELS);

export function generateStaticParams() {
  return VALID_PROVINCES.map((province) => ({ province }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { province } = await params;
  if (!VALID_PROVINCES.includes(province)) return {};

  const label = PROVINCE_LABELS[province as Province];
  return {
    title: `Weer ${label} — Alle plaatsen | WEERZONE`,
    description: `Het weer in ${label}. Bekijk de actuele weersverwachting voor alle steden en dorpen in ${label}. Per uur bijgewerkt met KNMI HARMONIE data.`,
    keywords: [
      `weer ${label.toLowerCase()}`,
      `weerbericht ${label.toLowerCase()}`,
      `weer ${label.toLowerCase()} vandaag`,
      "weer nederland",
      "weerzone",
    ],
    alternates: {
      canonical: `https://weerzone.nl/weer/${province}`,
    },
    openGraph: {
      title: `Weer ${label} — WEERZONE`,
      description: `Weer voor alle plaatsen in ${label}. 48 uur vooruit.`,
      url: `https://weerzone.nl/weer/${province}`,
      type: "website",
      locale: "nl_NL",
      siteName: "WEERZONE",
    },
  };
}

export default async function ProvincePage({ params }: PageProps) {
  const { province } = await params;
  if (!VALID_PROVINCES.includes(province)) notFound();

  const label = PROVINCE_LABELS[province as Province];
  const places = ALL_PLACES
    .filter((p) => p.province === province)
    .sort((a, b) => a.name.localeCompare(b.name, "nl"));

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "WEERZONE", item: "https://weerzone.nl" },
      { "@type": "ListItem", position: 2, name: "Weer", item: "https://weerzone.nl/weer" },
      { "@type": "ListItem", position: 3, name: label, item: `https://weerzone.nl/weer/${province}` },
    ],
  };

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Weer ${label}`,
    url: `https://weerzone.nl/weer/${province}`,
    description: `Overzicht van het weer in alle plaatsen in ${label}.`,
    isPartOf: { "@type": "WebSite", name: "WEERZONE", url: "https://weerzone.nl" },
    hasPart: places.map((p) => ({
      "@type": "WebPage",
      name: `Weer ${p.name}`,
      url: `https://weerzone.nl/weer/${province}/${placeSlug(p.name)}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }} />
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <nav className="text-xs text-white/50 mb-6">
            <Link href="/" className="hover:text-white">WEERZONE</Link>
            <span className="mx-2">/</span>
            <Link href="/weer" className="hover:text-white">Weer</Link>
            <span className="mx-2">/</span>
            <span className="text-white/80">{label}</span>
          </nav>

          <header className="mb-10">
            <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4">
              Weer in {label}
            </h1>
            <p className="text-white/70 text-lg leading-relaxed">
              Actueel weer voor alle {places.length} plaatsen in {label}.
              KNMI HARMONIE + DWD ICON — 48 uur vooruit, per uur bijgewerkt.
            </p>
          </header>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              Kies een plaats in {label}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {places.map((p) => {
                const slug = placeSlug(p.name);
                return (
                  <Link
                    key={p.name}
                    href={`/weer/${province}/${slug}`}
                    className="block px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-accent-orange/60 text-sm font-semibold transition-all"
                  >
                    Weer {p.name}
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Interne links naar andere provincies */}
          <section className="mt-12 pt-8 border-t border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">Weer in andere provincies</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {VALID_PROVINCES.filter((p) => p !== province).map((p) => (
                <Link
                  key={p}
                  href={`/weer/${p}`}
                  className="block px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white/70 hover:text-white transition-all"
                >
                  {PROVINCE_LABELS[p as Province]}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
