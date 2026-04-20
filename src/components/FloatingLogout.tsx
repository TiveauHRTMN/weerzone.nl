"use client";

import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { useSession } from "@/lib/session-context";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Kleine chip rechtsboven die alleen verschijnt als er een sessie is.
 * Zo kan je overal uitloggen, niet alleen op /app.
 */
export default function FloatingLogout() {
  const { user, loading: sessionLoading } = useSession();
  const [loading, setLoading] = useState(false);

  if (sessionLoading || !user) return null;

  async function handleLogout() {
    if (loading) return;
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } finally {
      window.location.href = "/";
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="fixed top-3 right-3 z-50 inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-3 py-1.5 text-[11px] font-bold text-text-primary shadow-lg border border-black/5 hover:bg-white active:scale-[0.97] disabled:opacity-60 transition-all"
      aria-label="Uitloggen"
      title={user.email ?? "Uitloggen"}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
      ) : (
        <LogOut className="w-3.5 h-3.5" aria-hidden />
      )}
      <span className="hidden sm:inline">Uitloggen</span>
    </button>
  );
}
