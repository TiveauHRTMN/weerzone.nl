export default function WkLogo({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-grid place-items-center rounded-2xl border border-white/12 bg-white/[0.08] text-white shadow-[0_14px_40px_rgba(0,0,0,0.22)] backdrop-blur-2xl ${className}`}
    >
      <svg viewBox="0 0 64 64" fill="none" className="h-[72%] w-[72%]">
        <path
          d="M12 18c0-7 6-12 15-12h20v13H27c-2 0-3 1-3 3s1 3 4 3h9c9 0 15 5 15 13 0 9-7 15-18 15H12V40h23c3 0 5-1 5-4 0-2-2-3-5-3h-8c-9 0-15-6-15-15Z"
          fill="currentColor"
        />
        <path
          d="M17 52h31v6H17v-6Z"
          fill="#16a34a"
        />
        <path
          d="M27 24c0-4 3-7 7-7s7 3 7 7c0 3-2 5-4 6l-1 13h-4l-1-13c-2-1-4-3-4-6Z"
          fill="#f6c453"
        />
        <path d="M8 8h7v7H8V8Z" fill="#ef4444" />
        <path d="M49 8h7v7h-7V8Z" fill="#2563eb" />
      </svg>
    </span>
  );
}
