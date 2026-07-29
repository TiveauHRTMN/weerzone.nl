import { cookies } from "next/headers";
import { z } from "zod";

import {
  ANALYTICS_CONSENT_COOKIE,
  ANALYTICS_SESSION_COOKIE,
} from "@/features/analytics/consent";
import {
  readBoundedJson,
  RequestBodyTooLargeError,
} from "@/lib/http/read-json-body";
import {
  anonymizeRateLimitKey,
  checkRateLimit,
  clientAddress,
} from "@/lib/security/rate-limit";

const MAXIMUM_CONSENT_BODY_BYTES = 1_024;
const consentSchema = z.object({
  consent: z.enum(["granted", "denied"]),
});

export async function GET() {
  const cookieStore = await cookies();
  const value = cookieStore.get(ANALYTICS_CONSENT_COOKIE)?.value;
  return Response.json(
    { consent: value === "granted" || value === "denied" ? value : "unset" },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit({
    bucket: "analytics:consent",
    key: anonymizeRateLimitKey(clientAddress(request.headers)),
    limit: 30,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return Response.json(
      { error: "Too many consent updates" },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  let body: unknown;
  try {
    body = await readBoundedJson(request, MAXIMUM_CONSENT_BODY_BYTES);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return Response.json({ error: "Payload too large" }, { status: 413 });
    }
    return Response.json({ error: "Invalid consent value" }, { status: 400 });
  }
  const parsed = consentSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid consent value" }, { status: 400 });
  }
  const cookieStore = await cookies();
  cookieStore.set(ANALYTICS_CONSENT_COOKIE, parsed.data.consent, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  if (parsed.data.consent === "denied") {
    cookieStore.delete(ANALYTICS_SESSION_COOKIE);
  }
  return Response.json({ status: parsed.data.consent });
}
