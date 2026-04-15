"use client";

import type { WeatherData } from "@/lib/types";
import { amazonUrl, amazonProductUrl, bookingUrl } from "@/lib/affiliates";

interface Props {
  variant: "top" | "bottom";
  weather: WeatherData;
}

interface Product {
  image: string;
  title: string;
  price: string;
  oldPrice?: string;
  brand: string;
  href: string;
  tag?: string;
}

interface AffiliateSection {
  heading: string;
  subtitle: string;
  context?: string;
  products: Product[];
}

// ============================================================
// 48-uurs analyse: bepaal het weer-scenario
// ============================================================

type WeatherScenario =
  | "rain_now"        // het regent NU
  | "rain_coming"     // droog nu maar regen in de komende 48u
  | "cold_snap"       // kou < 5°C in 48u
  | "freezing"        // vrieskou < 0°C
  | "heatwave"        // > 28°C
  | "warm"            // 22-28°C, lekker weer
  | "windy"           // > 40 km/h
  | "mixed"           // wisselvallig
  | "perfect";        // droog, 15-25°C, weinig wind

function analyze48h(w: WeatherData): {
  scenario: WeatherScenario;
  rainTotal48h: number;
  rainHoursCount: number;
  tempMin48h: number;
  tempMax48h: number;
  windMax48h: number;
  tomorrowRain: number;
  tomorrowTempMax: number;
} {
  const rainTotal48h = w.daily[0].precipitationSum + (w.daily[1]?.precipitationSum ?? 0);
  const rainHoursCount = w.hourly.filter(h => h.precipitation > 0.3).length;
  const tempMin48h = Math.min(w.daily[0].tempMin, w.daily[1]?.tempMin ?? w.daily[0].tempMin);
  const tempMax48h = Math.max(w.daily[0].tempMax, w.daily[1]?.tempMax ?? w.daily[0].tempMax);
  const windMax48h = Math.max(w.daily[0].windSpeedMax, w.daily[1]?.windSpeedMax ?? 0);
  const tomorrowRain = w.daily[1]?.precipitationSum ?? 0;
  const tomorrowTempMax = w.daily[1]?.tempMax ?? w.daily[0].tempMax;

  const isRainingNow = w.current.precipitation > 0;
  const rainComing = w.hourly.some(h => h.precipitation > 0.5);

  let scenario: WeatherScenario;

  if (isRainingNow) scenario = "rain_now";
  else if (tempMin48h <= 0) scenario = "freezing";
  else if (tempMax48h >= 28) scenario = "heatwave";
  else if (windMax48h >= 40) scenario = "windy";
  else if (tempMin48h < 5) scenario = "cold_snap";
  else if (rainComing || rainTotal48h > 2) scenario = "rain_coming";
  else if (tempMax48h >= 22 && rainTotal48h < 1) scenario = "warm";
  else if (rainTotal48h < 1 && tempMax48h >= 15 && windMax48h < 25) scenario = "perfect";
  else scenario = "mixed";

  return { scenario, rainTotal48h, rainHoursCount, tempMin48h, tempMax48h, windMax48h, tomorrowRain, tomorrowTempMax };
}

// ============================================================
// Product selecties — dynamisch op basis van 48-uurs scenario
// ============================================================

