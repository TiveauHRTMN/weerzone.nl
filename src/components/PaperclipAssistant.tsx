"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "@/lib/session-context";

interface Message {
  id: string;
  text: string;
  persona: "PIET" | "REED" | "STEVE";
  actionLabel?: string;
  actionUrl?: string;
}

export default function PaperclipAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const { tier } = useSession();

  // "Heartbeat" logic: Check for proactive opportunities
  useEffect(() => {
    // Geef de gebruiker even de tijd om te landen
    const timer = setTimeout(() => {
      // Mockup of an AI "Task" being completed by Steve
      setMessage({
        id: "init",
        text: "Pst... Steve hier. Ik zie dat er wat regen aan komt in de regio. Heb je die 'Impulse Deal' voor die slimme paraplu al gezien? Bespaart je 40%!",
        persona: "STEVE",
        actionLabel: "BEKIJK DEAL",
        actionUrl: "#deals"
      });
      setIsOpen(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (tier === "premium") return null; // Premium users get no "labor"

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3 pointer-events-none">
      <AnimatePresence>
        {isOpen && message && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="pointer-events-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 max-w-[280px] relative overflow-hidden"
          >
            {/* Persona Indicator */}
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${
                message.persona === "PIET" ? "bg-accent-orange" : 
                message.persona === "REED" ? "bg-red-600" : "bg-accent-cyan"
              }`} />
              <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">
                AI LABOR: {message.persona}
              </span>
            </div>

            <p className="text-sm font-medium text-slate-800 leading-tight">
              {message.text}
            </p>

            {message.actionLabel && (
              <a
                href={message.actionUrl}
                className="mt-3 block text-center py-2 px-4 bg-black text-white text-[11px] font-bold rounded-xl hover:bg-slate-800 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {message.actionLabel}
              </a>
            )}

            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 text-slate-300 hover:text-slate-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto w-14 h-14 bg-white rounded-full shadow-xl border-2 border-slate-100 flex items-center justify-center group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100 opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="text-3xl filter grayscale group-hover:grayscale-0 transition-all">🖇️</span>
        
        {/* Connection Pulse */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
      </motion.button>
    </div>
  );
}
