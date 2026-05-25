"use client";

import { type PersonaTier } from "@/lib/personas";

interface PremiumGateProps {
  children: React.ReactNode;
  tierRequired?: PersonaTier;
}

/**
 * Beta-gate is bewust open: alles is gratis tot augustus 2026.
 * We houden de wrapper zodat bestaande pagina's niet hoeven te weten dat
 * de betaalmuur tijdelijk uit staat.
 */
export default function PremiumGate({ children, tierRequired }: PremiumGateProps) {
  void tierRequired;
  return <>{children}</>;
}
