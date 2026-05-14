import { NextRequest, NextResponse } from "next/server";

export function marianaUnauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export function isMarianaAuthorized(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const secret = process.env.MARIANA_SECRET ?? process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export function badMarianaRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
