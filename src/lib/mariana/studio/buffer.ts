/**
 * Mariana Studio — Buffer-client (classic API v1) om een foto naar het
 * TikTok-kanaal te publiceren. `fetchImpl` injecteerbaar voor tests.
 */
const ENDPOINT = "https://api.bufferapp.com/1/updates/create.json";

export type BufferResult = { ok: true; bufferId: string | null } | { ok: false; error: string };

export async function postToTikTok(args: {
  imageUrl: string;
  caption: string;
  mode?: "now" | "draft";
  fetchImpl?: typeof fetch;
}): Promise<BufferResult> {
  const token = process.env.BUFFER_ACCESS_TOKEN;
  const profileId = process.env.BUFFER_TIKTOK_PROFILE_ID;
  if (!token) return { ok: false, error: "BUFFER_ACCESS_TOKEN ontbreekt" };
  if (!profileId) return { ok: false, error: "BUFFER_TIKTOK_PROFILE_ID ontbreekt" };

  const f = args.fetchImpl ?? fetch;
  const params = new URLSearchParams();
  params.append("profile_ids[]", profileId);
  params.append("text", args.caption);
  params.append("media[photo]", args.imageUrl);
  params.append("media[thumbnail]", args.imageUrl);
  params.append("now", args.mode === "draft" ? "false" : "true");

  try {
    const resp = await f(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const json: any = await resp.json().catch(() => ({}));
    if (!resp.ok || json?.success === false) {
      return { ok: false, error: json?.message || `Buffer HTTP ${resp.status}` };
    }
    const bufferId: string | null = json?.updates?.[0]?.id ?? null;
    return { ok: true, bufferId };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
