"use client";

import { useState } from "react";
import { joinGroupAction } from "@/app/wkpoule/actions";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function JoinGroupForm() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    setLoading(true);
    setError("");

    try {
      const res = await joinGroupAction(code);
      if (res.ok) {
        router.push("/wkpoule");
      } else {
        setError(res.error || "Onbekende fout");
        setLoading(false);
      }
    } catch (e) {
      setError("Er ging iets mis.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Groepscode</label>
        <input 
          type="text" 
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ABCDEF"
          maxLength={6}
          className="w-full p-4 rounded-xl border border-white/10 bg-[#0e1728] text-white text-xl font-black text-center tracking-widest outline-none focus:border-sky-400"
        />
      </div>

      {error && <p className="text-xs text-accent-red font-bold">{error}</p>}

      <button 
        type="submit"
        disabled={loading || !code}
        className="w-full py-4 bg-sky-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 hover:brightness-90 transition-all disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Deelnemen aan groep"}
      </button>
    </form>
  );
}
