"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { WX_QUERY_KEY, WX_SCENARIOS } from "@/lib/wx-scenarios";

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

export default function WeatherScenarioToggle() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const current = searchParams?.get(WX_QUERY_KEY) ?? null;

  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setVisible(isDevHost(window.location.hostname));
  }, []);

  if (!visible) return null;

  function applyScenario(scenarioKey: string | null) {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (scenarioKey) {
      params.set(WX_QUERY_KEY, scenarioKey);
    } else {
      params.delete(WX_QUERY_KEY);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const currentLabel = current
    ? WX_SCENARIOS.find((s) => s.key === current)?.label ?? "Onbekend"
    : "🌐 Echt weer";

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] select-none"
      style={{ fontFamily: "var(--font-mono, ui-monospace, monospace)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold text-white transition-all"
        style={{
          background: "rgba(15, 26, 44, 0.85)",
          backdropFilter: "blur(12px) saturate(180%)",
          WebkitBackdropFilter: "blur(12px) saturate(180%)",
          boxShadow:
            "0 4px 12px rgba(0,0,0,0.20), 0 1px 3px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.10)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
        title={open ? "Sluit dev-toggle" : "Open WX dev-toggle"}
      >
        <span className="opacity-60">WX</span>
        <span>{currentLabel}</span>
        <span className="opacity-50">{open ? "▾" : "▴"}</span>
      </button>

      {open && (
        <div
          className="absolute bottom-full right-0 mb-2 rounded-2xl overflow-hidden min-w-[230px] max-h-[60vh] overflow-y-auto"
          style={{
            background: "rgba(15, 26, 44, 0.92)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            boxShadow:
              "0 20px 50px rgba(0,0,0,0.40), 0 6px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.10)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-white/40 border-b border-white/8"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            Dev · forceer weersituatie
          </div>

          <button
            type="button"
            onClick={() => {
              applyScenario(null);
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-[12px] text-white/85 hover:bg-white/8 transition-colors flex items-center gap-2"
            style={{
              background: !current ? "rgba(255,255,255,0.08)" : "transparent",
              fontWeight: !current ? 700 : 500,
            }}
          >
            <span>🌐</span>
            <span>Echt weer (geen override)</span>
          </button>

          <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

          {WX_SCENARIOS.map((s) => {
            const active = current === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => {
                  applyScenario(s.key);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-[12px] text-white/80 hover:bg-white/8 transition-colors flex items-center"
                style={{
                  background: active ? "rgba(255, 210, 26, 0.16)" : "transparent",
                  fontWeight: active ? 700 : 500,
                  color: active ? "#ffd21a" : "rgba(255,255,255,0.80)",
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
