import { describe, expect, it, vi } from "vitest";

import {
  buildTrackedUrl,
  resolveAffiliateClick,
  type AffiliateProviderAdapter,
} from "@/features/affiliates/adapter";

const adapter: AffiliateProviderAdapter = {
  provider: "viator",
  normalizeProduct: () => {
    throw new Error("not used");
  },
  buildTrackedUrl,
  trackClick: vi.fn(),
};

describe("affiliate adapter boundary", () => {
  it("falls back to a neutral Calor page when affiliates are off", async () => {
    const result = await resolveAffiliateClick({
      affiliatesEnabled: false,
      adapter,
      input: {
        clickId: "click-1",
        originalUrl: "https://www.viator.com/product",
        provider: "viator",
        placement: "today",
      },
      allowedHosts: new Set(["www.viator.com"]),
      neutralPath: "/activiteiten/product",
    });
    expect(result).toEqual({ destination: "/activiteiten/product", external: false });
    expect(adapter.trackClick).not.toHaveBeenCalled();
  });

  it("tracks before returning an allowlisted external URL", async () => {
    const result = await resolveAffiliateClick({
      affiliatesEnabled: true,
      adapter,
      input: {
        clickId: "click-2",
        originalUrl: "https://www.viator.com/product",
        provider: "viator",
        placement: "today",
      },
      allowedHosts: new Set(["www.viator.com"]),
      neutralPath: "/activiteiten/product",
    });
    expect(result.external).toBe(true);
    expect(result.destination).toContain("utm_source=calor");
    expect(adapter.trackClick).toHaveBeenCalledOnce();
  });

  it("rejects open redirects", async () => {
    await expect(
      resolveAffiliateClick({
        affiliatesEnabled: true,
        adapter,
        input: {
          clickId: "click-3",
          originalUrl: "https://evil.example/steal",
          provider: "viator",
          placement: "today",
        },
        allowedHosts: new Set(["www.viator.com"]),
        neutralPath: "/activiteiten/product",
      }),
    ).rejects.toThrow(/allowlisted/);
  });
});

