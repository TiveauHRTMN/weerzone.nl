import { describe, expect, it } from "vitest";

import {
  InvalidJsonBodyError,
  readBoundedJson,
  RequestBodyTooLargeError,
} from "@/lib/http/read-json-body";

describe("readBoundedJson", () => {
  it("parses a JSON request within the byte limit", async () => {
    const request = new Request("https://calortravel.nl/api/example", {
      method: "POST",
      body: JSON.stringify({ consent: "granted" }),
    });

    await expect(readBoundedJson(request, 1_024)).resolves.toEqual({
      consent: "granted",
    });
  });

  it("rejects a streaming body even without a content-length header", async () => {
    const request = new Request("https://calortravel.nl/api/example", {
      method: "POST",
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(`"${"x".repeat(2_000)}"`));
          controller.close();
        },
      }),
      duplex: "half",
    } as RequestInit);

    await expect(readBoundedJson(request, 1_024)).rejects.toBeInstanceOf(
      RequestBodyTooLargeError,
    );
  });

  it("rejects malformed JSON", async () => {
    const request = new Request("https://calortravel.nl/api/example", {
      method: "POST",
      body: "{",
    });

    await expect(readBoundedJson(request, 1_024)).rejects.toBeInstanceOf(
      InvalidJsonBodyError,
    );
  });
});
