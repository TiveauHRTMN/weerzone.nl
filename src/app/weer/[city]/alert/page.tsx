import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DUTCH_CITIES } from "@/lib/types";
import { fetchWeatherData } from "@/lib/weather";
import { getWeatherDescription, getWeatherEmoji, getWindBeaufort } from "@/lib/weather";

export const revalidate = 300; // ISR: 5 minuten cache

// ── Helpers ──────────────────────────────────────────────────

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function findCity(slug: string) {
  return DUTCH_CITIES.find((c) => slugify(c.name) === slug);
}

interface AlertCondition {
  type: "rain" | "wind" | "heat" | "frost" | "uv";
  severity: "geel" | "oranje" | "rood";
  label: string;
  description: string;
  value: string;
  icon: string;
}

function determineAlerts(
  weather: Awaited<ReturnType<typeof fetchWeatherData>>
): AlertCondition[] {
  const alerts: AlertCondition[] = [];

  // Neerslag in 48h
  const totalRain48h = weather.hourly
    .slice(0, 48)
    .reduce((sum, h) => sum + h.precipitation, 0);
  if (totalRain48h > 20) {
    alerts.push({
      type: "rain",
      severity: "rood",
      label: "Zware neerslag",
      description: `${totalRain48h.toFixed(1)} mm verwacht in 48 uur. Kans op wateroverlast.`,
      value: `${totalRain48h.toFixed(1)} mm`,
      icon: "🌧️",
    });
  } else if (totalRain48h > 10) {
    alerts.push({
      type: "rain",
      severity: "oranje",
      label: "Veel neerslag",
      description: `${totalRain48h.toFixed(1)} mm verwacht in 48 uur. Neem een paraplu mee.`,
      value: `${totalRain48h.toFixed(1)} mm`,
      icon: "🌧️",
    });
  } else if (totalRain48h > 5) {
    alerts.push({
      type: "rain",
      severity: "geel",
      label: "Neerslag verwacht",
      description: `${totalRain48h.toFixed(1)} mm verwacht in de komende 48 uur.`,
      value: `${totalRain48h.toFixed(1)} mm`,
      icon: "🌦️",
    });
  }

  // Wind in 48h
  const maxWind48h = Math.max(...weather.hourly.slice(0, 48).map((h) => h.windSpeed));
  if (maxWind48h > 75) {
    alerts.push({
      type: "wind",
      severity: "rood",
      label: "Storm",
      description: `Windstoten tot ${maxWind48h} km/u verwacht. Blijf binnen indien mogelijk.`,
      value: `${maxWind48h} km/u`,
      icon: "🌪️",
    });
  } else if (maxWind48h > 60) {
    alerts.push({
      type: "wind",
      severity: "oranje",
      label: "Harde wind",
      description: `Wind tot ${maxWind48h} km/u verwacht. Zet losse spullen vast.`,
      value: `${maxWind48h} km/u`,
      icon: "💨",
    });
  } else if (maxWind48h > 40) {
    alerts.push({
      type: "wind",
      severity: "geel",
      label: "Krachtige wind",
      description: `Windsnelheden tot ${maxWind48h} km/u verwacht.`,
      value: `${maxWind48h} km/u`,
      icon: "💨",
    });
  }

  // Temperatuur extremen
  const maxTemp = Math.max(...weather.daily.map((d) => d.tempMax));
  const minTemp = Math.min(...weather.daily.map((d) => d.tempMin));

  if (maxTemp >= 35) {
    alerts.push({
      type: "heat",
      severity: "rood",
      label: "Extreme hitte",
      description: `Temperaturen tot ${maxTemp}°C verwacht. Drink voldoende water en vermijd de zon.`,
      value: `${maxTemp}°C`,
      icon: "🔥",
    });
  } else if (maxTemp >= 30) {
    alerts.push({
      type: "heat",
      severity: "oranje",
      label: "Hitte",
      description: `Het wordt warm: tot ${maxTemp}°C. Smeer je in en zoek schaduw op.`,
      value: `${maxTemp}°C`,
      icon: "☀️",
    });
  }

  if (minTemp < -5) {
    alerts.push({
      type: "frost",
      severity: "rood",
      label: "Strenge vorst",
      description: `Temperaturen tot ${minTemp}°C verwacht. Pas op voor gladheid en bescherm waterleidingen.`,
      value: `${minTemp}°C`,
      icon: "🥶",
    });
  } else if (minTemp < 0) {
    alerts.push({
      type: "frost",
      severity: "oranje",
      label: "Vorst",
      description: `Lichte vorst verwacht: tot ${minTemp}°C. Let op gladde wegen.`,
      value: `${minTemp}°C`,
      icon: "❄️",
    });
  }

  // UV-index
  if (weather.uvIndex > 10) {
    alerts.push({
      type: "uv",
      severity: "rood",
      label: "Extreem hoge UV",
      description: `UV-index ${weather.uvIndex}. Onbeschermde huid verbrandt in minuten.`,
      value: `UV ${weather.uvIndex}`,
      icon: "☀️",
    });
  } else if (weather.uvIndex > 8) {
    alerts.push({
      type: "uv",
      severity: "oranje",
      label: "Hoge UV-index",
      description: `UV-index ${weather.uvIndex}. Smeer in met zonnebrand en draag een hoed.`,
      value: `UV ${weather.uvIndex}`,
      icon: "🧴",
    });
  }

  return alerts;
}

