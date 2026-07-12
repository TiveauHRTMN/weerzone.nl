import Link from "next/link";

type BrandMarkProps = {
  inverse?: boolean;
};

export function BrandMark({ inverse = false }: BrandMarkProps) {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-2.5 rounded-md no-underline"
      aria-label="TripFit – naar de homepage"
    >
      <span
        aria-hidden="true"
        className={`relative grid size-8 place-items-center overflow-hidden rounded-full border ${
          inverse
            ? "border-white/25 bg-white/10"
            : "border-moss-dark/15 bg-moss-dark"
        }`}
      >
        <svg viewBox="0 0 32 32" className="size-full" fill="none">
          <path
            d="M7 18.5c4.2-1.1 6.3-3.8 8.1-8.6 1.1 4.6 3.5 7.6 9.9 8.6"
            stroke={inverse ? "#fffdf8" : "#fffdf8"}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="22.5" cy="10" r="2.2" fill="#d7ae5d" />
          <path
            d="M8.5 22.3h15"
            stroke={inverse ? "#fffdf8" : "#fffdf8"}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span
        className={`text-[1.05rem] font-[780] tracking-[-0.04em] ${
          inverse ? "text-white" : "text-ink"
        }`}
      >
        TripFit
      </span>
    </Link>
  );
}
