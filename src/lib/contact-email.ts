/**
 * De "WeerZone House Style" Contact Bevestiging mail.
 */
export function getContactConfirmationHtml(name: string): string {
  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bedankt voor je bericht — WEERZONE</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:20px auto;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.05);border:1px solid #e2e8f0;">
    
    <!-- HEADER -->
    <div style="background:linear-gradient(135deg, #f97316 0%, #1e293b 100%);padding:40px 30px;text-align:center;">
      <div style="font-size:12px;font-weight:900;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;">WEERZONE · CONTACT</div>
      <h1 style="color:#ffffff;font-size:28px;font-weight:900;margin:0;text-transform:uppercase;letter-spacing:-0.5px;">Bericht ontvangen 📥</h1>
    </div>

    <!-- CONTENT -->
    <div style="padding:40px 30px;text-align:center;">
      <p style="font-size:18px;color:#1e293b;font-weight:700;margin:0 0 16px;">Hé ${name || 'weerliefhebber'},</p>
      <p style="font-size:15px;color:#475569;line-height:1.6;margin:0 0 32px;">
        Bedankt voor je bericht aan WEERZONE. We hebben je gegevens in goede orde ontvangen. 
        <br><br>
        We lezen alles en proberen je op werkdagen binnen 24 uur een inhoudelijke reactie te sturen. 
      </p>

      <!-- BRAND STATEMENT -->
      <div style="background-color:#f8fafc;padding:20px;border-radius:16px;border:1px solid #f1f5f9;margin-bottom:32px;">
        <p style="margin:0;font-size:14px;color:#1e293b;font-weight:700;">Wist je dat?</p>
        <p style="margin:8px 0 0;font-size:13px;color:#64748b;line-height:1.5;">
          WeerZone voorspelt op 1 bij 1 kilometer precies. Dat is 10x nauwkeuriger op straatniveau dan standaard modellen.
        </p>
      </div>

      <a href="https://weerzone.nl" style="display:inline-block;background-color:#f97316;color:#ffffff;padding:16px 32px;border-radius:100px;text-decoration:none;font-weight:900;font-size:14px;text-transform:uppercase;">
        Terug naar de website →
      </a>
    </div>

    <!-- FOOTER -->
    <div style="background-color:#f8fafc;padding:30px;text-align:center;border-top:1px solid #f1f5f9;">
      <p style="margin:0;font-size:13px;color:#1e293b;font-weight:800;text-transform:uppercase;letter-spacing:1px;">48 uur vooruit. De rest is ruis.</p>
      <p style="margin:8px 0 0;font-size:11px;color:#94a3b8;">Je ontvangt deze mail als bevestiging van je contactaanvraag op weerzone.nl.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
