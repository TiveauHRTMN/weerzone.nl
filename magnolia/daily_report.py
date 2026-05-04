import os
import httpx
from datetime import datetime
from dotenv import load_dotenv

import check_history
import guardian_jito
import banker_jlp

load_dotenv()
RESEND_API_KEY = os.getenv("RESEND_API_KEY")

def get_report_data():
    wallet = check_history.get_wallet_address()
    balance = check_history.check_balance(wallet)
    
    jito_sol = next((t['balance'] for t in balance.get('tokens', []) if t['symbol'] == 'JitoSOL'), 0)
    jlp = next((t['balance'] for t in balance.get('tokens', []) if t['symbol'] == 'JLP'), 0)
    
    now = datetime.now()
    is_sunday = now.strftime("%A") == "Sunday"
    
    return {
        "timestamp": now.strftime("%d %b %Y"),
        "sol": balance.get("sol_balance", 0),
        "jito_sol": jito_sol,
        "jlp": jlp,
        "heat": "3/3 (Routine: Ma-Wo-Vr)",
        "is_sunday": is_sunday
    }

def send_email(report):
    if not RESEND_API_KEY: return False
    
    weekly_section = ""
    if report["is_sunday"]:
        weekly_section = """
        <div style="margin-top: 20px; background: #fff3cd; padding: 15px; border-radius: 8px; border: 1px solid #ffeeba;">
            <h3 style="color: #856404;">📅 Weekly Recap & Forecast</h3>
            <p>De vloot heeft deze week stabiel gepresteerd. We focussen komende week op de 6 mei kapitaalinjectie en de eerste echte inzet van de Strategist (Opus 4.7).</p>
        </div>
        """
    
    html_content = f"""
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
        <h1 style="color: #1a1a1a; text-align: center;">Magnolia 2.0: Daily Log</h1>
        <p style="text-align: center; color: #555;">Status report voor {report['timestamp']}</p>
        
        <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #333;">💰 Vloot Balans</h3>
            <p><strong>SOL:</strong> {report['sol']:.4f}</p>
            <p><strong>JitoSOL:</strong> {report['jito_sol']:.4f}</p>
            <p><strong>JLP:</strong> {report['jlp']:.4f}</p>
        </div>

        <div style="margin-top: 20px; background: #e8f4fd; padding: 15px; border-radius: 8px;">
            <h3 style="color: #0077b6;">🦅 Airdrop Heat</h3>
            <p><strong>Status:</strong> {report['heat']}</p>
            <p style="font-size: 0.8em;">Jupuary 2027 snapshot: <strong>In progress.</strong></p>
        </div>
        
        {weekly_section}

        <p style="margin-top: 20px; text-align: center; font-style: italic; color: #666;">
            "Elke trade is een steen in het fundament van Tiveau."
        </p>
    </div>
    """

    payload = {
        "from": "Magnolia <onboarding@resend.dev>",
        "to": ["info@weerzone.nl"],
        "subject": f"🚀 {'WEEKLY FORECAST' if report['is_sunday'] else 'Magnolia Daily'}: {report['timestamp']}",
        "html": html_content
    }

    httpx.post("https://api.resend.com/emails", headers={"Authorization": f"Bearer {RESEND_API_KEY}"}, json=payload)
    return True

if __name__ == "__main__":
    data = get_report_data()
    send_email(data)
