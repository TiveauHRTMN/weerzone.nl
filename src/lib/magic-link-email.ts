import { PERSONAS, type PersonaTier } from "@/lib/personas";

export type MagicLinkMode = "signup" | "login";

/**
 * Branded WEERZONE magic-link mail.
 *
 * Twee modes:
 *   - "signup"  → activatie-copy ("Bedankt voor je aanmelding, activeer je account")
 *   - "login"   → terugkeer-copy ("Welkom terug, hier is je inloglink")
 *
 * Voor login willen we per se NIET de woorden "aanmelden" of "activeren"
 * gebruiken — dat suggereert dat de gebruiker een nieuw account maakt en
 * verklaart de support-vraag "ik moest opnieuw een account aanmaken".
 */
export function getBrandedMagicLinkHtml(
  tier: PersonaTier,
  actionLink: string,
  name: string,
  mode: MagicLinkMode = "signup",
): string {
  const persona = PERSONAS[tier];
  const isLogin = mode === "login";

  const headline = isLogin
    ? "Welkom terug 👋"
    : "Eén klik verwijderd van de data 🚀";
  const greeting = isLogin
    ? `Hé ${name || "weerliefhebber"},`
    : `Hé ${name || "weerliefhebber"},`;
  const body = isLogin
    ? `Klik op de knop hieronder om in te loggen. Je komt direct in je dashboard. Geen wachtwoord nodig — deze link is 1 uur geldig.`
    : `Bedankt voor je aanmelding bij WEERZONE. Je hebt gekozen voor ${persona.name}. Klik op de knop hieronder om je account te activeren en direct je dashboard te bekijken.`;
  const ctaLabel = isLogin ? "Inloggen →" : "Activeer mijn account →";
  const footerWhy = isLogin
    ? "Je ontvangt deze mail omdat er een inloglink is aangevraagd voor jouw account op weerzone.nl. Niet jij geweest? Negeer deze mail."
    : "Je ontvangt deze mail omdat je je hebt aangemeld op weerzone.nl.";

  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isLogin ? "Inloggen bij WEERZONE" : "Welkom bij WEERZONE"}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:20px auto;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.05);border:1px solid #e2e8f0;">

    <!-- HEADER -->
    <div style="background:linear-gradient(135deg, ${persona.color} 0%, #1e293b 100%);padding:40px 30px;text-align:center;">
      <div style="font-size:12px;font-weight:900;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;">WEERZONE · ${persona.name.toUpperCase()}</div>
      <h1 style="color:#ffffff;font-size:28px;font-weight:900;margin:0;text-transform:uppercase;letter-spacing:-0.5px;">${headline}</h1>
    </div>

    <!-- CONTENT -->
    <div style="padding:40px 30px;text-align:center;">
      <p style="font-size:18px;color:#1e293b;font-weight:700;margin:0 0 16px;">${greeting}</p>
      <p style="font-size:15px;color:#475569;line-height:1.6;margin:0 0 32px;">${body}</p>

      <!-- CTA BUTTON -->
      <a href="${actionLink}" style="display:inline-block;background-color:${persona.color};color:#ffffff;padding:18px 40px;border-radius:100px;text-decoration:none;font-weight:900;font-size:16px;text-transform:uppercase;box-shadow:0 8px 20px ${persona.color}40;">
        ${ctaLabel}
      </a>

      <p style="font-size:12px;color:#94a3b8;margin-top:32px;line-height:1.5;">
        Werkt de knop niet? Kopieer en plak deze link in je browser:<br>
        <a href="${actionLink}" style="color:${persona.color};text-decoration:underline;">${actionLink}</a>
      </p>
    </div>

    <!-- FOOTER -->
    <div style="background-color:#f8fafc;padding:30px;text-align:center;border-top:1px solid #f1f5f9;">
      <p style="margin:0;font-size:13px;color:#1e293b;font-weight:800;text-transform:uppercase;letter-spacing:1px;">48 uur vooruit. De rest is ruis.</p>
      <p style="margin:8px 0 0;font-size:11px;color:#94a3b8;">${footerWhy}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
