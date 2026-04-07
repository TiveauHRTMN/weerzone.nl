"use client";

import type { WeatherData } from "@/lib/types";

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
// Replace with real product image URLs when affiliate accounts are set up
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
          href: "#booking-barcelona",
          tag: "Populair",
        },
        {
          image: placeholderImg("🌴", 120),
          title: "Malaga",
          price: "vanaf €179",
          brand: "Booking.com",
          href: "#booking-malaga",
        },
        {
          image: placeholderImg("☀️", 40),
          title: "Lissabon",
          price: "vanaf €159",
          oldPrice: "€209",
          brand: "Booking.com",
          href: "#booking-lissabon",
          tag: "Deal",
        },
        {
          image: placeholderImg("🏝️", 170),
          title: "Kreta",
          price: "vanaf €219",
          brand: "Booking.com",
          href: "#booking-kreta",
        },
        {
          image: placeholderImg("🗼", 280),
          title: "Parijs",
          price: "vanaf €129",
          brand: "Booking.com",
          href: "#booking-parijs",
          tag: "Citytrip",
        },
      ],
    };
  }

  if (rain) {
    return {
      heading: "Droog blijven vandaag",
      subtitle: "Bol.com",
      products: [
        {
          image: placeholderImg("🧥", 210),
          title: "Regenjas waterdicht",
          price: "€49,99",
          oldPrice: "€69,99",
          brand: "Bol.com",
          href: "#bol-regenjas",
          tag: "Aanbieding",
        },
        {
          image: placeholderImg("☂️", 240),
          title: "Stormparaplu XL",
          price: "€24,95",
          brand: "Bol.com",
          href: "#bol-paraplu",
          tag: "Bestseller",
        },
        {
          image: placeholderImg("👢", 30),
          title: "Regenlaarzen",
          price: "€34,99",
          brand: "Bol.com",
          href: "#bol-laarzen",
        },
        {
          image: placeholderImg("🎒", 190),
          title: "Waterdichte rugzak",
          price: "€39,95",
          brand: "Bol.com",
          href: "#bol-rugzak",
        },
      ],
    };
  }

  if (cold) {
    return {
      heading: "Warm blijven",
      subtitle: "Bol.com",
      products: [
        {
          image: placeholderImg("🧣", 0),
          title: "Merino sjaal",
          price: "€29,95",
          brand: "Bol.com",
          href: "#bol-sjaal",
        },
        {
          image: placeholderImg("🧤", 340),
          title: "Thermo handschoenen",
          price: "€19,99",
          oldPrice: "€27,99",
          brand: "Bol.com",
          href: "#bol-handschoenen",
          tag: "Aanbieding",
        },
        {
          image: placeholderImg("🧥", 20),
          title: "Winterjas",
          price: "€89,95",
          brand: "Bol.com",
          href: "#bol-winterjas",
          tag: "Bestseller",
        },
        {
          image: placeholderImg("☕", 30),
          title: "Thermosfles 500ml",
          price: "€22,50",
          brand: "Bol.com",
          href: "#bol-thermos",
        },
      ],
    };
  }

  if (hot) {
    return {
      heading: `UV ${weather.uvIndex.toFixed(0)} — bescherm jezelf`,
      subtitle: "Bol.com",
      products: [
        {
          image: placeholderImg("🧴", 40),
          title: "Zonnebrand SPF50",
          price: "€12,99",
          brand: "Bol.com",
          href: "#bol-zonnebrand",
          tag: "Noodzaak",
        },
        {
          image: placeholderImg("😎", 200),
          title: "Polaroid zonnebril",
          price: "€34,95",
          oldPrice: "€49,95",
          brand: "Bol.com",
          href: "#bol-zonnebril",
          tag: "Deal",
        },
        {
          image: placeholderImg("🌀", 180),
          title: "Tafelventilator",
          price: "€29,99",
          brand: "Bol.com",
          href: "#bol-ventilator",
        },
        {
          image: placeholderImg("🧊", 210),
          title: "Koelbox 24L",
          price: "€44,95",
          brand: "Bol.com",
          href: "#bol-koelbox",
        },
      ],
    };
  }

  return {
    heading: "Lekker weer? Naar buiten!",
    subtitle: "Bol.com",
    products: [
      {
        image: placeholderImg("🚴", 150),
        title: "Fietslamp set LED",
        price: "€14,95",
        brand: "Bol.com",
        href: "#bol-fietslamp",
        tag: "Populair",
      },
      {
        image: placeholderImg("🎒", 120),
        title: "Dagrugzak 20L",
        price: "€29,99",
        oldPrice: "€39,99",
        brand: "Bol.com",
        href: "#bol-rugzak",
        tag: "Aanbieding",
      },
      {
        image: placeholderImg("⚽", 100),
        title: "Buitenspeelgoed",
        price: "vanaf €9,99",
        brand: "Bol.com",
        href: "#bol-buiten",
      },
      {
        image: placeholderImg("🪑", 40),
        title: "Tuinstoel opvouwbaar",
        price: "€24,95",
        brand: "Bol.com",
        href: "#bol-tuinstoel",
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
      heading: "Blijf binnen, bestel eten",
      subtitle: "Thuisbezorgd",
      products: [
        {
          image: placeholderImg("🍕", 15),
          title: "Pizza bezorgd",
          price: "vanaf €8,50",
          brand: "Thuisbezorgd",
          href: "#thuisbezorgd-pizza",
          tag: "Favoriet",
        },
        {
          image: placeholderImg("🍜", 30),
          title: "Aziatisch",
          price: "vanaf €10,–",
          brand: "Thuisbezorgd",
          href: "#thuisbezorgd-aziatisch",
        },
        {
          image: placeholderImg("🍔", 40),
          title: "Burgers",
          price: "vanaf €9,–",
          brand: "Thuisbezorgd",
          href: "#thuisbezorgd-burgers",
          tag: "Populair",
        },
        {
          image: placeholderImg("🍣", 350),
          title: "Sushi",
          price: "vanaf €12,–",
          brand: "Thuisbezorgd",
          href: "#thuisbezorgd-sushi",
        },
        {
          image: placeholderImg("🥗", 130),
          title: "Gezond",
          price: "vanaf €11,–",
          brand: "Thuisbezorgd",
          href: "#thuisbezorgd-gezond",
        },
      ],
    };
  }

  const hour = new Date().getHours();
  if (hour % 2 === 0) {
    return {
      heading: "BBQ-weer!",
      subtitle: "Bol.com",
      products: [
        {
          image: placeholderImg("🔥", 15),
          title: "Houtskool BBQ",
          price: "€49,99",
          oldPrice: "€69,99",
          brand: "Bol.com",
          href: "#bol-bbq",
          tag: "Deal",
        },
        {
          image: placeholderImg("🥩", 0),
          title: "BBQ gereedschap set",
          price: "€24,95",
          brand: "Bol.com",
          href: "#bol-bbq-set",
        },
        {
          image: placeholderImg("💡", 50),
          title: "Tuinverlichting LED",
          price: "€19,99",
          brand: "Bol.com",
          href: "#bol-tuinlicht",
        },
        {
          image: placeholderImg("🪑", 40),
          title: "Loungestoel tuin",
          price: "€79,95",
          brand: "Bol.com",
          href: "#bol-lounge",
          tag: "Populair",
        },
      ],
    };
  }

  return {
    heading: "Slimme weermeters",
    subtitle: "Bol.com",
    products: [
      {
        image: placeholderImg("📱", 220),
        title: "Netatmo weerstation",
        price: "€149,99",
        oldPrice: "€189,99",
        brand: "Bol.com",
        href: "#bol-netatmo",
        tag: "Tip",
      },
      {
        image: placeholderImg("🌡️", 0),
        title: "Buiten thermometer",
        price: "€12,95",
        brand: "Bol.com",
        href: "#bol-thermometer",
      },
      {
        image: placeholderImg("💨", 200),
        title: "Windmeter digitaal",
        price: "€34,95",
        brand: "Bol.com",
        href: "#bol-windmeter",
      },
      {
        image: placeholderImg("🌧️", 210),
        title: "Regenmeter tuin",
        price: "€8,99",
        brand: "Bol.com",
        href: "#bol-regenmeter",
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
          <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wide bg-accent-orange text-white px-2 py-0.5 rounded-full">
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
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-orange via-accent-amber to-accent-orange opacity-60" />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-text-primary">{section.heading}</h4>
          <span className="text-[10px] text-text-muted">{section.subtitle}</span>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wider text-accent-orange/70 bg-accent-orange/10 px-2 py-0.5 rounded-full">Advertentie</span>
      </div>
      <div className="horizontal-scroll no-scrollbar gap-3">
        {section.products.map((product) => (
          <ProductCard key={product.href} product={product} />
        ))}
      </div>
    </div>
  );
}
