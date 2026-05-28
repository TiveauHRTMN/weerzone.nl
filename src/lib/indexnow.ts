/**
 * IndexNow helper — pingt Bing/Yandex/Naver/Seznam zodra URLs updaten.
 *
 * Google ondersteunt IndexNow niet, dus dit is puur voor non-Google
 * indexatie-versnelling. Rate limits zijn ruim (10k URLs per batch), maar we
 * pingen alleen "belangrijke" URLs — niet alle 88k programmatische stadpagina's.
 *
 * De key zit publiek op /<KEY>.txt zoals voorgeschreven door
 * https://www.indexnow.org/documentation
 */

const INDEXNOW_KEY = "164e98d07e1af78853b81f16870c011c";
const HOST = "weerzone.nl";
const ENDPOINT = "https://api.indexnow.org/IndexNow";

export async function pingIndexNow(urls: string[]): Promise<{ status: number; ok: boolean; count: number }> {
  if (urls.length === 0) return { status: 0, ok: true, count: 0 };

  // IndexNow accepteert max 10.000 URLs per request, maar wij houden het bij ~500
  // tegelijk om throttling en log-noise te vermijden.
  const batch = urls.slice(0, 500);

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: HOST,
      key: INDEXNOW_KEY,
      keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
      urlList: batch,
    }),
  });

  return { status: res.status, ok: res.ok || res.status === 202, count: batch.length };
}
