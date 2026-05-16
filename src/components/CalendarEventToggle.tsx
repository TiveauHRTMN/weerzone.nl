"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CAL_QUERY_KEY, CALENDAR_EVENTS } from "@/lib/calendar-events";

function isDevHost(host: string): boolean {
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".local") ||
    host.startsWith("192.168.") ||
    host.startsWith("10.") ||
    host.startsWith("172.")
  );
}

export default function CalendarEventToggle() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const current = searchParams?.get(CAL_QUERY_KEY) ?? null;

  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setVisible(isDevHost(window.location.hostname));
  }, []);

  if (!visible) return null;

  function applyEvent(eventKey: string | null) {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (eventKey) {
      params.set(CAL_QUERY_KEY, eventKey);
    } else {
      params.delete(CAL_QUERY_KEY);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const currentLabel =
    !current
      ? "📅 Auto"
      : current === "off"
        ? "🚫 Uit"
        : CALENDAR_EVENTS.find((e) => e.key === current)?.label ?? "Onbekend";

  return (
    <div
      className="fixed bottom-16 right-4 z-[100] select-none"
      style={{ fontFamily: "var(--font-mono, ui-monospace, monospace)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold text-white transition-all"
        style={{
          background: "rgba(40, 20, 60, 0.85)",
          backdropFilter: "blur(12px) saturate(180%)",
          WebkitBackdropFilter: "blur(12px) saturate(180%)",
          boxShadow:
            "0 4px 12px rgba(0,0,0,0.20), 0 1px 3px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.10)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
        title={open ? "Sluit calendar-toggle" : "Open calendar dev-toggle"}
      >
        <span className="opacity-60">CAL</span>
        <span>{currentLabel}</span>
        <span className="opacity-50">{open ? "▾" : "▴"}</span>
      </button>

      {open && (
        <div
          className="absolute bottom-full right-0 mb-2 rounded-2xl overflow-hidden min-w-[230px]"
          style={{
            background: "rgba(40, 20, 60, 0.92)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            boxShadow:
              "0 20px 50px rgba(0,0,0,0.40), 0 6px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.10)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-white/40 border-b"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            Dev · forceer kalender-event
          </div>

          <button
            type="button"
            onClick={() => {
              applyEvent(null);
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-[12px] text-white/85 hover:bg-white/8 transition-colors flex items-center gap-2"
            style={{
              background: !current ? "rgba(255,255,255,0.08)" : "transparent",
              fontWeight: !current ? 700 : 500,
            }}
          >
            <span>📅</span>
            <span>Auto-detect (op datum + locale)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              applyEvent("off");
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-[12px] text-white/70 hover:bg-white/8 transition-colors flex items-center gap-2"
            style={{
              background: current === "off" ? "rgba(255,255,255,0.08)" : "transparent",
              fontWeight: current === "off" ? 700 : 500,
            }}
          >
            <span>🚫</span>
            <span>Geen event (forceer uit)</span>
          </button>

          <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

          {CALENDAR_EVENTS.map((e) => {
            const active = current === e.key;
            return (
              <button
                key={e.key}
                type="button"
                onClick={() => {
                  applyEvent(e.key);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-[12px] hover:bg-white/8 transition-colors flex items-center"
                style={{
                  background: active ? "rgba(192, 132, 252, 0.18)" : "transparent",
                  fontWeight: active ? 700 : 500,
                  color: active ? "#c084fc" : "rgba(255,255,255,0.80)",
                }}
              >
                {e.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
