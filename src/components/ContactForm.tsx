"use client";

import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      if (res.ok) {
        setStatus("ok");
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setStatus("err");
      }
    } catch {
      setStatus("err");
    }
  };

  if (status === "ok") {
    return (
      <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6 text-center">
        <div className="text-4xl mb-2">✅</div>
        <p className="font-black text-white text-xl mb-1">Verstuurd.</p>
        <p className="text-sm text-white/70">We lezen alles en antwoorden binnen 24u op werkdagen.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        type="text"
        required
        placeholder="Je naam"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-accent-orange"
      />
      <input
        type="email"
        required
        placeholder="Je e-mailadres"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-accent-orange"
      />
      <textarea
        required
        placeholder="Je bericht…"
        rows={5}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-accent-orange resize-none"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full py-3 rounded-xl bg-accent-orange text-slate-900 font-bold hover:brightness-95 transition-all disabled:opacity-60"
      >
        {status === "sending" ? "Bezig…" : "Verstuur bericht"}
      </button>
      {status === "err" && (
        <p className="text-sm text-red-400 text-center">
          Ging iets mis. Probeer opnieuw of mail direct naar info@weerzone.nl.
        </p>
      )}
    </form>
  );
}
