/**
 * Mariana Studio — Buffer-client (GraphQL API, api.buffer.com) om een foto naar het
 * TikTok-kanaal te publiceren.
 *
 * Buffer's klassieke REST-API (api.bufferapp.com/1) is sinds 2019 dicht voor iedereen —
 * elk token (welk type dan ook) krijgt daar een harde 401 "Public API tokens are not
 * accepted for REST API access", geverifieerd tegen de live API tijdens deze sessie.
 * Dit gebruikt in plaats daarvan Buffer's nieuwere GraphQL-API, waarvan het schema hier
 * (createPost-mutation, PostActionPayload-union, ShareMode/SchedulingType-enums) via
 * live GraphQL-introspectie geverifieerd is — de gerenderde developer-docs bleken op
 * punten onjuist (o.a. input-arity van createPost).
 *
 * `fetchImpl` injecteerbaar voor tests.
 */
const ENDPOINT = "https://api.buffer.com";

export type BufferResult = { ok: true; bufferId: string | null } | { ok: false; error: string };

const CREATE_POST_MUTATION = `
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      ... on PostActionSuccess { post { id status } }
      ... on InvalidInputError { message }
      ... on UnauthorizedError { message }
      ... on RestProxyError { message code link }
      ... on NotFoundError { message }
      ... on UnexpectedError { message }
      ... on LimitReachedError { message }
    }
  }
`;

export async function postToTikTok(args: {
  imageUrl: string;
  caption: string;
  mode?: "now" | "draft";
  fetchImpl?: typeof fetch;
}): Promise<BufferResult> {
  const token = process.env.BUFFER_ACCESS_TOKEN;
  const channelId = process.env.BUFFER_TIKTOK_CHANNEL_ID;
  if (!token) return { ok: false, error: "BUFFER_ACCESS_TOKEN ontbreekt" };
  if (!channelId) return { ok: false, error: "BUFFER_TIKTOK_CHANNEL_ID ontbreekt" };

  const f = args.fetchImpl ?? fetch;
  const variables = {
    input: {
      channelId,
      text: args.caption,
      schedulingType: "automatic",
      mode: "shareNow",
      saveToDraft: args.mode === "draft",
      assets: [{ image: { url: args.imageUrl, metadata: { altText: "Weerzone TikTok-slide" } } }],
      metadata: { tiktok: { title: args.caption } },
    },
  };

  try {
    const resp = await f(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: CREATE_POST_MUTATION, variables }),
    });
    const json: any = await resp.json().catch(() => ({}));
    if (!resp.ok || json?.errors) {
      return { ok: false, error: json?.errors?.[0]?.message || `Buffer HTTP ${resp.status}` };
    }
    const payload = json?.data?.createPost;
    if (payload?.post) {
      return { ok: true, bufferId: payload.post.id ?? null };
    }
    return { ok: false, error: payload?.message || "Onbekende Buffer-fout" };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
