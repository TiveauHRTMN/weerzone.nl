import Image from "next/image";

export default function WzLogo({
  href = "/",
  pillClassName = "",
  height = 20,
}: {
  href?: string;
  pillClassName?: string;
  height?: number;
}) {
  return (
    <a
      href={href}
      className={`inline-flex items-center rounded-[10px] bg-[var(--wz-blue)] px-3 py-1.5 ${pillClassName}`}
      aria-label="Weerzone — naar home"
    >
      <Image
        src="/brand/weerzone-logo.png"
        alt="Weerzone"
        width={Math.round(height * 4.26)}
        height={height}
        priority
        style={{ height, width: "auto", display: "block" }}
      />
    </a>
  );
}
