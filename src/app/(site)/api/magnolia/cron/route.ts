import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "magnolia-cron",
    mode: "external-worker",
    message: "Root Python Magnolia worker is excluded from Vercel bundle; use the external worker for execution.",
    timestamp: new Date().toISOString(),
  });
}

export const POST = GET;
