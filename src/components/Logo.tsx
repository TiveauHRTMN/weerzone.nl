interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export default function Logo({ size = 36, className = "", showText = false }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Globe */}
        <circle cx="46" cy="52" r="38" fill="url(#globeGrad)" />
        {/* Globe grid lines */}
        <ellipse cx="46" cy="52" rx="38" ry="38" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" fill="none" />
        <ellipse cx="46" cy="52" rx="20" ry="38" stroke="rgba(255,255,255,0.12)" strokeWidth="1" fill="none" />
        <ellipse cx="46" cy="52" rx="8" ry="38" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" fill="none" />
        {/* Horizontal latitude lines */}
        <ellipse cx="46" cy="35" rx="36" ry="4" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" fill="none" />
        <ellipse cx="46" cy="52" rx="38" ry="4" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" fill="none" />
        <ellipse cx="46" cy="69" rx="36" ry="4" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" fill="none" />

        {/* W — correcte outline, 10 punten */}
        <polygon
          points="18,30 26,30 34,62 46,42 58,62 66,30 74,30 60,72 46,50 32,72"
          fill="white"
          opacity="0.95"
        />

        {/* Sun — top right, overlapping globe */}
        <circle cx="76" cy="18" r="14" fill="url(#sunGrad)" />
        {/* Sun rays */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = 76 + Math.cos(rad) * 16;
          const y1 = 18 + Math.sin(rad) * 16;
          const x2 = 76 + Math.cos(rad) * 22;
          const y2 = 18 + Math.sin(rad) * 22;
          return (
            <line
              key={angle}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#FFD93D"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.9"
            />
          );
        })}
        <circle cx="76" cy="18" r="10" fill="#FFE566" />

        {/* Gradient definitions */}
        <defs>
          <linearGradient id="globeGrad" x1="20" y1="14" x2="72" y2="90">
            <stop offset="0%" stopColor="#4BA3E3" />
            <stop offset="50%" stopColor="#2980B9" />
            <stop offset="100%" stopColor="#1A6FA0" />
          </linearGradient>
          <radialGradient id="sunGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FFE566" />
            <stop offset="100%" stopColor="#FFB340" />
          </radialGradient>
        </defs>
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-black tracking-tight text-white leading-none">
            WeerZone
          </span>
          <span className="text-[10px] font-medium text-white/60 tracking-wide">
            48 uur. De rest is gelul.
          </span>
        </div>
      )}
    </div>
  );
}
