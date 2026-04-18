import { PERSONAS, type PersonaTier } from "@/lib/personas";
import type { PersonaBrief } from "@/lib/persona-brief";

/**
 * HTML-template voor de dagelijkse persona-brief. Bewust sober gehouden —
 * inbox-first, mobile-first. Kleurvlak = persona-kleur, niet de huisstijl.
 */
export function buildPersonaEmailHtml(
  tier: PersonaTier,
  brief: PersonaBrief,
  city: string,
  unsubscribeUrl: string,
): string {
  const p = PERSONAS[tier];
  const date = new Date().toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const bullets = brief.details
    .map(
      (d) =>
        `<li style="margin:0 0 8px 0;line-height:1.55;color:#1a1a1a;">${escapeHtml(d)}</li>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapeHtml(brief.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;">
<div style="max-width:560px;margin:0 auto;background:#ffffff;">
  <div style="background:${p.color};padding:20px 24px;color:#ffffff;">
    <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:0.85;">WEERZONE · ${escapeHtml(p.name)}</div>
    <div style="font-size:22px;font-weight:900;margin-top:4px;">${escapeHtml(city)} — ${escapeHtml(date)}</div>
  </div>

  <div style="padding:28px 24px 8px 24px;">
    <p style="margin:0 0 16px 0;font-size:16px;font-weight:700;">${escapeHtml(brief.greeting)}</p>
    <p style="margin:0 0 20px 0;font-size:16px;line-height:1.6;">${escapeHtml(brief.verdict)}</p>

    ${
      bullets
        ? `<ul style="margin:0 0 20px 0;padding:0 0 0 20px;font-size:15px;">${bullets}</ul>`
        : ""
    }

    <p style="margin:24px 0 4px 0;font-size:14px;color:#555;font-style:italic;">${escapeHtml(brief.closing)}</p>
    <p style="margin:0;font-size:13px;color:#777;">— ${escapeHtml(p.name)}</p>
  </div>

  <div style="padding:20px 24px 28px 24px;border-top:1px solid #eee;margin-top:20px;">
    <a href="https://weerzone.nl/app" style="display:inline-block;background:${p.color};color:#ffffff;text-decoration:none;font-weight:800;padding:10px 18px;border-radius:999px;font-size:13px;">
      Open dashboard
    </a>
  </div>

  <div style="padding:16px 24px;font-size:11px;color:#999;text-align:center;background:#fafafa;">
    Dit is je ${escapeHtml(p.label.toLowerCase())}-brief.
    Niet meer ontvangen? <a href="${unsubscribeUrl}" style="color:#999;">Uitschrijven</a>.
    WEERZONE — 48 uur vooruit. De rest is ruis.
  </div>
</div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
