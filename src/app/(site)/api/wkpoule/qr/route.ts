import QRCode from "qrcode";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("target");
  if (!target) {
    return new Response("Missing target", { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(target, request.nextUrl.origin);
  } catch {
    return new Response("Invalid target", { status: 400 });
  }

  const svg = await QRCode.toString(url.toString(), {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 280,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
