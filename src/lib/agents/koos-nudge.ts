const KOOS_NUDGE_CADENCE_MS = 72 * 60 * 60 * 1000;

export function shouldSendKoosNudge(lastSentAt: string | null | undefined, now = new Date()): boolean {
  if (!lastSentAt) return true;
  const lastSent = new Date(lastSentAt).getTime();
  return Number.isNaN(lastSent) || now.getTime() - lastSent >= KOOS_NUDGE_CADENCE_MS;
}

export function koosWeekendDayIndex(now = new Date()): number | null {
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "Europe/Amsterdam",
  }).format(now);
  return weekday === "Thu" ? 2 : null;
}
