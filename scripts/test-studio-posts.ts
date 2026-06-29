/* Verifieert de soft-fail-contracten van posts.ts zonder DB-creds. */
import { getPostedSlots, recordPost, uploadSlidePng } from "../src/lib/mariana/studio/posts";

function assert(cond: boolean, msg: string) {
  if (!cond) { console.error("FAIL:", msg); process.exit(1); }
  console.log("ok:", msg);
}

(async () => {
  delete process.env.SUPABASE_SERVICE_ROLE_KEY; // forceer "geen service role"
  const posted = await getPostedSlots("2026-06-29");
  assert(Object.keys(posted).length === 0, "getPostedSlots → leeg zonder service role");

  const rec = await recordPost({ forecastDate: "2026-06-29", slot: "slide1", status: "posted", bufferId: "x", imageUrl: "u", caption: "c" });
  assert(rec.ok === false, "recordPost → {ok:false} zonder service role");

  const url = await uploadSlidePng("2026-06-29", "slide1", "data:image/png;base64,AAAA");
  assert(url === null, "uploadSlidePng → null zonder service role");

  console.log("ALL PASS");
})();
