import { postToTikTok } from "../src/lib/mariana/studio/buffer";

function assert(cond: boolean, msg: string) {
  if (!cond) { console.error("FAIL:", msg); process.exit(1); }
  console.log("ok:", msg);
}

(async () => {
  process.env.BUFFER_ACCESS_TOKEN = "tok123";
  process.env.BUFFER_TIKTOK_CHANNEL_ID = "chan456";

  let captured: { url: string; body: any; auth: string | null } | null = null;
  const fakeFetch = (async (url: any, init: any) => {
    captured = { url: String(url), body: JSON.parse(String(init?.body ?? "{}")), auth: init?.headers?.Authorization ?? null };
    return {
      ok: true,
      status: 200,
      json: async () => ({ data: { createPost: { post: { id: "post789", status: "buffer" } } } }),
    } as any;
  }) as unknown as typeof fetch;

  const res = await postToTikTok({ imageUrl: "https://x/y.png", caption: "Hallo", mode: "now", fetchImpl: fakeFetch });
  assert(res.ok === true && (res as any).bufferId === "post789", "succes → bufferId uit createPost.post.id");
  assert(captured!.url === "https://api.buffer.com", "juiste endpoint (GraphQL API)");
  assert(captured!.auth === "Bearer tok123", "Bearer-token in Authorization-header");
  assert(captured!.body.variables.input.channelId === "chan456", "channelId uit BUFFER_TIKTOK_CHANNEL_ID");
  assert(captured!.body.variables.input.text === "Hallo", "caption als text");
  assert(captured!.body.variables.input.assets[0].image.url === "https://x/y.png", "assets[0].image.url = imageUrl");
  assert(!("metadata" in captured!.body.variables.input), "géén metadata.tiktok (title >90 tekens breekt TikTok's foto-post)");
  assert(captured!.body.variables.input.mode === "shareNow", "mode = shareNow");
  assert(captured!.body.variables.input.schedulingType === "automatic", "schedulingType = automatic");
  assert(captured!.body.variables.input.saveToDraft === false, "saveToDraft:false bij mode now");

  // draft mode
  const resDraft = await postToTikTok({ imageUrl: "https://x/y.png", caption: "Draft", mode: "draft", fetchImpl: fakeFetch });
  assert(resDraft.ok === true, "draft mode → ok:true");
  assert(captured!.body.variables.input.saveToDraft === true, "saveToDraft:true bij mode draft");

  // foutpad: GraphQL top-level errors array
  const errFetch = (async () => ({
    ok: true,
    status: 200,
    json: async () => ({ errors: [{ message: "Unauthorized" }] }),
  } as any)) as unknown as typeof fetch;
  const res2 = await postToTikTok({ imageUrl: "u", caption: "c", fetchImpl: errFetch });
  assert(res2.ok === false && (res2 as any).error.includes("Unauthorized"), "GraphQL errors[] → {ok:false,error}");

  // foutpad: PostActionPayload union error member (bv. InvalidInputError)
  const unionErrFetch = (async () => ({
    ok: true,
    status: 200,
    json: async () => ({ data: { createPost: { message: "Channel not found" } } }),
  } as any)) as unknown as typeof fetch;
  const res2b = await postToTikTok({ imageUrl: "u", caption: "c", fetchImpl: unionErrFetch });
  assert(res2b.ok === false && (res2b as any).error === "Channel not found", "union error-member zonder post → {ok:false,error}");

  // ontbrekende token
  delete process.env.BUFFER_ACCESS_TOKEN;
  const res3 = await postToTikTok({ imageUrl: "u", caption: "c", fetchImpl: fakeFetch });
  assert(res3.ok === false, "ontbrekend token → {ok:false}");

  // ontbrekend channel_id (token herstellen, channel_id verwijderen)
  process.env.BUFFER_ACCESS_TOKEN = "tok123";
  delete process.env.BUFFER_TIKTOK_CHANNEL_ID;
  const res4 = await postToTikTok({ imageUrl: "u", caption: "c", fetchImpl: fakeFetch });
  assert(res4.ok === false, "ontbrekend channel_id → {ok:false}");

  // netwerk-throw
  process.env.BUFFER_TIKTOK_CHANNEL_ID = "chan456";
  const throwFetch = (async () => { throw new Error("network down"); }) as unknown as typeof fetch;
  const res5 = await postToTikTok({ imageUrl: "u", caption: "c", fetchImpl: throwFetch });
  assert(res5.ok === false, "netwerk-throw → {ok:false}");
  assert((res5 as any).error.includes("network down"), "netwerk-throw → error bevat bericht");

  // HTTP-fout (non-ok response zonder errors[])
  const httpErrFetch = (async () => ({
    ok: false,
    status: 500,
    json: async () => ({}),
  } as any)) as unknown as typeof fetch;
  const res6 = await postToTikTok({ imageUrl: "u", caption: "c", fetchImpl: httpErrFetch });
  assert(res6.ok === false && (res6 as any).error.includes("500"), "non-ok HTTP zonder errors[] → status in error");

  console.log("ALL PASS");
})();
