import os
import json
import time
import sys
import httpx
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
import guardian_jito
import banker_jlp
import hunter_polymarket
import fleet_orchestrator

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

    # 3-HEADED MONSTER DATA GATHERING
    print("Market: 3-Headed Monster tools activeren...", flush=True)
    jito_stats = guardian_jito.get_jito_yield()
    jlp_stats = banker_jlp.get_jlp_yield()
    polymarket_opps = hunter_polymarket.scan_polymarket_opportunities(limit=5)
    
    return {
        "wallet_address": wallet,
        "sol_balance": balance_data.get("sol_balance", 0),
        "tokens": balance_data.get("tokens", []),
        "live_market_data": {"SOL": sol_market_data, "trending": trending_pairs},
        "protocols_data": {
            "guardian_jito": jito_stats,
            "banker_jlp": jlp_stats,
            "hunter_polymarket": polymarket_opps
        },
        "limits": {
            "MIN_SOL_RESERVE": config.MIN_SOL_RESERVE,
            "MAX_TRADE_SOL": config.MAX_TRADE_SOL
        },
        "current_focus": "3-HEADED MONSTER: Passive Income & Asymmetric Arbitrage.",
    }

def analyze_and_decide(context):
    if not config.OPENROUTER_API_KEY:
        print("❌ Geen OpenRouter API key gevonden.", flush=True)
        return None

    print(f"Magnolia: Syndicaat-data verwerken met {config.OPENROUTER_MODEL} via OpenRouter...", flush=True)
    
    prompt = f"""
    Je bent Magnolia, een 3-Headed AI-Agent aangestuurd door Gemini 3 Flash infrastructuur (nu via OpenRouter).
    Je bent de kapitein van een vloot: Hermes (Executie) en Paperclip (Geheugen/Context).
    Je missie: €2.700 passieve cashflow per maand tegen 1 januari 2027 voor Rowano.

    DE VLOOT:
    - **Hermes**: Jouw handen. Verstuurt orders naar Solana/Polygon.
    - **Paperclip**: Jouw geheugen. Slaat elke trade en winst op. Blokkeert 'revenge trading' en emotionele gokken.

    JE PROTOCOLLEN:
    1. **The Guardian (SOL/JitoSOL)**: Gebruik Hermes voor staking. Genereer 'Airdrop-warmte'. Paperclip monitort Jupuary 2027 criteria.
       - JitoSOL Mint: J1toso9Y9YvrtbC9GLSiykxy9T9pGpFUn8pCH69R6YcE
    2. **The Banker (JLP)**: Beheer liquiditeit op Jupiter via Hermes. Incasseer fees van traders. Paperclip houdt dagelijkse yield bij.
       - JLP Mint: 27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4
    3. **The Hunter (Polymarket - Vitalik Methode)**: Scan via Hermes APIs. Zoek naar 'Anti-Insanity' trades (short hype, buy 'No').

    ON-CHAIN CONTEXT & PANOPTICON VISION:
    {json.dumps(context, indent=2)}

    DWINGENDE UITVOERINGSREGELS:
    - Directe Actie: Hermes voert alleen trades uit met een wiskundig 'Unfair Advantage'.
    - Geen Ruis: Rapporteer alleen in ROI en concrete getallen.
    - Zelfcorrectie: Analyseer na elke trade: "Was dit ratio of emotie?" Gebruik Paperclip om fouten uit 2024 te vermijden.

    Antwoord ALTIJD en ALLEEN in JSON formaat met deze velden:
    {{
        "macro_thesis": "Guardian/Banker/Hunter visie",
        "self_correction_audit": "Ratio vs Emotie check",
        "action": "SWAP" | "HOLD" | "SCAN_AIRDROPS" | "DEPOSIT_KAMINO",
        "params": {{
            "from": "MINT_ADDRESS",
            "to": "MINT_ADDRESS",
            "amount_sol": 0.05
        }},
        "paperclip_memory_note": "Wat moet Paperclip onthouden van deze move?"
    }}
    """

    try:
        with httpx.Client(timeout=45.0) as client:
            res = client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {config.OPENROUTER_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": config.OPENROUTER_MODEL,
                    "messages": [{"role": "user", "content": prompt}]
                }
            )
            res.raise_for_status()
            data = res.json()
            content = data['choices'][0]['message']['content']
            
            # Sommige modellen zetten JSON in code blocks
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            return json.loads(content)
            
    except Exception as e:
        print(f"❌ Magnolia Hersenfout (OpenRouter): {e}", flush=True)
        return None

def execute_decision(decision, current_sol_balance, tokens):
    if not decision: return
        
    action = decision.get("action")
    print(f"\n🧠 God Mode Thesis: {decision.get('macro_thesis')}", flush=True)
    print(f"⚖️ Audit: {decision.get('self_correction_audit')}", flush=True)
    print(f"⚖️ Action: {action}", flush=True)

    # Paperclip: Sla de gedachte op
    note = decision.get("paperclip_memory_note", "")
    if note:
        fleet_orchestrator.paperclip.remember(note)
    
    # Paperclip Audit Check
    is_safe, audit_msg = fleet_orchestrator.paperclip.audit(decision)
    if not is_safe:
        print(f"🛑 Paperclip Veto: {audit_msg}", flush=True)
        return

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

        print("\n😴 Magnolia analyseert de volgende zet (15m rust)...", flush=True)
        time.sleep(900)

if __name__ == "__main__":
    run_syndicate()
