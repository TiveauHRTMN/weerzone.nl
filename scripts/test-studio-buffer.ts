import { postToTikTok } from "../src/lib/mariana/studio/buffer";

function assert(cond: boolean, msg: string) {
  if (!cond) { console.error("FAIL:", msg); process.exit(1); }
  console.log("ok:", msg);
}

(async () => {
  process.env.BUFFER_ACCESS_TOKEN = "tok123";
  process.env.BUFFER_TIKTOK_PROFILE_ID = "prof456";

  let captured: { url: string; body: string; auth: string | null } | null = null;
  const fakeFetch = (async (url: any, init: any) => {
    captured = { url: String(url), body: String(init?.body ?? ""), auth: init?.headers?.Authorization ?? null };
    return { ok: true, status: 200, json: async () => ({ success: true, updates: [{ id: "upd789" }] }) } as any;
  }) as unknown as typeof fetch;

  const res = await postToTikTok({ imageUrl: "https://x/y.png", caption: "Hallo", mode: "now", fetchImpl: fakeFetch });
  assert(res.ok === true && (res as any).bufferId === "upd789", "succes → bufferId uit updates[0].id");
  assert(captured!.url.includes("api.bufferapp.com/1/updates/create.json"), "juiste endpoint");
  assert(captured!.body.includes("profile_ids%5B%5D=prof456"), "profile_ids[] form-encoded");
  assert(captured!.body.includes("text=Hallo"), "caption als text");
  assert(decodeURIComponent(captured!.body).includes("media[photo]=https://x/y.png"), "media[photo]=imageUrl");
  assert(captured!.body.includes("now=true"), "now=true bij mode now");

  // foutpad
  const errFetch = (async () => ({ ok: false, status: 403, json: async () => ({ success: false, message: "denied" }) } as any)) as unknown as typeof fetch;
  const res2 = await postToTikTok({ imageUrl: "u", caption: "c", fetchImpl: errFetch });
  assert(res2.ok === false && (res2 as any).error.includes("denied"), "HTTP-fout → {ok:false,error}");

  // ontbrekende env
  delete process.env.BUFFER_ACCESS_TOKEN;
  const res3 = await postToTikTok({ imageUrl: "u", caption: "c", fetchImpl: fakeFetch });
  assert(res3.ok === false, "ontbrekend token → {ok:false}");

  console.log("ALL PASS");
})();
