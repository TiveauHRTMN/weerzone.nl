export type WkInvite = {
  code: string;
  label: string;
};

const DEFAULT_INVITES: WkInvite[] = [
  { code: "HARTMAN-WK-2026", label: "Hartman" },
];

function parseInviteLine(line: string): WkInvite | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const separator = trimmed.includes("|") ? "|" : trimmed.includes(":") ? ":" : null;
  if (!separator) {
    return { code: trimmed.toUpperCase(), label: trimmed };
  }

  const [rawCode, rawLabel] = trimmed.split(separator, 2);
  const code = rawCode.trim().toUpperCase();
  const label = rawLabel.trim() || code;
  if (!code) return null;
  return { code, label };
}

export function getWkInvites(): WkInvite[] {
  const raw = process.env.WK_POULE_INVITES || process.env.NEXT_PUBLIC_WK_POULE_INVITES || "";
  const parsed = raw
    .split(/[\r\n,]+/)
    .map(parseInviteLine)
    .filter((invite): invite is WkInvite => Boolean(invite));

  return parsed.length ? parsed : DEFAULT_INVITES;
}

export function findWkInvite(code: string | null | undefined): WkInvite | null {
  const normalized = (code || "").trim().toUpperCase();
  if (!normalized) return null;
  return getWkInvites().find((invite) => invite.code === normalized) ?? null;
}

export const WK_POULE_LOGIN_PATH = "/wkpoule/inloggen";
