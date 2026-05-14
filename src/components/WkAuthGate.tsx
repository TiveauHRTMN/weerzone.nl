"use client";

import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { Lock, ArrowRight, ShieldCheck } from "lucide-react";

interface WkAuthGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

let cachedUser: User | null = null;

export function useWkUser() {
  const [user, setUser] = useState<User | null>(cachedUser);
  const [loading, setLoading] = useState(!cachedUser);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      cachedUser = data.user;
      setUser(data.user);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      cachedUser = session?.user ?? null;
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}

export default function WkAuthGate({ children, fallback }: WkAuthGateProps) {
  const { user, loading } = useWkUser();

  if (loading) return null;
  if (user) return <>{children}</>;
  return <>{fallback || <AccessPrompt />}</>;
}

function AccessPrompt() {
  return (
    <div className="mx-auto max-w-md space-y-5 overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/78 p-6 text-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
          <Lock className="h-3.5 w-3.5 text-sky-500" />
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Toegang nodig</span>
        </div>
        <h3 className="text-xl font-black text-slate-900">Log in voor Hartman WK 2026</h3>
        <p className="text-sm text-slate-600">
          Open de loginpagina, vul je naam en e-mail in en bekijk daarna de poule.
        </p>
      </div>

      <div className="space-y-2 text-center">
        <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          <ShieldCheck className="h-3 w-3" />
          Hartman WK 2026
        </div>
        <Link
          href="/wkpoule/inloggen"
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          Login openen
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
