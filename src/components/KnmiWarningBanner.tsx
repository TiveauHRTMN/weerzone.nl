import Link from "next/link";
import {
  type KNMIWarning,
  type KNMISeverity,
  formatWindowLabel,
  SEVERITY_LABEL,
  warningAdviceFor,
} from "@/lib/knmi-warnings";

const SEVERITY_STYLE: Record<KNMISeverity, { bg: string; border: string; chip: string; chipBg: string }> = {
  GREEN: { bg: "bg-emerald-500/10", border: "border-emerald-400/40", chip: "text-emerald-200", chipBg: "bg-emerald-500/20" },
  YELLOW: { bg: "bg-yellow-400/15", border: "border-yellow-400/50", chip: "text-yellow-100", chipBg: "bg-yellow-500/30" },
  ORANGE: { bg: "bg-orange-500/15", border: "border-orange-400/60", chip: "text-orange-100", chipBg: "bg-orange-500/40" },
  RED: { bg: "bg-rose-600/20", border: "border-rose-400/70", chip: "text-rose-100", chipBg: "bg-rose-600/50" },
};

interface Props {
  warnings: KNMIWarning[];
  /** Toon de "meer details" link naar /reed. Default true. */
  detailsLink?: boolean;
  /** Compact = enkel de chip + 1 regel, geen description of adviesblokken. */
  compact?: boolean;
}

export default function KnmiWarningBanner({ warnings, detailsLink = true, compact = false }: Props) {
  const active = warnings.filter((w) => w.severity !== "GREEN");
  if (active.length === 0) return null;

  const ordered = [...active].sort((a, b) => {
    const order: Record<KNMISeverity, number> = { RED: 0, ORANGE: 1, YELLOW: 2, GREEN: 3 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="max-w-4xl mx-auto px-4 pt-3">
      <div className="space-y-2">
        {ordered.map((warning) => {
          const style = SEVERITY_STYLE[warning.severity];
          const window = formatWindowLabel(warning);
          const advice = warningAdviceFor(warning);

          return (
            <div
              key={warning.key}
              className={`rounded-2xl border ${style.border} ${style.bg} backdrop-blur-sm p-3 sm:p-4`}
              role="alert"
            >
              <div className="flex items-start gap-3">
                <div className={`flex-none px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${style.chip} ${style.chipBg}`}>
                  {SEVERITY_LABEL[warning.severity]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-sm font-black text-white">{warning.type}</span>
                    <span className="text-[11px] font-medium text-white/60">{warning.province}</span>
                    {window && (
                      <span className="text-[11px] font-bold text-white/80">· {window}</span>
                    )}
                  </div>
                  {!compact && warning.description && (
                    <p className="text-xs text-white/75 leading-relaxed mt-1">
                      {warning.description.split("\n")[0]}
                    </p>
                  )}
                </div>
                {detailsLink && (
                  <Link
                    href="/reed"
                    className="flex-none text-[11px] font-bold text-white/80 hover:text-white underline underline-offset-2"
                  >
                    details
                  </Link>
                )}
              </div>

              {!compact && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-black/10 border border-white/10 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">
                      Wat kan ik verwachten?
                    </p>
                    <ul className="space-y-1.5">
                      {advice.expect.map((item) => (
                        <li key={item} className="text-xs text-white/80 leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl bg-black/10 border border-white/10 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">
                      Wat kan ik doen?
                    </p>
                    <ul className="space-y-1.5">
                      {advice.actions.map((item) => (
                        <li key={item} className="text-xs text-white/80 leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
