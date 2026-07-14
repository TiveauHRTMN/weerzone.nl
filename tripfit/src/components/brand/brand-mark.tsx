import Image from "next/image";
import Link from "next/link";

import logoBlack from "./calor-logo-black.png";
import logoWhite from "./calor-logo-white.png";

type BrandMarkProps = {
  inverse?: boolean;
};

export function BrandMark({ inverse = false }: BrandMarkProps) {
  return (
    <Link
      href="/"
      className="inline-flex items-center rounded-md no-underline"
      aria-label="Calor – naar de homepage"
    >
      <Image
        src={inverse ? logoWhite : logoBlack}
        alt="Calor"
        priority={!inverse}
        className="h-6 w-auto"
      />
    </Link>
  );
}
