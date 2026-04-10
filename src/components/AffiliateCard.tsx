"use client";

import type { WeatherData } from "@/lib/types";
import { amazonUrl, bookingUrl } from "@/lib/affiliates";

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
  products: Product[];
}

// Placeholder images using emoji-based colored gradients
function placeholderImg(emoji: string, hue: number): string {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" rx="16" fill="hsl(${hue},40%,92%)"/><text x="100" y="115" font-size="64" text-anchor="middle">${emoji}</text></svg>`)}`;
}

function getTopProducts(weather: WeatherData): AffiliateSection {
  const temp = weather.current.temperature;
  const rain = weather.current.precipitation > 0 || weather.hourly.some(h => h.precipitation > 0.5);
  const cold = temp < 8;
  const hot = temp > 25;
  const kutWeer = rain || cold || weather.current.windSpeed > 35;

  const hour = new Date().getHours();
  const showBooking = kutWeer ? hour % 3 !== 0 : hour % 4 === 0;

  if (showBooking) {
    return {
      heading: kutWeer ? "Ontsnap aan dit kutweer" : "Weekendje weg?",
      subtitle: "Booking.com",
      products: [
        {
          image: placeholderImg("🏖️", 200),
          title: "Barcelona",
          price: "vanaf €149",
          brand: "Booking.com",
          href: bookingUrl("Barcelona"),
          tag: "Populair",
        },
        {
          image: placeholderImg("🌴", 120),
          title: "Malaga",
          price: "vanaf €179",
          brand: "Booking.com",
          href: bookingUrl("Malaga"),
        },
        {
          image: placeholderImg("☀️", 40),
          title: "Lissabon",
          price: "vanaf €159",
          oldPrice: "€209",
          brand: "Booking.com",
          href: bookingUrl("Lissabon"),
          tag: "Deal",
        },
        {
          image: placeholderImg("🏝️", 170),
          title: "Kreta",
          price: "vanaf €219",
          brand: "Booking.com",
          href: bookingUrl("Kreta"),
        },
        {
          image: placeholderImg("🗼", 280),
          title: "Parijs",
          price: "vanaf €129",
          brand: "Booking.com",
          href: bookingUrl("Parijs"),
          tag: "Citytrip",
        },
      ],
    };
  }

  if (rain) {
    return {
      heading: "Droog blijven vandaag",
      subtitle: "Amazon.nl",
      products: [
        {
          image: placeholderImg("🧥", 210),
          title: "Regenjas waterdicht",
          price: "€49,99",
          oldPrice: "€69,99",
          brand: "Amazon.nl",
          href: amazonUrl("regenjas waterdicht heren dames"),
          tag: "Aanbieding",
        },
        {
          image: placeholderImg("☂️", 240),
          title: "Stormparaplu XL",
          price: "€24,95",
          brand: "Amazon.nl",
          href: amazonUrl("stormparaplu windproof"),
          tag: "Bestseller",
        },
        {
          image: placeholderImg("👢", 30),
          title: "Regenlaarzen",
          price: "€34,99",
          brand: "Amazon.nl",
          href: amazonUrl("regenlaarzen waterdicht"),
        },
        {
          image: placeholderImg("🎒", 190),
          title: "Waterdichte rugzak",
          price: "€39,95",
          brand: "Amazon.nl",
          href: amazonUrl("waterdichte rugzak"),
        },
      ],
    };
  }

  if (cold) {
    return {
      heading: "Warm blijven",
      subtitle: "Amazon.nl",
      products: [
        {
          image: placeholderImg("🧣", 0),
          title: "Merino sjaal",
          price: "€29,95",
          brand: "Amazon.nl",
          href: amazonUrl("merino wol sjaal"),
        },
        {
          image: placeholderImg("🧤", 340),
          title: "Thermo handschoenen",
          price: "€19,99",
          oldPrice: "€27,99",
          brand: "Amazon.nl",
          href: amazonUrl("thermo handschoenen touchscreen"),
          tag: "Aanbieding",
        },
        {
          image: placeholderImg("🧥", 20),
          title: "Winterjas",
          price: "€89,95",
          brand: "Amazon.nl",
          href: amazonUrl("winterjas heren warm"),
          tag: "Bestseller",
        },
        {
          image: placeholderImg("☕", 30),
          title: "Thermosfles 500ml",
          price: "€22,50",
          brand: "Amazon.nl",
          href: amazonUrl("thermosfles 500ml"),
        },
      ],
    };
  }

  if (hot) {
    return {
      heading: `UV ${weather.uvIndex.toFixed(0)} — bescherm jezelf`,
      subtitle: "Amazon.nl",
      products: [
        {
          image: placeholderImg("🧴", 40),
          title: "Zonnebrand SPF50",
          price: "€12,99",
          brand: "Amazon.nl",
          href: amazonUrl("zonnebrand spf50"),
          tag: "Noodzaak",
        },
        {
          image: placeholderImg("😎", 200),
          title: "Polaroid zonnebril",
          price: "€34,95",
          oldPrice: "€49,95",
          brand: "Amazon.nl",
          href: amazonUrl("polaroid zonnebril gepolariseerd"),
          tag: "Deal",
        },
        {
          image: placeholderImg("🌀", 180),
          title: "Tafelventilator",
          price: "€29,99",
          brand: "Amazon.nl",
          href: amazonUrl("tafelventilator stil"),
        },
        {
          image: placeholderImg("🧊", 210),
          title: "Koelbox 24L",
          price: "€44,95",
          brand: "Amazon.nl",
          href: amazonUrl("koelbox 24 liter"),
        },
      ],
    };
  }

  return {
    heading: "Lekker weer? Naar buiten!",
    subtitle: "Amazon.nl",
    products: [
      {
        image: placeholderImg("🚴", 150),
        title: "Fietslamp set LED",
        price: "€14,95",
        brand: "Amazon.nl",
        href: amazonUrl("fietslamp set led oplaadbaar"),
        tag: "Populair",
      },
      {
        image: placeholderImg("🎒", 120),
        title: "Dagrugzak 20L",
        price: "€29,99",
        oldPrice: "€39,99",
        brand: "Amazon.nl",
        href: amazonUrl("dagrugzak 20 liter"),
        tag: "Aanbieding",
      },
      {
        image: placeholderImg("⚽", 100),
        title: "Buitenspeelgoed",
        price: "vanaf €9,99",
        brand: "Amazon.nl",
        href: amazonUrl("buitenspeelgoed kinderen"),
      },
      {
        image: placeholderImg("🪑", 40),
        title: "Tuinstoel opvouwbaar",
        price: "€24,95",
        brand: "Amazon.nl",
        href: amazonUrl("tuinstoel opvouwbaar"),
      },
    ],
  };
}

