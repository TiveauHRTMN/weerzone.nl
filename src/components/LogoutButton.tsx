"use client";

import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Kleine logout-knop. Roept supabase.auth.signOut() aan,
 * spoelt de sessie-cookies, en stuurt door naar de homepage.
 */
export default function LogoutButton({
  className = "",
  label = "Uitloggen",
}: {
  className?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } finally {
      // Hard reload naar / zodat server-components een verse sessie-check doen
      window.location.href = "/";
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-text-primary transition-colors disabled:opacity-50 ${className}`}
      aria-label="Uitloggen"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
      ) : (
        <LogOut className="w-3.5 h-3.5" aria-hidden />
      )}
      {label}
    </button>
  );
}