function severityColor(severity: "geel" | "oranje" | "rood") {
  switch (severity) {
    case "rood":
      return { bg: "bg-red-500/15", border: "border-red-400/40", text: "text-red-700", badge: "bg-red-500 text-white" };
    case "oranje":
      return { bg: "bg-orange-500/15", border: "border-orange-400/40", text: "text-orange-700", badge: "bg-orange-500 text-white" };
    case "geel":
      return { bg: "bg-yellow-500/15", border: "border-yellow-400/40", text: "text-yellow-700", badge: "bg-yellow-500 text-white" };
  }
}

function riskMeterLevel(value: number, max: number): number {
  return Math.min(Math.round((value / max) * 100), 100);
}

// ── Static Params ────────────────────────────────────────────

export function generateStaticParams() {
  return DUTCH_CITIES.map((city) => ({
    city: slugify(city.name),
  }));
}

// ── Metadata ─────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: slug } = await params;
  const city = findCity(slug);
  if (!city) return {};

  const title = `Weerwaarschuwing ${city.name} vandaag — WEERZONE`;
  const description = `Actuele weerwaarschuwingen en alerts voor ${city.name}. Wind, neerslag, temperatuur en UV-risico — 48 uur vooruit. KNMI HARMONIE data.`;

  return {
    title,
    description,
    keywords: [
      `weerwaarschuwing ${city.name.toLowerCase()}`,
      `weer alert ${city.name.toLowerCase()}`,
      `${city.name.toLowerCase()} weer vandaag`,
      `storm ${city.name.toLowerCase()}`,
      `regen ${city.name.toLowerCase()}`,
      `weerbericht ${city.name.toLowerCase()}`,
      "weerwaarschuwing nederland",
      "weer alert",
      "weerzone",
    ],
    openGraph: {
      title: `Weerwaarschuwing ${city.name} — WEERZONE`,
      description,
      type: "website",
      locale: "nl_NL",
      url: `https://weerzone.nl/weer/${slug}/alert`,
      siteName: "WEERZONE",
    },
    twitter: {
      card: "summary_large_image",
      title: `Weerwaarschuwing ${city.name} — WEERZONE`,
      description: `Actuele weerwaarschuwingen voor ${city.name}. 48 uur vooruit.`,
    },
    alternates: {
      canonical: `https://weerzone.nl/weer/${slug}/alert`,
    },
  };
}

// ── Page Component ───────────────────────────────────────────

