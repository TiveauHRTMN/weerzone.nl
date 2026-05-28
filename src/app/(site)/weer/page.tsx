import { PROVINCE_LABELS, placeSlug, type Province } from "@/lib/places-data";
import type { Metadata } from "next";
import Link from "next/link";
import { Clock3, MapPin, Navigation, Search } from "lucide-react";
import WeatherBackground from "@/components/WeatherBackground";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Weer in Nederland - 48 uur vooruit per provincie en stad",
  description:
    "Bekijk het actuele weer per provincie en plaats in Nederland. Een heldere verwachting voor de komende 48 uur, met regen, wind en temperatuur per locatie.",
  alternates: { canonical: "https://weerzone.nl/weer" },
};

const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "WEERZONE", item: "https://weerzone.nl" },
    { "@type": "ListItem", position: 2, name: "Weer in Nederland", item: "https://weerzone.nl/weer" },
  ],
};

export default function WeerIndexPage() {
  const provinces = Object.entries(PROVINCE_LABELS).map(([id, label]) => ({
    id: id as Province,
    label,
  }));

  const quickLinks = [
    { name: "Amsterdam", prov: "noord-holland" },
    { name: "Rotterdam", prov: "zuid-holland" },
    { name: "Utrecht", prov: "utrecht" },
    { name: "Den Haag", prov: "zuid-holland" },
    { name: "Eindhoven", prov: "noord-brabant" },
    { name: "Groningen", prov: "groningen" },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <main className="relative min-h-screen overflow-x-hidden">
        <Suspense fallback={<div className="fixed inset-0 z-0 bg-sky-300" />}>
          <WeatherBackground weatherCode={1} isDay={true} />
        </Suspense>
        <div className="relative z-10 mx-auto flex max-w-2xl flex-col gap-6 p-4 pb-20 pt-8 sm:p-6 sm:pb-24">
          <nav className="card px-4 py-3 text-xs font-bold uppercase tracking-widest text-text-secondary">
            <Link href="/" className="hover:text-text-primary">
              WEERZONE
            </Link>
            <span className="mx-2 text-text-muted">/</span>
            <span className="text-text-primary">Weer Nederland</span>
          </nav>

          <header className="card p-5 sm:p-6">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-text-secondary">
              <Navigation className="h-4 w-4 text-accent-orange" />
              Weer Nederland
            </div>
            <h1 className="text-4xl font-black leading-none tracking-tighter text-text-primary sm:text-5xl">
              Het weer in Nederland. Stad voor stad.
            </h1>
            <p className="mt-5 text-base font-medium leading-7 text-text-primary">
              Selecteer je provincie of een plaats om de lokale weersverwachting voor de komende
              48 uur te bekijken.
            </p>
          </header>

          <section className="card p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary">
              <Search className="h-4 w-4 text-accent-orange" />
              Populaire locaties
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.name}
                  href={`/weer/${link.prov}/${placeSlug(link.name)}`}
                  className="rounded-2xl bg-slate-50 px-4 py-3 text-center text-sm font-black text-text-primary transition-colors hover:bg-slate-100"
                >
                  Weer {link.name}
                </Link>
              ))}
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary">
              <MapPin className="h-4 w-4 text-accent-orange" />
              Provincies
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {provinces.map((p) => (
                <Link
                  key={p.id}
                  href={`/weer/${p.id}`}
                  className="group flex items-center justify-between rounded-2xl bg-slate-50 p-4 transition-colors hover:bg-slate-100"
                >
                  <span className="font-black uppercase tracking-tight text-text-primary">{p.label}</span>
                  <span className="text-accent-orange opacity-70 transition-opacity group-hover:opacity-100">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="card-blue p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/80">
              <Clock3 className="h-4 w-4 text-white" />
              Waarom Weerzone
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight text-white">Korte termijn</h3>
                <p className="mt-2 text-xs font-bold leading-5 text-white/85">
                  Focus op de komende 48 uur: vandaag en morgen helder.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight text-white">Voor jouw plannen</h3>
                <p className="mt-2 text-xs font-bold leading-5 text-white/85">
                  Weer vertaald naar concreet advies voor vandaag en morgen.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight text-white">Locaties</h3>
                <p className="mt-2 text-xs font-bold leading-5 text-white/85">
                  Van grote steden tot kleine plaatsen, overzichtelijk per provincie.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
