import Image from "next/image";

/** Favicon/icoon: gele cirkel met witte W */
export function LogoIcon({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/favicon-icon.png"
      alt="WeerZone"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}

/** Volledig logo: WeerZone tekst + zon */
export function LogoFull({ height = 32, className = "" }: { height?: number; className?: string }) {
  const width = Math.round(height * (2430 / 645)); // aspect ratio van het logo
  return (
    <Image
      src="/logo-full.png"
      alt="WeerZone"
      width={width}
      height={height}
      className={className}
      priority
    />
  );
}

export default function Logo({ size = 36, className = "", variant = "full" }: { size?: number; className?: string; variant?: "icon" | "full" }) {
  if (variant === "icon") return <LogoIcon size={size} className={className} />;
  return <LogoFull height={size} className={className} />;
}