function getTopProducts(weather: WeatherData): AffiliateSection {
  const a = analyze48h(weather);

  switch (a.scenario) {
    case "rain_now":
      return {
        heading: "Het regent. Fix dit.",
        subtitle: "Amazon.nl",
        context: `${a.rainTotal48h.toFixed(0)}mm verwacht in 48 uur — ${a.rainHoursCount} uur regen.`,
        products: [
          {
            image: "https://m.media-amazon.com/images/I/71W-kisuJRL._AC_UL320_.jpg",
            title: "Regenjas waterdicht - ademend",
            price: "€49,99",
            oldPrice: "€69,99",
            brand: "Amazon.nl",
            href: amazonProductUrl("B0DLH9WJSG"),
            tag: "Bestseller",
          },
          {
            image: "https://m.media-amazon.com/images/I/61zPZGagoSL._AC_UL320_.jpg",
            title: "Senz stormparaplu - windproof",
            price: "€29,95",
            brand: "Amazon.nl",
            href: amazonProductUrl("B07B8K47M2"),
            tag: "Anti-storm",
          },
          {
            image: "https://m.media-amazon.com/images/I/61UyCrdDDbL._AC_UL320_.jpg",
            title: "Waterdichte rugzakhoes",
            price: "€12,99",
            brand: "Amazon.nl",
            href: amazonProductUrl("B0DSW35M7D"),
          },
          {
            image: "https://m.media-amazon.com/images/I/61s-mziLtbL._AC_UL320_.jpg",
            title: "Regenbroek - lichtgewicht",
            price: "€24,95",
            brand: "Amazon.nl",
            href: amazonProductUrl("B07PR5MKXG"),
          },
          {
            image: "https://m.media-amazon.com/images/I/81ANlZ-MJpL._AC_UL320_.jpg",
            title: "Waterdichte schoenen",
            price: "€39,99",
            oldPrice: "€54,99",
            brand: "Amazon.nl",
            href: amazonProductUrl("B0D9453XYS"),
            tag: "Deal",
          },
        ],
      };

    case "rain_coming":
      return {
        heading: a.tomorrowRain > 5
          ? `Morgen ${a.tomorrowRain.toFixed(0)}mm regen — wees voorbereid`
          : `Regen op komst — ${a.rainTotal48h.toFixed(0)}mm in 48 uur`,
        subtitle: "Amazon.nl",
        context: `Nu droog, maar ${a.rainHoursCount} uur regen verwacht. Paraplu is geen suggestie.`,
        products: [
          {
            image: "https://m.media-amazon.com/images/I/61zPZGagoSL._AC_UL320_.jpg",
            title: "Stormparaplu - automatisch",
            price: "€24,95",
            brand: "Amazon.nl",
            href: amazonProductUrl("B07B8K47M2"),
            tag: "Tip",
          },
          {
            image: "https://m.media-amazon.com/images/I/71+uj3auIcL._AC_UL320_.jpg",
            title: "Regenponcho opvouwbaar",
            price: "€14,99",
            brand: "Amazon.nl",
            href: amazonProductUrl("B0DJ3HH547"),
          },
          {
            image: "https://m.media-amazon.com/images/I/71bFPcvpiML._AC_UL320_.jpg",
            title: "Regenoverschoenen",
            price: "€16,99",
            brand: "Amazon.nl",
            href: amazonProductUrl("B0GGJFDQ8P"),
            tag: "Handig",
          },
          {
            image: "https://m.media-amazon.com/images/I/71nhK6H8CrL._AC_UL320_.jpg",
            title: "Droogrek opvouwbaar",
            price: "€29,95",
            brand: "Amazon.nl",
            href: amazonProductUrl("B0CBRN1ZJS"),
          },
        ],
      };

    case "freezing":
      return {
        heading: `${a.tempMin48h}° verwacht — alles bevriest`,
        subtitle: "Amazon.nl",
        context: "Ijskrabber klaarzetten. Leidingen beschermen. Overleven.",
        products: [
          {
            image: "https://m.media-amazon.com/images/I/61m1v4fm5wL._AC_UL320_.jpg",
            title: "Thermo ondergoed set",
            price: "€29,99",
            oldPrice: "€39,99",
            brand: "Amazon.nl",
            href: amazonProductUrl("B0DB2TYZ3W"),
            tag: "Must-have",
          },
          {
            image: "https://m.media-amazon.com/images/I/61B7yOCdstL._AC_UL320_.jpg",
            title: "Winterjas warm - waterdicht",
            price: "€89,99",
            brand: "Amazon.nl",
            href: amazonProductUrl("B0836GND15"),
            tag: "Bestseller",
          },
          {
            image: "https://m.media-amazon.com/images/I/81IIiWXos2L._AC_UL320_.jpg",
            title: "Touchscreen handschoenen",
            price: "€14,99",
            brand: "Amazon.nl",
            href: amazonProductUrl("B0BTPSMVYL"),
          },
          {
            image: "https://m.media-amazon.com/images/I/71Zccm+HmPL._AC_UL320_.jpg",
            title: "Ijskrabber met handschoen",
            price: "€9,99",
            brand: "Amazon.nl",
            href: amazonProductUrl("B09QGWXRY9"),
            tag: "€9,99",
          },
        ],
      };

    case "cold_snap":
      return {
        heading: `Koud weekend: ${a.tempMin48h}° tot ${a.tempMax48h}°`,
        subtitle: "Amazon.nl",
        context: "Laagjes zijn je vriend. Liever te warm dan te koud.",
        products: [
          {
            image: "https://m.media-amazon.com/images/I/61m1v4fm5wL._AC_UL320_.jpg",
            title: "Fleece vest - lichtgewicht",
            price: "€24,99",
            brand: "Amazon.nl",
            href: amazonProductUrl("B0DB2TYZ3W"),
            tag: "Populair",
          },
          {
            image: "https://m.media-amazon.com/images/I/61B7yOCdstL._AC_UL320_.jpg",
            title: "Merino sjaal wol",
            price: "€19,95",
            brand: "Amazon.nl",
            href: amazonProductUrl("B0836GND15"),
          },
          {
            image: "https://m.media-amazon.com/images/I/61B7yOCdstL._AC_UL320_.jpg",
            title: "Softshell jas - wind + water",
            price: "€49,99",
            oldPrice: "€64,99",
            brand: "Amazon.nl",
            href: amazonProductUrl("B0836GND15"),
            tag: "Deal",
          },
          {
            image: "https://m.media-amazon.com/images/I/41Hyv0IGKpL._AC_UL320_.jpg",
            title: "Thermosfles 500ml",
            price: "€22,50",
            brand: "Amazon.nl",
            href: amazonProductUrl("B092W7W5BB"),
          },
        ],
      };

    case "heatwave":
      return {
        heading: `${a.tempMax48h}° op komst — bescherm jezelf`,
        subtitle: "Amazon.nl",
        context: `UV-index ${weather.uvIndex.toFixed(0)}. Niet smeren = verbranden. Punt.`,
        products: [
          {
            image: "https://m.media-amazon.com/images/I/714aS4VLtjL._AC_UL320_.jpg",
            title: "Zonnebrand SPF 50+",
            price: "€12,99",
            brand: "Amazon.nl",
            href: amazonUrl("zonnebrand spf 50 waterproof"),
            tag: "Noodzaak",
          },
          {
            image: "https://m.media-amazon.com/images/I/71Zccm+HmPL._AC_UL320_.jpg",
            title: "Gepolariseerde zonnebril",
            price: "€24,95",
            oldPrice: "€39,95",
            brand: "Amazon.nl",
            href: amazonUrl("zonnebril gepolariseerd UV400"),
            tag: "Deal",
          },
          {
            image: "https://m.media-amazon.com/images/I/71nhK6H8CrL._AC_UL320_.jpg",
            title: "Tafelventilator - stil",
            price: "€29,99",
            brand: "Amazon.nl",
            href: amazonProductUrl("B0CBRN1ZJS"),
          },
          {
            image: "https://m.media-amazon.com/images/I/71tONXZG4VL._AC_UL320_.jpg",
            title: "Koelbox 24L - isolatie",
            price: "€34,95",
            brand: "Amazon.nl",
            href: amazonProductUrl("B0GLFFKWT4"),
          },
          {
            image: "https://m.media-amazon.com/images/I/41Hyv0IGKpL._AC_UL320_.jpg",
            title: "Waterfles 1L - koel houden",
            price: "€16,99",
            brand: "Amazon.nl",
            href: amazonProductUrl("B092W7W5BB"),
            tag: "Populair",
          },
        ],
      };

    case "windy":
      return {
        heading: `Wind tot ${a.windMax48h} km/h — hou je vast`,
        subtitle: "Amazon.nl",
        context: "Paraplu is zinloos. Investeer in winddicht materiaal.",
        products: [
          {
            image: "https://m.media-amazon.com/images/I/71W-kisuJRL._AC_UL320_.jpg",
            title: "Windbreaker jas",
            price: "€34,99",
            brand: "Amazon.nl",
            href: amazonProductUrl("B0DLH9WJSG"),
            tag: "Tip",
          },
          {
            image: "https://m.media-amazon.com/images/I/61zPZGagoSL._AC_UL320_.jpg",
            title: "Senz stormparaplu",
            price: "€29,95",
            brand: "Amazon.nl",
            href: amazonProductUrl("B07B8K47M2"),
            tag: "Anti-storm",
          },
          {
            image: "https://m.media-amazon.com/images/I/61m1v4fm5wL._AC_UL320_.jpg",
            title: "Buff nekwarmer",
            price: "€19,95",
            brand: "Amazon.nl",
            href: amazonProductUrl("B0DB2TYZ3W"),
          },
        ],
      };

    case "warm":
    case "perfect":
      return {
        heading: a.scenario === "perfect"
          ? "Prachtweer. Naar buiten. Nu."
          : `${a.tempMax48h}° — zomergevoel`,
        subtitle: "Amazon.nl",
        context: a.scenario === "perfect"
          ? "Dit duurt niet lang in Nederland. Grijp je kans."
          : "Eindelijk normaal weer. Geniet ervan.",
        products: [
          {
            image: "https://m.media-amazon.com/images/I/51bsMEFTW4L._AC_UL320_.jpg",
            title: "Zonnebrand SPF 50",
            price: "€12,99",
            brand: "Amazon.nl",
            href: amazonProductUrl("B089HCHSTW"),
            tag: "Noodzaak",
          },
          {
            image: "https://m.media-amazon.com/images/I/51aEl9Xe44L._AC_UL320_.jpg",
            title: "Zonnebril UV400",
            price: "€19,95",
            brand: "Amazon.nl",
            href: amazonProductUrl("B01N42F0T1"),
          },
          {
            image: "https://m.media-amazon.com/images/I/71tONXZG4VL._AC_UL320_.jpg",
            title: "Picknickdeken waterdicht",
            price: "€24,99",
            brand: "Amazon.nl",
            href: amazonProductUrl("B0GLFFKWT4"),
            tag: "Populair",
          },
          {
            image: "https://m.media-amazon.com/images/I/41Hyv0IGKpL._AC_UL320_.jpg",
            title: "Waterfles sport 750ml",
            price: "€14,99",
            brand: "Amazon.nl",
            href: amazonProductUrl("B092W7W5BB"),
          },
        ],
      };

    default: // mixed
      return {
        heading: "Wisselvallig weer — voor alles voorbereid",
        subtitle: "Amazon.nl",
        context: `${a.tempMin48h}° tot ${a.tempMax48h}°, ${a.rainTotal48h > 0 ? a.rainTotal48h.toFixed(0) + 'mm regen' : 'wisselend bewolkt'}.`,
        products: [
          {
            image: "https://m.media-amazon.com/images/I/71W-kisuJRL._AC_UL320_.jpg",
            title: "3-in-1 jas - alle weersomstandigheden",
            price: "€59,99",
            oldPrice: "€79,99",
            brand: "Amazon.nl",
            href: amazonProductUrl("B0DLH9WJSG"),
            tag: "Alleskunner",
          },
          {
            image: "https://m.media-amazon.com/images/I/61zPZGagoSL._AC_UL320_.jpg",
            title: "Compacte paraplu",
            price: "€14,99",
            brand: "Amazon.nl",
            href: amazonProductUrl("B07B8K47M2"),
          },
          {
            image: "https://m.media-amazon.com/images/I/61m1v4fm5wL._AC_UL320_.jpg",
            title: "Lichte fleece - laagjes",
            price: "€22,99",
            brand: "Amazon.nl",
            href: amazonProductUrl("B0DB2TYZ3W"),
            tag: "Tip",
          },
        ],
      };
  }
}

