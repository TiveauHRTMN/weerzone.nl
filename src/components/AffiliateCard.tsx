import type { WeatherData } from "@/lib/types";

interface Props {
  weather: WeatherData;
}

export default function AffiliateCard({ weather }: Props) {
  const rain = weather.current.precipitation > 0;
  const cold = weather.current.temperature < 5;
  const hot = weather.current.temperature >= 25;
  const windy = weather.current.windSpeed > 40;

  let product = {
    emoji: "☂️",
    text: "Een goede paraplu",
    reason: "Want ja, het gaat weer regenen.",
  };

  if (hot) {
    product = {
      emoji: "🧴",
      text: "Zonnebrand factor 50",
      reason: "Je bent geen krokodil. Smeer je in.",
    };
  } else if (cold) {
    product = {
      emoji: "🧤",
      text: "Thermische handschoenen",
      reason: "Je vingers zullen je dankbaar zijn.",
    };
  } else if (windy) {
    product = {
      emoji: "🧥",
      text: "Een winddichte jas",
      reason: "Anders waait je humeur ook weg.",
    };
  } else if (!rain) {
    product = {
      emoji: "😎",
      text: "Een goede zonnebril",
      reason: "Voor als de zon zich even laat zien.",
    };
  }

  return (
    <div
      className="card p-5 flex items-start gap-4"
      style={{ borderColor: "rgba(232, 116, 58, 0.15)" }}
    >
      <span className="text-3xl">{product.emoji}</span>
      <div className="flex-1">
        <div className="section-title mb-1">Tip van de dag</div>
        <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
          {product.text}
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          {product.reason}
        </p>
      </div>
    </div>
  );
}
