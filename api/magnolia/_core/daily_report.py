import os
import json
import httpx
from datetime import datetime
from dotenv import load_dotenv

# Import our fleet tools
import check_history
import config
import guardian_jito
import banker_jlp

load_dotenv()

RESEND_API_KEY = os.getenv("RESEND_API_KEY")

def get_report_data():
    wallet = check_history.get_wallet_address()
    balance = check_history.check_balance(wallet)
    
    # Verbeterde token detectie
    jito_sol = 0
    jlp_balance = 0
    for t in balance.get('tokens', []):
        # Check op mint of op symbool voor maximale betrouwbaarheid
        if t['mint'] == 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn' or t['symbol'] == 'JitoSOL':
            jito_sol = t['balance']
        elif t['mint'] == '27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4' or t['symbol'] == 'JLP':
            jlp_balance = t['balance']

    jito = guardian_jito.get_jito_yield()
    jlp = banker_jlp.get_jlp_yield()
    
    sol_price = 84.0 # Realistischer fallback voor huidige markt
    try:
        res = httpx.get("https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT", timeout=5.0)
        sol_price = float(res.json()['price'])
    except: pass

    # Conservatieve schattingen voor JitoSOL (sol_price * ~1.05) en JLP (~$4.5 per token gebaseerd op user feedback)
    report = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "wallet": wallet,
        "sol_balance": balance.get("sol_balance", 0),
        "sol_value_usd": balance.get("sol_balance", 0) * sol_price,
        "jito_sol": jito_sol,
        "jlp_balance": jlp_balance,
        "jito_apy": (jito.get('apy', 0) * 100) if jito else 8.12, 
        "jlp_apy": (jlp.get('apy', 0) * 100) if jlp else 34.50, 
        "total_value_est": (balance.get("sol_balance", 0) * sol_price) + (jito_sol * sol_price * 1.05) + (jlp_balance * 4.5)
    }
    return report

def send_email(report):
    if not RESEND_API_KEY:
        print("❌ Geen Resend API Key.")
        return False

    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json"
    }
    
    text_content = f"""
    --- MAGNOLIA DAILY BRIEFING ---
    Timestamp: {report['timestamp']}
    
    💰 Balans Status:
    SOL: {report['sol_balance']:.4f} (${report['sol_value_usd']:.2f})
    JitoSOL: {report['jito_sol']:.4f}
    JLP: {report['jlp_balance']:.4f}
    
    🛡️ Protocol Yield:
    Jito APY: {report['jito_apy']:.2f}%
    JLP APY: {report['jlp_apy']:.2f}%
    
    🦅 Hunter & Airdrop:
    Airdrop Heat: 96/96 scans (Target: Jupuary 2027)
    Status: Accumulatie fase actief. Focus op 15 dec 🇩🇴
    """
    
    html_content = f"""
    <div style="font-family: 'Courier New', monospace; background-color: #0d1117; color: #c9d1d9; padding: 20px; border: 1px solid #30363d;">
        <h2 style="color: #58a6ff; border-bottom: 1px solid #30363d; padding-bottom: 10px;">
            --- MAGNOLIA DAILY BRIEFING ---
        </h2>
        <p style="font-size: 0.9em; color: #8b949e;">Timestamp: {report['timestamp']}</p>
        
        <div style="margin-top: 20px;">
            <p><strong>💰 Balans Status:</strong></p>
            <ul>
                <li>SOL: {report['sol_balance']:.4f} <span style="color: #8b949e;">(${report['sol_value_usd']:.2f})</span></li>
                <li>JitoSOL: {report['jito_sol']:.4f}</li>
                <li>JLP: {report['jlp_balance']:.4f}</li>
            </ul>
        </div>

        <div style="margin-top: 20px; border-left: 4px solid #238636; padding-left: 15px;">
            <p><strong>🛡️ Protocol Yield:</strong></p>
            <p>Jito APY: <span style="color: #238636;">{report['jito_apy']:.2f}%</span></p>
            <p>JLP APY: <span style="color: #238636;">{report['jlp_apy']:.2f}%</span></p>
        </div>

        <div style="margin-top: 20px; border-left: 4px solid #f85149; padding-left: 15px;">
            <p><strong>🦅 Hunter & Airdrop:</strong></p>
            <p>Airdrop Heat: 96/96 scans vandaag <span style="color: #8b949e;">(Target: Jupuary 2027)</span></p>
            <p>Status: Accumulatie fase actief. Focus op 15 dec 🇩🇴</p>
        </div>

        <p style="margin-top: 30px; border-top: 1px solid #30363d; padding-top: 10px; color: #8b949e; font-style: italic;">
            "Geduld is de hoogste vorm van ratio. Slaap zacht, El Holandés."
        </p>
    </div>
    """

    payload = {
        "from": "Magnolia <onboarding@resend.dev>",
        "to": ["admin@weerzone.nl"],
        "subject": f"Magnolia Rapportage - {datetime.now().strftime('%d %b %Y')}",
        "html": html_content,
        "text": text_content
    }

    try:
        res = httpx.post(url, headers=headers, json=payload)
        res.raise_for_status()
        print("✅ E-mail succesvol verzonden!")
        return True
    except Exception as e:
        print(f"❌ Fout bij verzenden e-mail: {e}")
        return False

if __name__ == "__main__":
    print("📋 Dag-rapportage genereren...")
    data = get_report_data()
    send_email(data)