export default async function CityAlertPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: slug } = await params;
  const city = findCity(slug);
  if (!city) notFound();

  let weather: Awaited<ReturnType<typeof fetchWeatherData>>;
  try {
    weather = await fetchWeatherData(city.lat, city.lon);
  } catch {
    // API fout — toon lege pagina ipv crash
    return (
      <main className="min-h-screen p-6 flex items-center justify-center">
        <div className="card p-8 text-center max-w-md">
          <p className="text-4xl mb-4">⏳</p>
          <h1 className="text-xl font-bold text-text-primary mb-2">Weerdata tijdelijk niet beschikbaar</h1>
          <p className="text-sm text-text-secondary">De weerdata voor {city.name} kan momenteel niet worden opgehaald. Probeer het over een paar minuten opnieuw.</p>
          <a href={`/weer/${slug}`} className="btn-cta mt-6 inline-block">Terug naar {city.name}</a>
        </div>
      </main>
    );
  }
  const alerts = determineAlerts(weather);
  const hasAlerts = alerts.length > 0;

  const now = new Date();
  const formattedTime = now.toLocaleString("nl-NL", {
    timeZone: "Europe/Amsterdam",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const beaufort = getWindBeaufort(weather.current.windSpeed);

  // Totale neerslag in 48h
  const totalRain48h = weather.hourly
    .slice(0, 48)
    .reduce((sum, h) => sum + h.precipitation, 0);
  const maxWind48h = Math.max(...weather.hourly.slice(0, 48).map((h) => h.windSpeed));
  const maxTemp = Math.max(...weather.daily.map((d) => d.tempMax));
  const minTemp = Math.min(...weather.daily.map((d) => d.tempMin));

  // Risk meter values (0-100)
  const rainRisk = riskMeterLevel(totalRain48h, 40);
  const windRisk = riskMeterLevel(maxWind48h, 120);
  const tempRisk = maxTemp >= 25
    ? riskMeterLevel(maxTemp - 25, 15)
    : minTemp <= 5
      ? riskMeterLevel(5 - minTemp, 15)
      : 0;
  const uvRisk = riskMeterLevel(weather.uvIndex, 12);

  // 48h hourly outlook (first 12 hours voor compact display)
  const next12h = weather.hourly.slice(0, 12);

  // ── Structured Data (JSON-LD) ──

  const alertJsonLd = hasAlerts
    ? {
        "@context": "https://schema.org",
        "@type": "SpecialAnnouncement",
        name: `Weerwaarschuwing ${city.name}`,
        text: alerts.map((a) => `${a.label}: ${a.description}`).join(" "),
        datePosted: now.toISOString(),
        expires: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
        category: "https://www.wikidata.org/wiki/Q28573",
        spatialCoverage: {
          "@type": "Place",
          name: city.name,
          geo: {
            "@type": "GeoCoordinates",
            latitude: city.lat,
            longitude: city.lon,
          },
          address: {
            "@type": "PostalAddress",
            addressLocality: city.name,
            addressCountry: "NL",
          },
        },
        announcementLocation: {
          "@type": "Place",
          name: city.name,
          address: {
            "@type": "PostalAddress",
            addressLocality: city.name,
            addressCountry: "NL",
          },
        },
      }
    : null;

  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Weerwaarschuwing ${city.name} — WEERZONE`,
    description: `Actuele weerwaarschuwingen voor ${city.name}. 48 uur vooruit met KNMI HARMONIE data.`,
    url: `https://weerzone.nl/weer/${slug}/alert`,
    dateModified: now.toISOString(),
    inLanguage: "nl",
    isPartOf: {
      "@type": "WebSite",
      name: "WEERZONE",
      url: "https://weerzone.nl",
    },
    about: {
      "@type": "City",
      name: city.name,
      containedInPlace: { "@type": "Country", name: "Nederland" },
    },
    provider: {
      "@type": "Organization",
      name: "WEERZONE",
      url: "https://weerzone.nl",
      logo: "https://weerzone.nl/favicon-icon.png",
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "WEERZONE", item: "https://weerzone.nl" },
      { "@type": "ListItem", position: 2, name: "Weer", item: "https://weerzone.nl/weer" },
      { "@type": "ListItem", position: 3, name: city.name, item: `https://weerzone.nl/weer/${slug}` },
      { "@type": "ListItem", position: 4, name: "Waarschuwingen", item: `https://weerzone.nl/weer/${slug}/alert` },
    ],
  };

  // Nearby cities for internal linking
  const nearby = DUTCH_CITIES
    .filter((c) => c.name !== city.name)
    .map((c) => ({
      ...c,
      dist: Math.sqrt(Math.pow(c.lat - city.lat, 2) + Math.pow(c.lon - city.lon, 2)),
    }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 6);

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd).replace(/</g, "\\u003c") }}
      />
      {alertJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(alertJsonLd).replace(/</g, "\\u003c") }}
        />
      )}

      <main className="min-h-screen pb-16">
        {/* ── Header ── */}
        <div className="max-w-2xl mx-auto px-4 pt-8 pb-4">
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-6">
            <a href="/" className="hover:text-white/90 transition-colors">WEERZONE</a>
            <span>/</span>
            <a href={`/weer/${slug}`} className="hover:text-white/90 transition-colors">{city.name}</a>
            <span>/</span>
            <span className="text-white/90">Waarschuwingen</span>
          </nav>

          <h1 className="text-3xl font-extrabold text-white mb-1">
            {hasAlerts ? (
              <>Weerwaarschuwing {city.name}</>
            ) : (
              <>Weerbericht {city.name}</>
            )}
          </h1>
          <p className="text-sm text-white/60">
            Bijgewerkt: {formattedTime} — KNMI HARMONIE
          </p>
        </div>

        <div className="max-w-2xl mx-auto px-4 space-y-4">

          {/* ── Alert Status Banner ── */}
          {hasAlerts ? (
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <span className="text-xl">&#9888;&#65039;</span>
                </div>
                <div>
                  <h2 className="font-bold text-lg text-[var(--text-primary)]">
                    {alerts.length} {alerts.length === 1 ? "waarschuwing" : "waarschuwingen"} actief
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {city.name} — komende 48 uur
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {alerts.map((alert, i) => {
                  const colors = severityColor(alert.severity);
                  return (
                    <div
                      key={i}
                      className={`${colors.bg} border ${colors.border} rounded-xl p-4`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{alert.icon}</span>
                            <span className={`font-bold ${colors.text}`}>{alert.label}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${colors.badge}`}>
                              {alert.severity.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-[var(--text-secondary)]">{alert.description}</p>
                        </div>
                        <div className={`text-right font-mono font-bold text-lg ${colors.text}`}>
                          {alert.value}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="card p-6 text-center">
              <div className="text-4xl mb-3">&#9989;</div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">
                Geen waarschuwingen
              </h2>
              <p className="text-[var(--text-secondary)]">
                Alles rustig in {city.name} — geen bijzonderheden verwacht
              </p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <span>{getWeatherEmoji(weather.current.weatherCode, weather.current.isDay)}</span>
                <span>{weather.current.temperature}°C</span>
                <span className="mx-1">&middot;</span>
                <span>{getWeatherDescription(weather.current.weatherCode)}</span>
              </div>
            </div>
          )}

          {/* ── Huidige condities ── */}
          <div className="card p-5">
            <h2 className="section-title !text-[var(--text-muted)] mb-3">Huidige condities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[var(--bg-secondary)] rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-[var(--text-primary)]">{weather.current.temperature}°</div>
                <div className="text-xs text-[var(--text-muted)]">Temperatuur</div>
                <div className="text-xs text-[var(--text-secondary)]">Voelt als {weather.current.feelsLike}°</div>
              </div>
              <div className="bg-[var(--bg-secondary)] rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-[var(--text-primary)]">{weather.current.windSpeed}</div>
                <div className="text-xs text-[var(--text-muted)]">Wind (km/u)</div>
                <div className="text-xs text-[var(--text-secondary)]">Bft {beaufort.scale} — {beaufort.label}</div>
              </div>
              <div className="bg-[var(--bg-secondary)] rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-[var(--text-primary)]">{weather.current.precipitation}</div>
                <div className="text-xs text-[var(--text-muted)]">Neerslag (mm)</div>
                <div className="text-xs text-[var(--text-secondary)]">{getWeatherDescription(weather.current.weatherCode)}</div>
              </div>
              <div className="bg-[var(--bg-secondary)] rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-[var(--text-primary)]">{weather.uvIndex}</div>
                <div className="text-xs text-[var(--text-muted)]">UV-index</div>
                <div className="text-xs text-[var(--text-secondary)]">
                  {weather.uvIndex <= 2 ? "Laag" : weather.uvIndex <= 5 ? "Matig" : weather.uvIndex <= 7 ? "Hoog" : weather.uvIndex <= 10 ? "Zeer hoog" : "Extreem"}
                </div>
              </div>
            </div>
          </div>

          {/* ── Risicometers ── */}
          <div className="card p-5">
            <h2 className="section-title !text-[var(--text-muted)] mb-4">Risicometers — 48 uur</h2>
            <div className="space-y-4">
              <RiskBar label="Neerslag" value={rainRisk} detail={`${totalRain48h.toFixed(1)} mm totaal`} />
              <RiskBar label="Wind" value={windRisk} detail={`Max ${maxWind48h} km/u`} />
              <RiskBar label="Temperatuur" value={tempRisk} detail={`${minTemp}° tot ${maxTemp}°`} />
              <RiskBar label="UV-straling" value={uvRisk} detail={`Index ${weather.uvIndex}`} />
            </div>
          </div>

          {/* ── 48h Outlook (compact 12h) ── */}
          <div className="card p-5">
            <h2 className="section-title !text-[var(--text-muted)] mb-3">Komende 12 uur</h2>
            <div className="horizontal-scroll no-scrollbar">
              {next12h.map((h, i) => {
                const time = new Date(h.time);
                const hour = time.toLocaleTimeString("nl-NL", {
                  timeZone: "Europe/Amsterdam",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div
                    key={i}
                    className="bg-[var(--bg-secondary)] rounded-xl p-3 text-center min-w-[72px]"
                  >
                    <div className="text-xs text-[var(--text-muted)] mb-1">{hour}</div>
                    <div className="text-lg mb-1">{getWeatherEmoji(h.weatherCode)}</div>
                    <div className="text-sm font-bold text-[var(--text-primary)]">{h.temperature}°</div>
                    {h.precipitation > 0 && (
                      <div className="text-xs text-blue-600 mt-0.5">{h.precipitation.toFixed(1)}mm</div>
                    )}
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">{h.windSpeed} km/u</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Dagverwachting ── */}
          <div className="card p-5">
            <h2 className="section-title !text-[var(--text-muted)] mb-3">Dagverwachting</h2>
            <div className="space-y-2">
              {weather.daily.map((day, i) => {
                const date = new Date(day.date);
                const label = i === 0
                  ? "Vandaag"
                  : date.toLocaleDateString("nl-NL", { timeZone: "Europe/Amsterdam", weekday: "long" });
                return (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-black/5 last:border-0">
                    <div className="w-20 text-sm font-medium text-[var(--text-primary)] capitalize">{label}</div>
                    <div className="text-lg">{getWeatherEmoji(day.weatherCode)}</div>
                    <div className="flex-1 text-sm text-[var(--text-secondary)]">
                      {getWeatherDescription(day.weatherCode)}
                    </div>
                    <div className="text-sm text-[var(--text-muted)]">{day.precipitationSum.toFixed(1)}mm</div>
                    <div className="text-sm font-mono">
                      <span className="text-[var(--text-muted)]">{day.tempMin}°</span>
                      <span className="mx-1 text-[var(--text-muted)]">/</span>
                      <span className="font-bold text-[var(--text-primary)]">{day.tempMax}°</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── CTA: Inbox Alerts ── */}
          <div className="card p-6 text-center">
            <div className="text-3xl mb-2">&#128232;</div>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-1">
              Ontvang alerts in je inbox
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-4 max-w-sm mx-auto">
              Dagelijks 48-uursbericht + waarschuwingen bij extreem weer in {city.name}. Gratis.
            </p>
            <a
              href={`/weer/${slug}#subscribe`}
              className="btn-cta inline-flex"
            >
              Inschrijven voor alerts
            </a>
          </div>

          {/* ── Terug naar dashboard ── */}
          <div className="card p-4">
            <a
              href={`/weer/${slug}`}
              className="flex items-center gap-2 text-[var(--text-primary)] font-medium hover:text-[var(--accent-orange)] transition-colors"
            >
              <span>&larr;</span>
              <span>Volledig weerbericht {city.name}</span>
            </a>
          </div>

          {/* ── Andere steden alerts ── */}
          <div className="card p-5">
            <h2 className="section-title !text-[var(--text-muted)] mb-3">Waarschuwingen bij jou in de buurt</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {nearby.map((c) => (
                <a
                  key={c.name}
                  href={`/weer/${slugify(c.name)}/alert`}
                  className="bg-[var(--bg-secondary)] rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors text-center"
                >
                  {c.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

// ── Risk Bar Component ───────────────────────────────────────

function RiskBar({ label, value, detail }: { label: string; value: number; detail: string }) {
  const color =
    value >= 70 ? "bg-red-500" :
    value >= 40 ? "bg-orange-500" :
    value >= 15 ? "bg-yellow-500" :
    "bg-green-500";

  const riskLabel =
    value >= 70 ? "Hoog" :
    value >= 40 ? "Verhoogd" :
    value >= 15 ? "Matig" :
    "Laag";

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
        <span className="text-xs text-[var(--text-muted)]">{detail}</span>
      </div>
      <div className="score-bar">
        <div
          className={`score-bar-fill ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="text-xs text-[var(--text-secondary)] mt-0.5">{riskLabel} risico</div>
    </div>
  );
}
