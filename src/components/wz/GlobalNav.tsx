"use client";

import { usePathname } from "next/navigation";
import NLPulse from "@/components/NLPulse";
import NavBar from "@/components/NavBar";
import WzLogo from "@/components/wz/WzLogo";

const HIDDEN_PATHS = ["/app/login", "/app/signup", "/app/reset", "/app/verify", "/auth"];

export default function GlobalNav() {
  const pathname = usePathname() ?? "/";
  if (HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return null;

  return (
    <div>
      <NLPulse />
      <div className="px-3 pt-2 pb-2" style={{ borderBottom: "1px solid var(--wz-border)" }}>
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-2">
          <WzLogo />
          <NavBar />
        </div>
      </div>
    </div>
  );
}
