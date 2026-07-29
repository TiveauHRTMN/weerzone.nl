import { describe, expect, it } from "vitest";

import { sanitizeNextPath } from "@/lib/supabase/next-path";

describe("sanitizeNextPath", () => {
  it("accepts a relative path with query string", () => {
    expect(sanitizeNextPath("/preview?country=do&arrival=2027-01-27")).toBe(
      "/preview?country=do&arrival=2027-01-27",
    );
  });

  it("falls back for absolute URLs, protocol-relative URLs, and non-strings", () => {
    expect(sanitizeNextPath("https://evil.example")).toBe("/dashboard");
    expect(sanitizeNextPath("//evil.example")).toBe("/dashboard");
    expect(sanitizeNextPath("dashboard")).toBe("/dashboard");
    expect(sanitizeNextPath(null)).toBe("/dashboard");
    expect(sanitizeNextPath(undefined)).toBe("/dashboard");
    expect(sanitizeNextPath("/\\evil.example")).toBe("/dashboard");
  });

  it("supports a custom fallback", () => {
    expect(sanitizeNextPath(undefined, "/")).toBe("/");
  });
});
