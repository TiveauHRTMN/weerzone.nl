import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Diagnose-endpoint voor Buffer-integratie.
 * Gebruik: /api/admin/buffer-check?auth=<CRON_SECRET>
 *
 * Probeert zowel de klassieke (bufferapp.com/1) als de nieuwe
 * (graphql.buffer.com) API en rapporteert wat werkt.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const auth = searchParams.get("auth");
  const cronSecret = process.env.CRON_SECRET;

  // Beveilig alleen in productie, om handmatige check mogelijk te maken
  if (process.env.NODE_ENV === "production" && auth !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.BUFFER_API_TOKEN;
  if (!token) {
    return NextResponse.json({
      ok: false,
      step: "env",
      error: "BUFFER_API_TOKEN niet gevonden in Vercel env",
    });
  }

  const tokenInfo = {
    length: token.length,
    prefix: token.slice(0, 4) + "…",
  };

  // --- 1. Klassieke API (OAuth access_token, werkt via query-param) ---
  // https://buffer.com/developers/api/profiles
  const classicResults: Record<string, unknown> = {};
  try {
    const res = await fetch(
      `https://api.bufferapp.com/1/profiles.json?access_token=${encodeURIComponent(token)}`,
      { cache: "no-store" },
    );
    classicResults.status = res.status;
    classicResults.ok = res.ok;
    const body = await res.text();
    try {
      const json = JSON.parse(body);
      if (Array.isArray(json)) {
        classicResults.profiles = json.map((p: Record<string, unknown>) => ({
          id: p.id,
          service: p.service,
          service_username: p.service_username,
          formatted_service: p.formatted_service,
          default: p.default,
        }));
        classicResults.count = json.length;
      } else {
        classicResults.body = json;
      }
    } catch {
      classicResults.body = body.slice(0, 500);
    }
  } catch (e) {
    classicResults.error = (e as Error).message;
  }

  // --- 2. Nieuwe GraphQL API (Bearer-token, api.buffer.com) ---
  // https://developers.buffer.com
  const graphqlResults: Record<string, unknown> = {};
  try {
    const res = await fetch("https://api.buffer.com", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `query GetChannels {
          account {
            id
            organizations {
              id
              name
              channels { id name service type }
            }
          }
        }`,
      }),
      cache: "no-store",
    });
    graphqlResults.status = res.status;
    graphqlResults.ok = res.ok;
    const body = await res.text();
    try {
      graphqlResults.body = JSON.parse(body);
    } catch {
      graphqlResults.body = body.slice(0, 500);
    }
  } catch (e) {
    graphqlResults.error = (e as Error).message;
  }

  // Verdict
  const classicOk =
    classicResults.ok === true && typeof classicResults.count === "number";
  const graphqlBody = graphqlResults.body as { data?: { account?: unknown }; errors?: unknown } | undefined;
  const graphqlOk =
    graphqlResults.ok === true && !!graphqlBody?.data?.account && !graphqlBody?.errors;

  return NextResponse.json({
    ok: classicOk || graphqlOk,
    token: tokenInfo,
    classic_api: classicResults,
    graphql_api: graphqlResults,
    verdict: graphqlOk
      ? "✅ Nieuwe GraphQL API werkt via api.buffer.com — zie graphql_api.body.data.account.organizations voor channels"
      : classicOk
        ? "Klassieke API werkt — gebruik api.bufferapp.com/1/…"
        : "❌ Token werkt met geen van beide APIs. Haal een Personal API Key via https://publish.buffer.com/settings/api",
  });
}
