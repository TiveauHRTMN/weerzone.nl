"use client";

import Link from "next/link";
import { useFeatureFlagVariantKey } from "posthog-js/react";
import { useEffect, useState } from "react";

export default function HomePitchCTA() {
  const [mounted, setMounted] = useState(false);
  const variant = useFeatureFlagVariantKey("cta-pitch-test");

  useEffect(() => {
    setMounted(true);
  }, []);

  const isTest = mounted && variant === "test";

  return (
    <Link
      href="/mijn-weerzone"
      className={`inline-block px-8 py-4 rounded-full font-black text-sm shadow-2xl transition-all transform hover:scale-105 ${
        isTest
          ? "bg-accent-orange text-white hover:bg-slate-900"
          : "bg-white text-slate-900 hover:bg-accent-orange hover:text-white"
      }`}
    >
      {isTest ? "Naar Mijn Weerzone ->" : "Open je weeragent ->"}
    </Link>
  );
}
