import { getSubscriberByToken } from "@/lib/subscriber-prefs";
import VoorkeurenForm from "./VoorkeurenForm";

export const dynamic = "force-dynamic";

export default async function VoorkeurenPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const sub = token ? await getSubscriberByToken(token) : null;
  if (!sub) {
    return <main className="max-w-md mx-auto p-8"><h1 className="text-xl font-black">Voorkeuren</h1><p>Deze link is ongeldig of verlopen.</p></main>;
  }
  return (
    <main className="max-w-md mx-auto p-8 space-y-4">
      <h1 className="text-2xl font-black">Jouw WEERZONE-voorkeuren</h1>
      <p className="text-sm text-text-secondary">{sub.email}{sub.city ? ` · ${sub.city}` : ""}</p>
      <VoorkeurenForm token={token!} initial={sub} />
    </main>
  );
}
