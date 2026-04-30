import os
import json
import time
import sys
from google import genai
from google.genai import types

# Het Syndicaat
import config
import check_history
import jupiter_swap
import kiloclaw_scraper
import paperclip_optimizer
import hermes_logger
import kamino_vault

client = genai.Client(api_key=config.GEMINI_API_KEY) if config.GEMINI_API_KEY else None

def get_market_context():
    wallet = check_history.get_wallet_address()
    if not wallet:
        return {"error": "Geen geldige wallet gevonden."}
    
    print("Market: Balansgegevens ophalen...", flush=True)
    balance_data = check_history.check_balance(wallet)
    
    # KILOCLAW WORDT LOSGELATEN op SOL en Trending
    print("Market: Kiloclaw marktanalyse starten...", flush=True)
    sol_market_data = kiloclaw_scraper.claw_market_data(config.SOL_MINT)
    trending_pairs = kiloclaw_scraper.scan_trending_pairs()
    
    return {
        "wallet_address": wallet,
        "sol_balance": balance_data.get("sol_balance", 0),
        "tokens": balance_data.get("tokens", []),
        "live_market_data": {"SOL": sol_market_data, "trending": trending_pairs},
        "limits": {
            "MIN_SOL_RESERVE": config.MIN_SOL_RESERVE,
            "MAX_TRADE_SOL": config.MAX_TRADE_SOL
        },
        "current_focus": "GOD MODE: Maximize Profit. Use conviction-based sizing. Front-run narratives.",
    }