function getBottomProducts(weather: WeatherData): AffiliateSection {
  const temp = weather.current.temperature;
  const rain = weather.current.precipitation > 0 || weather.hourly.some(h => h.precipitation > 0.5);
  const cold = temp < 10;
  const kutWeer = rain || cold || weather.current.windSpeed > 35;

  if (kutWeer) {
    return {
      heading: "Binnen blijven = investeren in comfort",
      subtitle: "Amazon.nl",
      products: [
        {
          image: placeholderImg("🛋️", 30),
          title: "Fleece deken XL",
          price: "€19,99",
          brand: "Amazon.nl",
          href: amazonUrl("fleece deken groot warm"),
          tag: "Favoriet",
        },
        {
          image: placeholderImg("☕", 15),
          title: "Nespresso cups",
          price: "€24,99",
          brand: "Amazon.nl",
          href: amazonUrl("nespresso capsules compatible"),
        },
        {
          image: placeholderImg("🕯️", 40),
          title: "Geurkaarsen set",
          price: "€16,95",
          brand: "Amazon.nl",
          href: amazonUrl("geurkaarsen set soja"),
          tag: "Populair",
        },
        {
          image: placeholderImg("🎮", 260),
          title: "Nintendo Switch game",
          price: "vanaf €39,99",
          brand: "Amazon.nl",
          href: amazonUrl("nintendo switch games"),
        },
        {
          image: placeholderImg("📖", 350),
          title: "Kindle Paperwhite",
          price: "€149,99",
          brand: "Amazon.nl",
          href: amazonUrl("kindle paperwhite"),
          tag: "Bestseller",
        },
      ],
    };
  }

  const hour = new Date().getHours();
  if (hour % 2 === 0) {
    return {
      heading: "BBQ-weer!",
      subtitle: "Amazon.nl",
      products: [
        {
          image: placeholderImg("🔥", 15),
          title: "Houtskool BBQ",
          price: "€49,99",
          oldPrice: "€69,99",
          brand: "Amazon.nl",
          href: amazonUrl("houtskool bbq"),
          tag: "Deal",
        },
        {
          image: placeholderImg("🥩", 0),
          title: "BBQ gereedschap set",
          price: "€24,95",
          brand: "Amazon.nl",
          href: amazonUrl("bbq gereedschap set rvs"),
        },
        {
          image: placeholderImg("💡", 50),
          title: "Tuinverlichting LED",
          price: "€19,99",
          brand: "Amazon.nl",
          href: amazonUrl("tuinverlichting led solar"),
        },
        {
          image: placeholderImg("🪑", 40),
          title: "Loungestoel tuin",
          price: "€79,95",
          brand: "Amazon.nl",
          href: amazonUrl("loungestoel tuin opvouwbaar"),
          tag: "Populair",
        },
      ],
    };
  }

  return {
    heading: "Slimme weermeters",
    subtitle: "Amazon.nl",
    products: [
      {
        image: placeholderImg("📱", 220),
        title: "Netatmo weerstation",
        price: "€149,99",
        oldPrice: "€189,99",
        brand: "Amazon.nl",
        href: amazonUrl("netatmo weerstation wifi"),
        tag: "Tip",
      },
      {
        image: placeholderImg("🌡️", 0),
        title: "Buiten thermometer",
        price: "€12,95",
        brand: "Amazon.nl",
        href: amazonUrl("buitenthermometer digitaal"),
      },
      {
        image: placeholderImg("💨", 200),
        title: "Windmeter digitaal",
        price: "€34,95",
        brand: "Amazon.nl",
        href: amazonUrl("anemometer windmeter digitaal"),
      },
      {
        image: placeholderImg("🌧️", 210),
        title: "Regenmeter tuin",
        price: "€8,99",
        brand: "Amazon.nl",
        href: amazonUrl("regenmeter tuin"),
        tag: "Bestseller",
      },
    ],
  };
}

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
          className="w-full h-full object-cover group-hover/product:scale-105 transition-transform duration-300"
        />
        {product.tag && (
          <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wide bg-accent-orange text-text-primary px-2 py-0.5 rounded-full">
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

export default function AffiliateCard({ variant, weather }: Props) {
  const section = variant === "top" ? getTopProducts(weather) : getBottomProducts(weather);

  return (
    <div className="card p-5 overflow-hidden relative">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-text-primary">{section.heading}</h4>
          <span className="text-[10px] text-text-muted">{section.subtitle}</span>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wider text-accent-orange/70 bg-accent-orange/10 px-2 py-0.5 rounded-full">Advertentie</span>
      </div>
      <div className="horizontal-scroll no-scrollbar gap-3">
        {section.products.map((product, i) => (
          <ProductCard key={`${product.title}-${i}`} product={product} />
        ))}
      </div>
    </div>
  );
}
