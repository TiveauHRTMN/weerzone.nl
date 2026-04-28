import Image from "next/image";

/** Favicon/icoon: gele cirkel met witte W */
export function LogoIcon({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/weerzone-icon.png"
      alt="WEERZONE"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}

/** Volledig logo: WEERZONE tekst + zon
 *  De PNG heeft ~8% transparante padding aan alle kanten.
 *  We compenseren via negatieve margin zodat de tekst visueel uitlijnt.
 */
export function LogoFull({ height = 32, className = "" }: { height?: number; className?: string }) {
  const width = Math.round(height * (2430 / 645));
  const padY = Math.round(height * 0.12); // verticale compensatie voor PNG transparante padding
  return (
    <div style={{ marginTop: `-${padY}px`, marginBottom: `-${padY}px` }} className="inline-flex">
      <Image
        src="/logo-full.png"
        alt="WEERZONE"
        width={width}
        height={height}
        className={className}
        fetchPriority="high"
      />
    </div>
  );
}

export default function Logo({ size = 36, className = "", variant = "full" }: { size?: number; className?: string; variant?: "icon" | "full" }) {
  if (variant === "icon") return <LogoIcon size={size} className={className} />;
  return <LogoFull height={size} className={className} />;
}