function getBottomProducts(weather: WeatherData): AffiliateSection {
  const a = analyze48h(weather);
  const month = new Date().getMonth(); // 0-11
  const isWinter = month <= 1 || month >= 10; // nov-feb
  const isSummer = month >= 4 && month <= 8; // mei-sep
  const isRukWeer = a.scenario === "rain_now" || a.scenario === "rain_coming" || a.scenario === "cold_snap" || a.scenario === "freezing" || a.scenario === "windy";

  // ===== MOOI WEER: Dagjes uit in Nederland =====
  if (!isRukWeer && (a.scenario === "warm" || a.scenario === "perfect" || a.scenario === "heatwave")) {
    return {
      heading: a.scenario === "heatwave"
        ? `${a.tempMax48h}° — dagje strand of bos?`
        : "Prachtig weer — ga eropuit in Nederland",
      subtitle: "Booking.com",
      context: isSummer
        ? "Dit soort weer duurt niet lang. Grijp het. Nu."
        : "Onverwacht mooi weer? Pak je kans voor een dagje weg.",
      products: [
        {
          image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop",
          title: "Strandhuisje Zeeland",
          price: "vanaf €89",
          brand: "Booking.com",
          href: bookingUrl("Zeeland strand"),
          tag: `${a.tempMax48h}° & zon`,
        },
        {
          image: "https://images.unsplash.com/photo-1476231682828-37e571bc172f?w=400&h=400&fit=crop",
          title: "Bungalow Veluwe",
          price: "vanaf €79",
          brand: "Booking.com",
          href: bookingUrl("Veluwe bungalow"),
          tag: "Natuur",
        },
        {
          image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=400&fit=crop",
          title: "B&B Texel",
          price: "vanaf €99",
          brand: "Booking.com",
          href: bookingUrl("Texel"),
          tag: "Eilandgevoel",
        },
        {
          image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=400&fit=crop",
          title: "Hotel Maastricht",
          price: "vanaf €69",
          brand: "Booking.com",
          href: bookingUrl("Maastricht hotel"),
          tag: "Citytrip",
        },
        {
          image: "https://images.unsplash.com/photo-1543489822-c49534f3271f?w=400&h=400&fit=crop",
          title: "Glamping Drenthe",
          price: "vanaf €59",
          brand: "Booking.com",
          href: bookingUrl("Drenthe glamping"),
          tag: "Uniek",
        },
      ],
    };
  }

  // ===== SLECHT WEER + WINTER: Vluchten naar de zon =====
  if (isRukWeer && (isWinter || a.tempMax48h < 10)) {
    return {
      heading: a.scenario === "freezing"
        ? `${a.tempMin48h}° hier, 25°+ daar — jij kiest`
        : `${a.rainTotal48h > 0 ? a.rainTotal48h.toFixed(0) + "mm regen" : "Grijs en koud"} — vluchten naar de zon`,
      subtitle: "Booking.com",
      context: "Terwijl Nederland grijs is, schijnt de zon ergens anders wél.",
      products: [
        {
          image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&h=400&fit=crop",
          title: "Barcelona",
          price: "vanaf €149",
          brand: "Booking.com",
          href: bookingUrl("Barcelona"),
          tag: "23° & zon",
        },
        {
          image: "https://images.unsplash.com/photo-1534008897995-27a23e859048?w=400&h=400&fit=crop",
          title: "Malaga",
          price: "vanaf €169",
          brand: "Booking.com",
          href: bookingUrl("Malaga"),
          tag: "26° & strand",
        },
        {
          image: "https://images.unsplash.com/photo-1585218356057-062e5b7fb60f?w=400&h=400&fit=crop",
          title: "Lissabon",
          price: "vanaf €139",
          oldPrice: "€199",
          brand: "Booking.com",
          href: bookingUrl("Lissabon"),
          tag: "Deal",
        },
        {
          image: "https://images.unsplash.com/photo-1605553556093-9c98a5d3f23a?w=400&h=400&fit=crop",
          title: "Kreta",
          price: "vanaf €219",
          brand: "Booking.com",
          href: bookingUrl("Kreta Griekenland"),
          tag: "28° & strand",
        },
        {
          image: "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=400&h=400&fit=crop",
          title: "Marrakech",
          price: "vanaf €129",
          brand: "Booking.com",
          href: bookingUrl("Marrakech"),
          tag: "30° & cultuur",
        },
      ],
    };
  }

  // ===== SLECHT WEER MAAR NIET WINTER: Indoor dagjes uit + citytrips =====
  if (isRukWeer) {
    return {
      heading: a.scenario === "rain_now"
        ? `Het regent — indoor dagje uit of citytrip?`
        : `Regenachtige 48 uur — tijd voor een plan B`,
      subtitle: "Booking.com",
      context: `${a.rainTotal48h > 0 ? a.rainTotal48h.toFixed(0) + "mm verwacht. " : ""}Niet zeuren, maar slim plannen.`,
      products: [
        {
          image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=400&fit=crop",
          title: "Parijs",
          price: "vanaf €119",
          brand: "Booking.com",
          href: bookingUrl("Parijs"),
          tag: "Citytrip",
        },
        {
          image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=400&fit=crop",
          title: "Spa & Wellness hotel",
          price: "vanaf €89",
          brand: "Booking.com",
          href: bookingUrl("spa wellness Nederland"),
          tag: "Ontspannen",
        },
        {
          image: "https://images.unsplash.com/photo-1555992336-fb0d29498b13?w=400&h=400&fit=crop",
          title: "Antwerpen",
          price: "vanaf €79",
          brand: "Booking.com",
          href: bookingUrl("Antwerpen hotel"),
          tag: "Citytrip",
        },
        {
          image: "https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=400&h=400&fit=crop",
          title: "Brugge",
          price: "vanaf €99",
          brand: "Booking.com",
          href: bookingUrl("Brugge"),
          tag: "Romantisch",
        },
        {
          image: "https://images.unsplash.com/photo-1543489822-c49534f3271f?w=400&h=400&fit=crop",
          title: "Thermen & baden",
          price: "vanaf €49",
          brand: "Booking.com",
          href: bookingUrl("thermen Nederland"),
          tag: "Indoor",
        },
      ],
    };
  }

  // ===== DEFAULT: wisselvallig weer — mix van Amazon + activiteiten =====
  return {
    heading: "Weer-nerd? Check deze gadgets.",
    subtitle: "Amazon.nl",
    context: "Zelf meten is altijd beter dan Buienradar vertrouwen.",
    products: [
      {
        image: "https://m.media-amazon.com/images/I/71tONXZG4VL._AC_UL320_.jpg",
        title: "Netatmo Weerstation WiFi",
        price: "€149,99",
        oldPrice: "€189,99",
        brand: "Amazon.nl",
        href: amazonProductUrl("B0GLFFKWT4"),
        tag: "Top product",
      },
      {
        image: "https://m.media-amazon.com/images/I/71nhK6H8CrL._AC_UL320_.jpg",
        title: "Digitale buitenthermometer",
        price: "€14,95",
        brand: "Amazon.nl",
        href: amazonProductUrl("B0CBRN1ZJS"),
      },
      {
        image: "https://m.media-amazon.com/images/I/71tONXZG4VL._AC_UL320_.jpg",
        title: "Regenmeter tuin",
        price: "€8,99",
        brand: "Amazon.nl",
        href: amazonProductUrl("B0GLFFKWT4"),
        tag: "Bestseller",
      },
      {
        image: "https://images.unsplash.com/photo-1580302302824-34ba85c4939b?w=400&h=400&fit=crop",
        title: "Fleece deken bank XL",
        price: "€19,99",
        brand: "Amazon.nl",
        href: amazonUrl("fleece deken groot bank warm"),
        tag: "Favoriet",
      },
    ],
  };
}

