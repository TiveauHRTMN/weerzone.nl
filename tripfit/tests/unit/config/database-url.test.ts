import { describe, expect, it } from "vitest";

import { parseDatabaseUrl } from "@/config/database-url";

describe("parseDatabaseUrl", () => {
  it("accepts PostgreSQL connection strings", () => {
    expect(
      parseDatabaseUrl(
        "postgresql://tripfit:secret@localhost:5432/tripfit?schema=public",
      ),
    ).toBe(
      "postgresql://tripfit:secret@localhost:5432/tripfit?schema=public",
    );
    expect(parseDatabaseUrl("postgres://tripfit@db.example.com/tripfit")).toBe(
      "postgres://tripfit@db.example.com/tripfit",
    );
  });

  it.each([undefined, "", "not-a-url", "https://example.com/database"])(
    "rejects an absent or non-PostgreSQL value: %s",
    (value) => {
      expect(parseDatabaseUrl(value)).toBeNull();
    },
  );
});
