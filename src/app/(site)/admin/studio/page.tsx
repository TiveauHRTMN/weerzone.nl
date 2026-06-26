import type { Metadata } from "next";
import { headers } from "next/headers";
import { studioAccessOk } from "@/lib/mariana/studio/gate";
import StudioClient from "./StudioClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const sp = await searchParams;
  const h = await headers();
  // Reconstrueer een Request-achtig object voor de gate-check.
  const fakeReq = new Request(`https://x/admin/studio?key=${sp.key ?? ""}`, {
    headers: { cookie: h.get("cookie") ?? "" },
  });
  if (!(await studioAccessOk(fakeReq))) {
    return (
      <div style={{ padding: 48, fontFamily: "sans-serif", color: "#fff", background: "#0c1838", minHeight: "100vh" }}>
        <h1>Studio — afgeschermd</h1>
        <p>Log in als founder, of voeg <code>?key=…</code> toe aan de URL.</p>
      </div>
    );
  }
  return <StudioClient unlockKey={sp.key ?? ""} />;
}