// ============================================================
// Product Card component
// ============================================================

function ProductCard({ product }: { product: Product }) {
  return (
    <a
      href={product.href}
      className="shrink-0 w-[140px] group/product cursor-pointer"
      target="_blank"
      rel="noopener noreferrer sponsored"
    >
      <div className="relative w-[140px] h-[140px] rounded-2xl overflow-hidden bg-black/[0.03] mb-2">
        <img
          src={product.image}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover/product:scale-105 transition-transform duration-300"
        referrerPolicy="no-referrer" />
        {product.tag && (
          <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wide bg-accent-orange text-text-primary px-2 py-0.5 rounded-full shadow-sm">
            {product.tag}
          </span>
        )}
      </div>
      <div className="text-xs font-bold text-text-primary leading-tight line-clamp-2 group-hover/product:text-accent-orange transition-colors">
        {product.title}
      </div>
      <div className="flex items-center gap-1.5 mt-1">
        <span className="text-sm font-black text-text-primary">{product.price}</span>
        {product.oldPrice && (
          <span className="text-[10px] text-text-muted line-through">{product.oldPrice}</span>
        )}
      </div>
    </a>
  );
}

// ============================================================
// Main AffiliateCard component
// ============================================================

export default function AffiliateCard({ variant, weather }: Props) {
  const section = variant === "top" ? getTopProducts(weather) : getBottomProducts(weather);

  return (
    <div className="rounded-2xl overflow-hidden relative" style={{ background: "linear-gradient(135deg, rgba(255,229,0,0.08) 0%, rgba(255,255,255,0.85) 60%)", border: "1px solid rgba(255,229,0,0.3)", backdropFilter: "blur(12px)" }}>
      {/* Header stripe */}
      <div className="px-5 pt-4 pb-3 border-b border-black/[0.06]">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="text-[15px] font-black text-text-primary break-words leading-snug">{section.heading}</h4>
            {section.context && (
              <p className="text-xs text-text-secondary mt-0.5 leading-snug">{section.context}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-[9px] font-bold uppercase tracking-wider text-accent-orange bg-accent-orange/15 px-2 py-0.5 rounded-full">Advertentie</span>
            <span className="text-[9px] text-text-muted">{section.subtitle}</span>
          </div>
        </div>
      </div>
      {/* Products scroll */}
      <div className="px-5 py-4">
        <div className="horizontal-scroll no-scrollbar gap-3">
          {section.products.map((product, i) => (
            <ProductCard key={`${product.title}-${i}`} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