def analyze_and_decide(context):
    if not client:
        return None

    print(f"Magnolia: Syndicaat-data verwerken met {config.GEMINI_MODEL} in GOD MODE...", flush=True)
    
    prompt = f"""
    Je bent Magnolia, de Supreme Commander van het Weerzone Crypto Syndicaat op Solana.
    Je staat in GOD MODE. Je bent niet langer gebonden aan statische volumes; je zoekt naar de hoogste ROI.
    
    ON-CHAIN CONTEXT & PANOPTICON VISION:
    {json.dumps(context, indent=2)}

    STRATEGISCHE OPDRACHT:
    1. **Panopticon Analyse**: Bekijk de 'trending' tokens. Als een token extreme momentum toont, wees bereid om SOL daarheen te swappen voor een snelle flip.
    2. **Conviction-Based Sizing**: Je bepaalt zelf hoeveel SOL je inzet (maximaal {config.MAX_TRADE_SOL} SOL per trade), gebaseerd op je overtuiging (Conviction Score 0-100%).
       - Bij 90% conviction zet je het maximum in.
       - Bij 20% conviction (puur voor volume/airdrop) zet je 0.01 in.
       - Laat ALTIJD minimaal {config.MIN_SOL_RESERVE} SOL in de wallet voor gas.
    3. **Oogsten**: Als je portfolio winst laat zien op altcoins, swap dan agressief terug naar SOL (of USDC) om winst veilig te stellen.
    4. **Chain of Thought**: Schrijf eerst een 'Macro Thesis', dan een 'Risico Analyse', en bepaal pas dan je actie.

    Antwoord ALTIJD en ALLEEN in JSON formaat met deze velden:
    {{
        "macro_thesis": "Jouw visie op de huidige data",
        "risk_analysis": "Wat kan er misgaan?",
        "conviction_score_pct": 85,
        "action": "SWAP" | "HOLD" | "SCAN_AIRDROPS" | "DEPOSIT_KAMINO",
        "params": {{
            "from": "MINT_ADDRESS",
            "to": "MINT_ADDRESS",
            "amount_sol": 0.05
        }}
    }}
    """

    try:
        response = client.models.generate_content(
            model=config.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        return json.loads(response.text)
    except Exception as e:
        print(f"❌ Magnolia Hersenfout: {e}", flush=True)
        return None

def execute_decision(decision, current_sol_balance, tokens):
    if not decision: return
        
    action = decision.get("action")
    print(f"\n🧠 God Mode Thesis: {decision.get('macro_thesis')}", flush=True)
    print(f"⚖️ Conviction: {decision.get('conviction_score_pct')}% | Action: {action}", flush=True)
    
    if action == "SWAP":
        params = decision.get("params", {})
        try:
            # Dynamische sizing op basis van de LLM
            amount_sol = float(params.get('amount_sol', 0.01))
            
            # Veiligheidslimiet hardcoded forceren (Paperclip 2.0 fallback)
            if amount_sol > config.MAX_TRADE_SOL:
                print(f"⚠️ Magnolia wilde {amount_sol} swappen. Afgetopt op MAX_TRADE_SOL ({config.MAX_TRADE_SOL}).", flush=True)
                amount_sol = config.MAX_TRADE_SOL
                
        except (ValueError, TypeError) as e:
            print(f"Debug: Fout bij float conversie: {e}. Fallback naar 0.01", flush=True)
            amount_sol = 0.01
            
        amount_lamports = int(amount_sol * 1_000_000_000)
        
        target_from = params.get('from', config.SOL_MINT)
        target_to = params.get('to', config.USDC_MINT)
            
        swap_params = {
            "from": target_from,
            "to": target_to,
            "amount_lamports": amount_lamports
        }
        
        print(f"Debug: Start Paperclip audit...", flush=True)
        is_approved, reason = paperclip_optimizer.evaluate_trade(swap_params, current_sol_balance)
        
        if is_approved:
            print(f"🔄 Magnolia (God Mode): LIVE SWAP gestart ({amount_sol} SOL) naar {target_to}...", flush=True)
            try:
                sig = jupiter_swap.swap(swap_params.get('from'), swap_params.get('to'), swap_params.get('amount_lamports'))
                if sig:
                    hermes_logger.log_action("Magnolia", "god_mode_trade", f"Syndicaat trade succesvol: {amount_sol} {target_from[:4]} -> {target_to[:4]}. Sig: {sig}")
            except Exception as e:
                print(f"⚠️ Executiefout: {e}.", flush=True)
        else:
            print(f"🛑 Paperclip Veto: {reason}", flush=True)
            
    elif action == "DEPOSIT_KAMINO":
        params = decision.get("params", {})
        try:
            amount = float(params.get('amount', 0))
        except (ValueError, TypeError):
            amount = 0
        
        usdc_balance = next((t['balance'] for t in tokens if t['mint'] == config.USDC_MINT), 0)
        
        if usdc_balance >= amount and amount > 0:
            print(f"🖇️ Magnolia: Kapitaal naar de Kamino Vault sturen...", flush=True)
            sig = kamino_vault.deposit_usdc(amount)
            if sig:
                hermes_logger.log_action("Magnolia", "yield_farming", f"USDC gestort in Kamino: {sig}")
        else:
            print(f"⚠️ Magnolia: Onvoldoende USDC voor Kamino deposit ({usdc_balance} < {amount}).", flush=True)

    elif action == "SCAN_AIRDROPS":
        import airdrop_farmer
        wallet = check_history.get_wallet_address()
        airdrop_farmer.scan_airdrop_eligibility(wallet)
        hermes_logger.log_action("Magnolia", "system_check", "Airdrop scan uitgevoerd.")

def run_syndicate():
    iteration = 0
    while True:
        print("\n" + "="*45, flush=True)
        print("--- WEERZONE CRYPTO SYNDICAAT - MAGNOLIA FLASH ---", flush=True)
        print("="*45, flush=True)
        
        try:
            context = get_market_context()
            if "error" not in context:
                # Heartbeat logging
                if iteration % 5 == 0:
                    sol_bal = context.get('sol_balance', 0)
                    hermes_logger.log_action("Magnolia", "system_check", f"God Mode online. Balans: {sol_bal:.4f} SOL", status="active")
                
                decision = analyze_and_decide(context)
                if decision:
                    execute_decision(decision, context.get('sol_balance', 0), context.get('tokens', []))
                else:
                    print("⚠️ Magnolia kon geen besluit nemen.", flush=True)
            
            iteration += 1
        except Exception as e:
            print(f"❌ Systeemfout: {e}", flush=True)

        print("\n😴 Magnolia analyseert de volgende zet (30s rust)...", flush=True)
        time.sleep(30)

if __name__ == "__main__":
    run_syndicate()
