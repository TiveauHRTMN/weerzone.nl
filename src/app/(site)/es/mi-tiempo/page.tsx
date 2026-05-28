import type { Metadata } from "next";
import Link from "next/link";
import WeatherDashboard from "@/components/WeatherDashboard";
import RainMap from "@/components/RainMap";
import PollenWidget from "@/components/PollenWidget";
import MarineWidget from "@/components/MarineWidget";
import { getSavedLocationServer } from "@/lib/location-cookies";
import { ALL_PLACES } from "@/lib/places-data";
import { fetchWeatherData, fetchAirQuality, fetchMarineData } from "@/lib/weather";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getJuanWeatherVerdict } from "@/app/actions";

export async function generateMetadata(): Promise<Metadata> {
  const loc = await getSavedLocationServer().catch(() => null);
  const place = loc?.name || "tu ubicacion";
  const title = loc?.name
    ? `Mi tiempo en ${place} — 48 horas con Juan`
    : "Mi tiempo — El parte hiperlocal de Juan";
  const description = loc?.name
    ? `El parte de Juan para ${place}: que hacer hoy y manana segun lluvia, viento, sol y bochorno. Sin jerga, sin spam, sin pronosticos de catorce dias.`
    : "Tu parte del tiempo personal para las proximas 48 horas, escrito por Juan. Lenguaje claro, sin publicidad y sin pronosticos de dos semanas que ya estaran mal manana.";

  return {
    title,
    description,
    alternates: {
      canonical: "https://weerzone.nl/es/mi-tiempo",
      languages: {
        "nl-NL": "https://weerzone.nl/piet",
        "de-DE": "https://weerzone.nl/de/mein-wetter",
        "fr-FR": "https://weerzone.nl/fr/mon-meteo",
        "es-ES": "https://weerzone.nl/es/mi-tiempo",
        "x-default": "https://weerzone.nl/piet",
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "es_ES",
      url: "https://weerzone.nl/es/mi-tiempo",
      siteName: "WEERZONE",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  url: "https://weerzone.nl/es/mi-tiempo",
  inLanguage: "es-ES",
  name: "Mi tiempo con Juan",
  description:
    "El parte hiperlocal de Juan para tu ubicacion. Las proximas 48 horas en lenguaje claro, sin jerga ni pronosticos de catorce dias.",
  mainEntity: {
    "@type": "Person",
    name: "Juan",
    description:
      "Juan es la voz de barrio de WEERZONE para Espana. Mira el tiempo por ti y te cuenta el dia como un vecino que conoce la calle, la costa o la sierra.",
    jobTitle: "Voz del tiempo en Weerzone",
    worksFor: { "@type": "Organization", name: "WEERZONE", url: "https://weerzone.nl" },
  },
  about: [
    {
      "@type": "Thing",
      name: "Prevision hiperlocal para las proximas 48 horas en Espana",
    },
  ],
};

function timeGreeting(): string {
  const h = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Madrid" })).getHours();
  if (h >= 6 && h < 13) return "Buenos dias";
  if (h >= 13 && h < 20) return "Buenas tardes";
  if (h >= 20 && h < 24) return "Buenas noches";
  return "Hola";
}

const madrid =
  ALL_PLACES.find((place) => place.province === "spanje" && place.name === "Madrid") ??
  ALL_PLACES.find((place) => place.province === "spanje") ??
  ALL_PLACES[0];

const JUAN_SAMPLES = [
  { mood: "Costa mediterranea", text: "Hoy entra terral suave. La terraza aguanta hasta media tarde." },
  { mood: "Meseta en verano", text: "Mucho sol y casi nada de viento. Sombrilla obligatoria a partir de mediodia." },
  { mood: "Norte atlantico", text: "Manana cubierta, lluvia floja despues de comer. Calzada que no resbale." },
  { mood: "Sierra en invierno", text: "Catorce grados por la tarde, pero la sierra esta a cero. No bajes a manga corta." },
];

export default async function MiTiempoPage() {
  const loc = await getSavedLocationServer().catch(() => null);
  const activeLoc = loc || madrid;
  const lat = activeLoc.lat;
  const lon = activeLoc.lon;

  const [initialWeather, airQuality, marineData] = await Promise.all([
    fetchWeatherData(lat, lon, false, false, undefined, "es").catch(() => undefined),
    fetchAirQuality(lat, lon, "es").catch(() => null),
    fetchMarineData(lat, lon, "es").catch(() => null),
  ]);

  const placeMeta: { province?: string; character?: string } =
    "province" in activeLoc
      ? {
          province: (activeLoc as { province?: string }).province,
          character: (activeLoc as { character?: string }).character,
        }
      : {};

  const regionLabel =
    placeMeta.province === "spanje"
      ? "Espana"
      : placeMeta.character === "mediterranean coastal"
        ? "costa mediterranea"
        : placeMeta.character === "atlantic coastal"
          ? "costa atlantica"
          : placeMeta.character === "mountain"
            ? "sierra"
            : "tu zona";

  const juanVerdict = initialWeather
    ? await getJuanWeatherVerdict(initialWeather, activeLoc.name, regionLabel, placeMeta.character).catch(() => null)
    : null;

  let greetingName: string | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      const { data: profile } = await supabase
        .from("user_profile")
        .select("full_name")
        .eq("id", userData.user.id)
        .maybeSingle();
      if (profile?.full_name) {
        greetingName = profile.full_name.split(" ")[0];
      }
    }
  } catch {
    // greeting opcional
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main>
        <WeatherDashboard
          initialCity={activeLoc}
          initialWeather={initialWeather}
          initialWeatherCode={initialWeather?.current.weatherCode}
          initialIsDay={initialWeather?.current.isDay}
          initialNarrative={juanVerdict}
          hideWeatherInfo={true}
          showRainRadar={true}
          locale="es"
          topContent={
            <div className="space-y-6">
              <div className="card p-6 sm:p-8">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-5">
                  Mi tiempo con Juan
                </p>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-[1.15] mb-4">
                  {greetingName ? (
                    <>
                      {timeGreeting()}, {greetingName}.<br />
                      <span className="text-[#3b7ff0]">Este es tu dia.</span>
                    </>
                  ) : (
                    <>
                      {timeGreeting()}.<br />
                      <span className="text-[#3b7ff0]">Este es tu dia.</span>
                    </>
                  )}
                </h1>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-sm font-bold text-slate-700">{activeLoc.name}</span>
                </div>
              </div>

              {juanVerdict && (
                <div className="card p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-600 text-lg font-black text-white">
                      J
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">
                        El parte de Juan
                      </p>
                      <p className="text-sm font-black text-slate-900">Hoy y manana, en una lectura</p>
                    </div>
                  </div>
                  <p className="text-[15px] sm:text-base text-slate-700 leading-[1.7]">{juanVerdict}</p>
                </div>
              )}

              <RainMap lat={lat} lon={lon} locale="es" />

              {airQuality && <PollenWidget data={airQuality} locale="es" />}
              {marineData && <MarineWidget data={marineData} locale="es" />}
            </div>
          }
          beforeFooter={
            <div className="space-y-4 mt-8">
              <div className="card p-6 sm:p-8">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">
                  Como funciona Mi tiempo
                </p>
                <h2 className="text-xl font-black text-slate-900 mb-3">
                  48 horas por delante — ni mas, ni menos
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  WEERZONE se centra a proposito en las proximas 48 horas. Es el periodo
                  en el que la prevision sirve para decidir: tender, coger el coche, abrir
                  la terraza o aplazar el paseo. Mas alla empieza la especulacion — y la
                  especulacion no la vendemos.
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Usamos datos actuales y los convertimos en una conclusion clara para tu direccion.
                  Sin palabras grandes para parecer importantes: hora, lugar y consejo practico.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">
                    Costa, isla, meseta, sierra
                  </p>
                  <p className="font-black text-slate-900 mb-1">Tiempo con caracter local</p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    El levante en Valencia no es lo mismo que el cierzo en el valle del Ebro,
                    ni el terral en Malaga. Juan tiene en cuenta el caracter de tu zona
                    para decirte si conviene salir, esperar o cambiar el plan.
                  </p>
                </div>
                <div className="card p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">
                    Hiperlocal a 1x1 km
                  </p>
                  <p className="font-black text-slate-900 mb-1">Tu codigo postal, no tu provincia</p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Puede llover a dos kilometros de tu calle y aqui seguir seco. WEERZONE
                    se construye para hacer visible esa diferencia, no para tapar el matiz
                    detras de una media regional.
                  </p>
                </div>
                <div className="card p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">
                    Sin ruido
                  </p>
                  <p className="font-black text-slate-900 mb-1">Solo lo que importa hoy</p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Ni graficos infinitos ni pronosticos a catorce dias que manana ya no
                    sirven. Mi tiempo te ensena temperatura, lluvia, viento y UV — por
                    hora, en castellano claro, sin publicidad ni tracking.
                  </p>
                </div>
                <div className="card p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">
                    Precision
                  </p>
                  <p className="font-black text-slate-900 mb-1">92-98% para las proximas 48 horas</p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Para las proximas 24 horas la prevision acierta entre el 95% y el 98%.
                    Entre 24 y 48 horas baja al 92-95%. Mas alla la fiabilidad cae rapido,
                    por eso no fingimos saber lo que pasara dentro de diez dias.
                  </p>
                </div>
              </div>

              <div className="card p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-600">
                    Quien es Juan
                  </span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 leading-tight mb-3">
                  El vecino que sabe de tiempo, no el presentador de la tele.
                </h2>
                <p className="text-[15px] text-slate-600 leading-[1.7] mb-4">
                  Juan no suena como un servicio clasico. No habla en porcentajes ni en
                  &laquo;probabilidad alta de&raquo;. Escribe como si te conociera — y un
                  poco te conoce, porque le dijiste donde vives, si tienes terraza, si
                  bajas a la playa, si el perro tiene que salir si o si.
                </p>
                <p className="text-[15px] text-slate-600 leading-[1.7] mb-4">
                  Cuando hay sol esta de buen humor, sin pasarse. Cuando se pone feo es
                  honesto, sin dramatismo. Si toca chaqueta te lo dice asi, no en
                  &laquo;sensacion termica de nueve grados&raquo;.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                  {JUAN_SAMPLES.map(({ mood, text }) => (
                    <div key={mood} className="rounded-2xl border border-slate-100 p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                        {mood}
                      </p>
                      <p className="text-slate-900 text-[15px] leading-relaxed italic">
                        &laquo;&nbsp;{text}&nbsp;&raquo;
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">
                  Sacale mas partido a Weerzone
                </p>
                <p className="text-slate-900 font-black text-lg mb-2">
                  Alertas que de verdad importan
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Con Reed recibes un aviso cuando el tiempo cruza tu umbral personal —
                  lluvia fuerte, viento, calor extremo o tormenta. Tu decides cuando
                  quieres saberlo. Sin ruido, solo cuando hace falta.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/es/alertas" className="btn btn-primary btn-sm">
                    Configurar mis alertas
                  </Link>
                  <Link href="/app/signup?lang=es" className="btn btn-ghost btn-sm">
                    Crear mi Weerzone
                  </Link>
                </div>
              </div>
            </div>
          }
        />
      </main>
    </>
  );
}
