"use client";
import { useState } from "react";
import type { SubscriberPrefs } from "@/lib/subscriber-prefs";

export default function VoorkeurenForm({ token, initial }: { token: string; initial: SubscriberPrefs }) {
  const [reed, setReed] = useState(initial.reed_on);
  const [koos, setKoos] = useState(initial.koos_on);
  const [saved, setSaved] = useState(false);

  async function save(patch: Record<string, unknown>) {
    setSaved(false);
    await fetch("/api/preferences", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, ...patch }) });
    setSaved(true);
  }
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-3"><input type="checkbox" checked={reed} onChange={(e) => { setReed(e.target.checked); save({ reed_on: e.target.checked }); }} /> Reed — waarschuwing bij onweer, zware regen of storm</label>
      <label className="flex items-center gap-3"><input type="checkbox" checked={koos} onChange={(e) => { setKoos(e.target.checked); save({ koos_on: e.target.checked }); }} /> Koos — tips voor een dagje weg</label>
      {saved && <p className="text-xs text-emerald-600">Opgeslagen.</p>}
      <button onClick={() => save({ active: false })} className="text-xs text-rose-500 underline">Uitschrijven voor alles</button>
    </div>
  );
}
