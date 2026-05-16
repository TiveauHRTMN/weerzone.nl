import { NextResponse } from "next/server";

const INDEXNOW_KEY = "7c4e2a8b9d1f3e6c5b8a7d4f2e1c9b6a";
const HOST = "weerzone.nl";
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;

const ENDPOINTS = [
  "https://api.indexnow.org/indexnow",
  "https://www.bing.com/indexnow",
  "https://yandex.com/indexnow",
];

type Body = { urls?: string[]; url?: string };

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const expected = process.env.INDEXNOW_INTERNAL_SECRET;
  if (expected && auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const urlList = (body.urls ?? (body.url ? [body.url] : []))
    .map((u) => u.trim())
    .filter((u) => u.startsWith(`https://${HOST}/`) || u === `https://${HOST}`);

  if (urlList.length === 0) {
    return NextResponse.json({ error: "no_urls" }, { status: 400 });
  }

  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  };

  const results = await Promise.allSettled(
    ENDPOINTS.map((endpoint) =>
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(async (r) => ({ endpoint, status: r.status, ok: r.ok }))
    )
  );

  return NextResponse.json({
    submitted: urlList.length,
    keyLocation: KEY_LOCATION,
    results: results.map((r) =>
      r.status === "fulfilled" ? r.value : { endpoint: "unknown", error: String(r.reason) }
    ),
  });
}

export async function GET() {
  return NextResponse.json({
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    usage: "POST { urls: string[] } with Authorization: Bearer $INDEXNOW_INTERNAL_SECRET",
  });
}
