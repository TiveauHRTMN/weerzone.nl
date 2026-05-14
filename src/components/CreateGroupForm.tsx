"use client";

import { useState } from "react";
import { createGroupAction } from "@/app/wkpoule/actions";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

export default function CreateGroupForm() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);

    try {
      const res = await createGroupAction(name);
      if (res.ok && res.groupId) {
        router.push(`/wkpoule/groep/${res.groupId}`);
      } else {
        setLoading(false);
      }
    } catch (e) {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Groepsnaam</label>
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Bijv. Familie Jansen of De Voetbalvrienden"
          className="w-full p-4 rounded-xl border border-white/10 bg-[#0e1728] text-white text-lg font-bold outline-none focus:border-emerald-400"
        />
      </div>

      <button 
        type="submit"
        disabled={loading || !name}
        className="w-full py-4 bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 hover:brightness-90 transition-all disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
          <><Plus className="w-5 h-5" /> Groep aanmaken</>
        )}
      </button>
    </form>
  );
}
