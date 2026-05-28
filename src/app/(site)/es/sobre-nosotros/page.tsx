import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sobre nosotros",
  description:
    "WEERZONE traduce el tiempo en decisiones para tu calle, tu costa o tu sierra. Sin pronosticos de 14 dias, sin publicidad, sin tracking. Asi pensamos.",
  alternates: {
    canonical: "https://weerzone.nl/es/sobre-nosotros",
    languages: {
      "nl-NL": "https://weerzone.nl/over",
      "de-DE": "https://weerzone.nl/de/uber-uns",
      "fr-FR": "https://weerzone.nl/fr/a-propos",
      "es-ES": "https://weerzone.nl/es/sobre-nosotros",
      "x-default": "https://weerzone.nl/over",
    },
  },
  openGraph: {
    title: "Sobre WEERZONE Espana",
    description: "Tiempo util a 48 horas, con Juan, Reed y Steve. Sin ruido, sin spam.",
    type: "website",
    locale: "es_ES",
    url: "https://weerzone.nl/es/sobre-nosotros",
    siteName: "WEERZONE",
  },
};

const PRINCIPLES = [
  {
    title: "48 horas, no 14 dias",
    text:
      "La prevision sirve para decidir cuando es fiable. 48 horas es nuestro horizonte util en Espana. Mas alla suele dar tendencia, pero no plan — y no vendemos humo.",
  },
  {
    title: "Hiperlocal a 1x1 km",
    text:
      "Trabajamos a la escala de tu codigo postal, no de tu provincia. Que en Madrid llueva en Vallecas y no en Pozuelo es lo que nos interesa hacer visible.",
  },
  {
    title: "Personas, no avatares",
    text:
      "Juan habla como un vecino. Reed solo te toca si pasa algo. Steve traduce el tiempo en decision comercial. Detras hay un equipo pequeno con personas reales que firman lo que escriben.",
  },
  {
    title: "Sin publicidad, sin tracking",
    text:
      "Cero banners de cookies, cero rastreo cruzado. El producto se sostiene con suscripciones — no vendiendo tu atencion o tus datos a terceros.",
  },
];

export default function SobreNosotrosPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16 space-y-8">
      <header className="space-y-3 max-w-2xl">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-700">
          Sobre nosotros
        </p>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-text-primary leading-[1.05]">
          Tiempo util, contado por gente que escribe lo que firma.
        </h1>
        <p className="text-lg text-text-secondary leading-relaxed">
          WEERZONE nacio en los Paises Bajos como reaccion al ruido en los servicios de tiempo:
          pronosticos de 14 dias, avisos por cualquier nube y aplicaciones llenas de banners.
          En Espana hacemos lo mismo: 48 horas utiles, personas con voz propia y un panel limpio.
        </p>
      </header>

      <section className="card p-6 sm:p-8 space-y-4">
        <h2 className="text-2xl font-black text-text-primary tracking-tight">Como pensamos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="rounded-2xl border border-slate-100 p-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-amber-700 mb-2">
                {p.title}
              </p>
              <p className="text-sm text-text-secondary leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-6 sm:p-8 space-y-3">
        <h2 className="text-2xl font-black text-text-primary tracking-tight">Mariana, el motor</h2>
        <p className="text-base text-text-secondary leading-relaxed">
          Detras de Juan, Reed y Steve esta Mariana: nuestra capa que cruza modelos europeos
          (ECMWF, AROME, ICON y mas), los boletines oficiales de AEMET y senales locales para
          destilar una respuesta concreta para tu direccion. Mariana es la unica IA que ensenamos
          abiertamente — la decision de cuando avisar y como contar siempre la firma una persona.
        </p>
        <p className="text-sm text-text-secondary leading-relaxed">
          AEMET sigue siendo la referencia oficial de avisos en Espana. Weerzone no la sustituye:
          la incluye como una capa mas y respeta sus derechos como proveedor.
        </p>
      </section>

      <section className="card p-6 sm:p-8 space-y-3">
        <h2 className="text-2xl font-black text-text-primary tracking-tight">Contacto</h2>
        <p className="text-base text-text-secondary leading-relaxed">
          Para prensa, prueba beta o colaboraciones con negocios escribenos a{" "}
          <a href="mailto:info@weerzone.nl" className="underline decoration-slate-300 hover:decoration-slate-900">
            info@weerzone.nl
          </a>{" "}
          o pasa por <Link href="/es/contacto" className="underline decoration-slate-300 hover:decoration-slate-900">contacto</Link>.
        </p>
      </section>
    </main>
  );
}
