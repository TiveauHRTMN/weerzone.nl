"use client";

import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { Lock, Mail, MapPin, Zap, Shield, TrendingUp } from "lucide-react";

interface AuthGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Lichtgewicht auth context — geen provider nodig
let cachedUser: User | null = null;

export function useUser() {
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

export default function AuthGate({ children, fallback }: AuthGateProps) {
  const { user, loading } = useUser();

  if (loading) return null;
  if (user) return <>{children}</>;
  return <>{fallback || <LoginPrompt />}</>;
}

function LoginPrompt() {
  const [email, setEmail] = useState("");
  const [postcode, setPostcode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !postcode) {
      setError("Vul je e-mail en postcode in.");
      return;
    }
    if (!/^\d{4}\s?[A-Za-z]{2}$/.test(postcode.trim())) {
      setError("Ongeldige postcode. Gebruik formaat: 1234 AB");
      return;
    }

    if (!isSupabaseConfigured()) {
      // Demo mode — toon dat login werkt maar Supabase nog niet geconfigureerd is
      setSent(true);
      return;
    }

    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          data: { postcode: postcode.trim().toUpperCase() },
        },
      });
      if (authError) throw authError;
      setSent(true);
    } catch {
      setError("Er ging iets mis. Probeer het opnieuw.");
    }
  };

  if (sent) {
    return (
      <div className="card p-6 text-center space-y-3">
        <div className="text-3xl">📬</div>
        <h3 className="text-lg font-bold text-text-primary">Check je inbox</h3>
        <p className="text-sm text-text-secondary">
          We hebben een magic link gestuurd naar <strong>{email}</strong>. Klik erop en je bent binnen.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6 space-y-5">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-orange/15 rounded-full">
          <Lock className="w-3.5 h-3.5 text-accent-orange" />
          <span className="text-xs font-bold text-accent-orange uppercase tracking-wider">Premium</span>
        </div>
        <h3 className="text-xl font-black text-text-primary">De echte power zit achter de deur</h3>
        <p className="text-sm text-text-secondary">
          Gratis account. Geen creditcard. Wel de data die je nodig hebt.
        </p>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 gap-2">
        {[
          { icon: Zap, text: "48-uurs Impact Analyse per postcode" },
          { icon: Shield, text: "Extreme weer-alerts direct in je inbox" },
          { icon: TrendingUp, text: "AI-kledingadvies op basis van je dag" },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2.5 text-sm text-text-primary">
            <Icon className="w-4 h-4 text-accent-orange shrink-0" />
            <span>{text}</span>
          </div>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-3">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            placeholder="je@email.nl"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-black/10 bg-white/70 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent-orange/40 focus:ring-2 focus:ring-accent-orange/10"
          />
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={postcode}
            onChange={(e) => { setPostcode(e.target.value); setError(""); }}
            placeholder="1234 AB"
            maxLength={7}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-black/10 bg-white/70 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent-orange/40 focus:ring-2 focus:ring-accent-orange/10"
          />
        </div>
        {error && <p className="text-xs text-accent-red font-semibold">{error}</p>}
        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-accent-orange text-text-primary text-sm font-bold hover:brightness-90 transition-all active:scale-[0.98]"
        >
          Gratis account aanmaken
        </button>
      </form>

      <p className="text-[10px] text-text-muted text-center">
        Je postcode gebruiken we voor hyperlocale alerts. Niks anders. Beloofd.
      </p>
    </div>
  );
}
