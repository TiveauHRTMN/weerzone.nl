import { PERSONAS, type PersonaTier } from "@/lib/personas";
import type { PersonaBrief } from "@/lib/persona-brief";

export interface EmailAmazonTip {
  title: string;
  subtitle?: string;
  price?: string;
  url: string;
  emoji?: string;
  color?: string; // hex voor achtergrond-accent
}

/**
 * HTML-template voor de dagelijkse persona-brief. Bewust sober gehouden —
 * inbox-first, mobile-first. Kleurvlak = persona-kleur, niet de huisstijl.
 */
export function buildPersonaEmailHtml(
  tier: PersonaTier,
  brief: PersonaBrief,
  city: string,
  unsubscribeUrl: string,
  amazonTip?: EmailAmazonTip,
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

  ${amazonTip ? renderAmazonTip(amazonTip, p.name) : ""}

  <div style="padding:16px 24px;font-size:11px;color:#999;text-align:center;background:#fafafa;">
    Dit is je ${escapeHtml(p.label.toLowerCase())}-brief.
    Niet meer ontvangen? <a href="${unsubscribeUrl}" style="color:#999;">Uitschrijven</a>.
    WEERZONE — 48 uur vooruit. De rest is ruis.
  </div>
</div>
</body>
</html>`;
}

function renderAmazonTip(tip: EmailAmazonTip, personaName: string): string {
  const bg = tip.color ? `${tip.color}1a` : "#fef3e8";
  const border = tip.color ? `${tip.color}55` : "#f5a15f";
  return `
  <div style="padding:0 24px 20px 24px;">
    <a href="${escapeAttr(tip.url)}" target="_blank" rel="noopener sponsored" style="display:block;text-decoration:none;color:inherit;border:1px solid ${border};background:${bg};border-radius:14px;padding:14px 16px;">
      <div style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#b45309;font-weight:800;margin-bottom:6px;">
        ${escapeHtml(personaName)}'s tip · Amazon
      </div>
      <div style="display:flex;align-items:center;gap:12px;">
        ${tip.emoji ? `<div style="font-size:32px;line-height:1;">${escapeHtml(tip.emoji)}</div>` : ""}
        <div style="flex:1;min-width:0;">
          <div style="font-size:14px;font-weight:800;color:#1a1a1a;line-height:1.3;">${escapeHtml(tip.title)}</div>
          ${tip.subtitle ? `<div style="font-size:12px;color:#555;margin-top:2px;line-height:1.35;">${escapeHtml(tip.subtitle)}</div>` : ""}
          ${tip.price ? `<div style="font-size:13px;font-weight:900;color:#1a1a1a;margin-top:4px;">${escapeHtml(tip.price)} <span style="color:#b45309;font-weight:700;">· Bekijk →</span></div>` : `<div style="font-size:12px;font-weight:800;color:#b45309;margin-top:4px;">Bekijk op Amazon →</div>`}
        </div>
      </div>
    </a>
    <div style="font-size:10px;color:#999;margin-top:6px;text-align:center;">
      Als je hier iets koopt, krijgt WEERZONE een kleine commissie. Prijs blijft gelijk.
    </div>
  </div>`;
}

function escapeAttr(str: string): string {
  return escapeHtml(str);
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
